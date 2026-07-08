// NLHE hand engine — the headless state machine for ONE hand, deal to pot award.
// CORRECTNESS-CRITICAL. Pure logic, no React, no I/O.
//
// Drives: post blinds -> deal hole cards -> preflop/flop/turn/river betting
// rounds -> showdown -> award pot(s). Enforces legal actions, min-raise sizing,
// all-in / short-all-in rules, betting-round completion, street advancement, and
// side/split-pot awarding (via pot.js + /engine's evaluator).
//
// STATE IS TREATED AS IMMUTABLE FROM THE OUTSIDE: applyAction returns a NEW state
// (deep clone) and never mutates the one passed in, so a caller can hold history.
//
// -------------------------------------------------------------------------
// BETTING-RULE MODEL (the subtle bits, flagged for review)
// -------------------------------------------------------------------------
// currentBet    - the highest street-commitment any player must match this street.
// lastRaiseSize - the size of the last FULL raise increment; the minimum a legal
//                 voluntary raise must add on top of currentBet. Reset to the big
//                 blind at the start of every street (min bet/raise = one BB).
// player.hasActed - has this player acted since betting was last (re-)opened to
//                 them? Reset to false for everyone at the start of a street, and
//                 for all still-active players when a FULL raise re-opens betting.
//
// A player must act when: still 'active' AND (hasn't acted yet OR hasn't matched
// currentBet). A betting round is complete when no such player remains.
//
// SHORT ALL-IN (all-in for less than a full raise): it increases currentBet (so
// players who haven't matched still owe the difference — they may CALL or FOLD)
// but does NOT re-open betting — players who already acted may not re-raise. This
// is exactly why "may raise" is gated on hasActed, and why a short all-in does
// NOT reset hasActed. A FULL raise (increment >= lastRaiseSize) re-opens for all.

import { createDeck } from '../../engine/deck.js'
import { findWinners } from '../../engine/evaluator.js'
import { mulberry32, shuffleWith } from './rng.js'
import {
  positionLabels,
  smallBlindIndex,
  bigBlindIndex,
  firstToActPreflop,
  firstToActPostflop,
} from './positions.js'
import { computeSidePots, splitPot } from './pot.js'

const STREETS = ['preflop', 'flop', 'turn', 'river']
const BOARD_TARGET = { preflop: 0, flop: 3, turn: 4, river: 5 }

/**
 * Start a new hand and post blinds. Returns the initial state with the first
 * player to act set (or an already-complete hand if everyone is all-in on
 * blinds, which can't normally happen with sane stacks).
 *
 * @param {Object} config
 * @param {{id?: string|number, stack: number}[]} config.players - 2–6 players in
 *        seat order; `stack` is chips at the start of the hand (integer > 0).
 * @param {number} config.buttonIndex - seat index of the button.
 * @param {{sb: number, bb: number}} config.blinds - blind sizes (integers).
 * @param {Object} [config.deal] - determinism controls (pick one):
 * @param {string[]} [config.deal.deck] - a full pre-arranged deck (canonical card
 *        strings). Hole cards are dealt player-by-player starting at the small
 *        blind (2 each), then flop (3), turn (1), river (1). No burn cards.
 * @param {number} [config.deal.seed] - seed for a reproducible shuffle instead.
 * @returns {HandState}
 */
export function startHand({ players, buttonIndex, blinds, deal = {} }) {
  const n = players.length
  if (n < 2 || n > 6) throw new Error(`Need 2–6 players, got ${n}`)
  if (buttonIndex < 0 || buttonIndex >= n) throw new Error('buttonIndex out of range')
  if (!blinds || blinds.bb <= 0 || blinds.sb <= 0) throw new Error('Invalid blinds')

  const labels = positionLabels(n, buttonIndex)
  const deck =
    deal.deck != null
      ? deal.deck.slice()
      : shuffleWith(createDeck(), deal.seed != null ? mulberry32(deal.seed) : undefined)

  const state = {
    players: players.map((p, i) => ({
      id: p.id ?? i,
      seat: i,
      position: labels[i],
      stack: p.stack,
      holeCards: [],
      committed: 0, // total in the pot across all streets
      streetCommitted: 0, // in the pot this street
      status: 'active', // 'active' | 'folded' | 'allin'
      hasActed: false,
    })),
    buttonIndex,
    blinds: { ...blinds },
    deck,
    board: [],
    street: 'preflop',
    currentBet: 0,
    lastRaiseSize: blinds.bb, // min bet/raise increment
    toActIndex: -1,
    complete: false,
    pots: [], // filled at showdown
    payouts: [], // [{ index, amount }] filled at award
    log: [], // human-readable action trace
  }

  postBlinds(state)
  dealHoleCards(state)

  // Preflop first actor (skip anyone all-in from posting a blind).
  state.toActIndex = advanceFrom(state, firstToActPreflop(n, buttonIndex), true)
  if (state.toActIndex === -1) {
    // No one can act (all-in on blinds) — run it out.
    concludeBettingRound(state)
  }
  return state
}

/** Post small and big blinds (all-in for less if a stack is too short). */
function postBlinds(state) {
  const n = state.players.length
  const sb = state.players[smallBlindIndex(n, state.buttonIndex)]
  const bb = state.players[bigBlindIndex(n, state.buttonIndex)]
  commit(sb, state.blinds.sb)
  commit(bb, state.blinds.bb)
  // Big blind is the nominal bet to match even if a blind is short all-in.
  state.currentBet = state.blinds.bb
  state.log.push(`${sb.position} posts SB ${Math.min(state.blinds.sb, sb.committed)}`)
  state.log.push(`${bb.position} posts BB ${Math.min(state.blinds.bb, bb.committed)}`)
}

/** Deal 2 hole cards to each player, starting at the SB, going clockwise. */
function dealHoleCards(state) {
  const n = state.players.length
  const start = smallBlindIndex(n, state.buttonIndex)
  let d = 0
  for (let round = 0; round < 2; round++) {
    for (let k = 0; k < n; k++) {
      const p = state.players[(start + k) % n]
      p.holeCards.push(state.deck[d++])
    }
  }
  state.dealtCount = d // board cards come off the deck after the hole cards
}

/**
 * Move chips from a player's stack into the pot, updating both committed totals
 * and marking all-in when the stack hits zero. Never lets a player put in more
 * than they have.
 */
function commit(player, amount) {
  const pay = Math.min(amount, player.stack)
  player.stack -= pay
  player.streetCommitted += pay
  player.committed += pay
  if (player.stack === 0) player.status = 'allin'
  return pay
}

// ---------------------------------------------------------------------------
// Legal actions
// ---------------------------------------------------------------------------

/**
 * The actions the player-to-act may legally take right now.
 *
 * For bet/raise, `min`/`max` are TO-amounts (total street commitment after the
 * action), not increments. A raise is allowed for less than `min` ONLY as an
 * all-in (max === the short all-in amount); in that case min is clamped to max.
 *
 * @param {HandState} state
 * @returns {{ toAct: number, actions: LegalAction[] }} toAct is -1 if the hand is
 *          over (actions empty).
 */
export function getLegalActions(state) {
  if (state.complete || state.toActIndex === -1) return { toAct: -1, actions: [] }
  const p = state.players[state.toActIndex]
  const toCall = state.currentBet - p.streetCommitted
  const actions = []

  if (toCall <= 0) {
    // Nothing to call: check, and optionally open (bet) or exercise the BB option (raise).
    actions.push({ type: 'check' })
    if (p.stack > 0) {
      if (state.currentBet === 0) {
        const min = Math.min(state.blinds.bb, p.stack)
        actions.push({ type: 'bet', min, max: p.stack })
      } else {
        // BB option: currentBet already matched but player may still raise.
        const raise = raiseBounds(state, p)
        if (raise) actions.push(raise)
      }
    }
  } else {
    actions.push({ type: 'fold' })
    // Call — all-in for less if the stack can't cover the full call.
    actions.push({ type: 'call', amount: Math.min(toCall, p.stack) })
    // Raise only if entitled (hasn't acted since betting was last opened) and
    // has chips beyond the call.
    if (!p.hasActed && p.stack > toCall) {
      const raise = raiseBounds(state, p)
      if (raise) actions.push(raise)
    }
  }
  return { toAct: state.toActIndex, actions }
}

/** Build the {type:'raise', min, max} descriptor, or null if impossible. */
function raiseBounds(state, p) {
  const maxTo = p.streetCommitted + p.stack // all-in to-amount
  if (maxTo <= state.currentBet) return null // can't even raise above current bet
  const fullMinTo = state.currentBet + state.lastRaiseSize
  const minTo = Math.min(fullMinTo, maxTo) // short all-in allowed below full min
  return { type: 'raise', min: minTo, max: maxTo }
}

// ---------------------------------------------------------------------------
// Apply an action
// ---------------------------------------------------------------------------

/**
 * Apply an action for the player to act and return the resulting NEW state.
 * Throws if the action is illegal for the current state.
 *
 * @param {HandState} state
 * @param {{type:'fold'|'check'|'call'|'bet'|'raise', amount?: number}} action
 *        For 'bet'/'raise', `amount` is the TO-amount (total street commitment).
 * @returns {HandState}
 */
export function applyAction(state, action) {
  if (state.complete) throw new Error('Hand is already complete')
  const next = structuredClone(state)
  const p = next.players[next.toActIndex]
  const toCall = next.currentBet - p.streetCommitted

  switch (action.type) {
    case 'fold': {
      p.status = 'folded'
      p.hasActed = true
      next.log.push(`${p.position} folds`)
      break
    }
    case 'check': {
      if (toCall > 0) throw new Error('Cannot check facing a bet')
      p.hasActed = true
      next.log.push(`${p.position} checks`)
      break
    }
    case 'call': {
      if (toCall <= 0) throw new Error('Nothing to call')
      const paid = commit(p, toCall)
      p.hasActed = true
      next.log.push(`${p.position} calls ${paid}`)
      break
    }
    case 'bet':
    case 'raise': {
      applyBetOrRaise(next, p, action)
      break
    }
    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }

  // Only one player left un-folded → hand ends immediately, no showdown.
  const live = next.players.filter((x) => x.status !== 'folded')
  if (live.length === 1) {
    awardUncontested(next, live[0])
    return next
  }

  // Otherwise find the next player who must act; if none, the round is complete.
  const nxt = advanceFrom(next, (next.toActIndex + 1) % next.players.length, false)
  if (nxt === -1) {
    concludeBettingRound(next)
  } else {
    next.toActIndex = nxt
  }
  return next
}

/** Validate + apply a bet (open) or raise; updates currentBet / lastRaiseSize. */
function applyBetOrRaise(state, p, action) {
  const isBet = action.type === 'bet'
  if (isBet && state.currentBet !== 0) throw new Error('Cannot bet — there is a bet to raise')
  if (!isBet && p.hasActed) throw new Error('Not entitled to raise (already acted this round)')

  const bounds = isBet
    ? (() => {
        if (p.stack <= 0) return null
        return { min: Math.min(state.blinds.bb, p.stack), max: p.stack }
      })()
    : raiseBounds(state, p)
  if (!bounds) throw new Error(`Illegal ${action.type}`)

  const to = action.amount
  if (!Number.isInteger(to)) throw new Error(`${action.type} amount must be an integer`)
  if (to > bounds.max) throw new Error(`${action.type} exceeds stack (max ${bounds.max})`)
  if (to < bounds.min) throw new Error(`${action.type} below minimum (min ${bounds.min})`)

  const increment = to - state.currentBet
  const pay = to - p.streetCommitted
  commit(p, pay)

  const fullRaise = increment >= state.lastRaiseSize
  state.currentBet = to
  if (fullRaise) {
    state.lastRaiseSize = increment
    // A full raise re-opens betting for everyone still able to act.
    for (const other of state.players) {
      if (other !== p && other.status === 'active') other.hasActed = false
    }
  }
  p.hasActed = true
  const verb = isBet ? 'bets' : 'raises to'
  const tag = fullRaise ? '' : ' (short all-in)'
  state.log.push(`${p.position} ${verb} ${to}${tag}`)
}

// ---------------------------------------------------------------------------
// Round / street progression
// ---------------------------------------------------------------------------

/**
 * Find the next seat that still needs to act, scanning clockwise from `from`.
 * @param {HandState} state
 * @param {number} from - seat index to start scanning at
 * @param {boolean} inclusive - if true, `from` itself is considered first
 * @returns {number} seat index, or -1 if no one needs to act
 */
function advanceFrom(state, from, inclusive) {
  const n = state.players.length
  for (let k = inclusive ? 0 : 1; k <= n; k++) {
    const idx = (from + (inclusive ? k : k - 1)) % n
    if (needsToAct(state, state.players[idx])) return idx
  }
  return -1
}

/** A player must act if active and either hasn't acted or hasn't matched the bet. */
function needsToAct(state, p) {
  if (p.status !== 'active') return false
  return !p.hasActed || p.streetCommitted < state.currentBet
}

/**
 * Called when a betting round closes (no one left to act). Returns any uncalled
 * bet, then either advances to the next street, runs the board out if no further
 * betting is possible, or goes to showdown after the river.
 */
function concludeBettingRound(state) {
  returnUncalledBet(state)

  const live = state.players.filter((p) => p.status !== 'folded')
  const canStillAct = state.players.filter((p) => p.status === 'active')

  // No further betting possible (all but ≤1 are all-in) OR the river is done:
  // deal out the remaining board and go to showdown.
  if (state.street === 'river' || canStillAct.length <= 1) {
    dealRemainingBoard(state)
    goToShowdown(state)
    return
  }

  // Advance to the next street and open a fresh betting round.
  const idx = STREETS.indexOf(state.street)
  state.street = STREETS[idx + 1]
  dealBoardTo(state, BOARD_TARGET[state.street])
  for (const p of state.players) {
    p.streetCommitted = 0
    if (p.status === 'active') p.hasActed = false
  }
  state.currentBet = 0
  state.lastRaiseSize = state.blinds.bb
  state.toActIndex = advanceFrom(
    state,
    firstToActPostflop(state.players.length, state.buttonIndex),
    true,
  )
  // Everyone remaining is all-in (rare): no one to act — run it out.
  if (state.toActIndex === -1) {
    dealRemainingBoard(state)
    goToShowdown(state)
  }
}

/**
 * Return an uncalled bet to the last aggressor. If the top street-commitment
 * belongs to a single player and exceeds the next-highest, the excess was never
 * called — refund it (chips back to stack, out of committed). Standard rule; also
 * prevents an unwinnable pot layer with no eligible players.
 */
function returnUncalledBet(state) {
  const contenders = state.players.filter((p) => p.status !== 'folded')
  if (contenders.length === 0) return
  let top = -Infinity
  let second = -Infinity
  let topPlayer = null
  for (const p of state.players) {
    const c = p.streetCommitted
    if (c > top) {
      second = top
      top = c
      topPlayer = p
    } else if (c > second) {
      second = c
    }
  }
  const excess = top - Math.max(second, 0)
  if (excess > 0 && topPlayer) {
    topPlayer.stack += excess
    topPlayer.streetCommitted -= excess
    topPlayer.committed -= excess
    if (topPlayer.stack > 0 && topPlayer.status === 'allin') topPlayer.status = 'active'
    state.log.push(`${topPlayer.position} gets back uncalled ${excess}`)
  }
}

/** Deal board cards until it reaches `target` size, off the top of the stub. */
function dealBoardTo(state, target) {
  while (state.board.length < target) {
    state.board.push(state.deck[state.dealtCount++])
  }
}

/** Fill the board to 5 cards (used for all-in runouts and at showdown). */
function dealRemainingBoard(state) {
  dealBoardTo(state, 5)
}

// ---------------------------------------------------------------------------
// Showdown & pot award
// ---------------------------------------------------------------------------

/** Award the whole pot to the sole remaining player (everyone else folded). */
function awardUncontested(state, winner) {
  returnUncalledBet(state)
  const total = state.players.reduce((s, p) => s + p.committed, 0)
  state.pots = [{ amount: total, eligible: [winner.seat] }]
  winner.stack += total
  state.payouts = [{ index: winner.seat, amount: total }]
  state.street = 'complete'
  state.complete = true
  state.toActIndex = -1
  state.log.push(`${winner.position} wins ${total} uncontested`)
}

/** Resolve a showdown: build side pots and award each to its best hand(s). */
function goToShowdown(state) {
  const n = state.players.length
  const pots = computeSidePots(
    state.players.map((p) => ({ committed: p.committed, folded: p.status === 'folded' })),
  )
  state.pots = pots

  const payouts = new Map() // seat -> chips
  for (const pot of pots) {
    if (pot.eligible.length === 0) {
      // Should not occur (uncalled bets are refunded first). Safety: refund the
      // layer equally to its non-existent contributors is impossible, so award
      // to any live player — but log it loudly.
      state.log.push(`WARNING: pot layer of ${pot.amount} had no eligible players`)
      continue
    }
    const winners = potWinners(state, pot.eligible)
    const ordered = orderForOddChip(state, winners)
    const split = splitPot(pot.amount, ordered)
    for (const [seat, chips] of split) {
      payouts.set(seat, (payouts.get(seat) ?? 0) + chips)
      state.players[seat].stack += chips
    }
  }

  state.payouts = [...payouts.entries()].map(([index, amount]) => ({ index, amount }))
  for (const { index, amount } of state.payouts) {
    state.log.push(`${state.players[index].position} wins ${amount} at showdown`)
  }
  state.street = 'complete'
  state.complete = true
  state.toActIndex = -1
}

/** The eligible seats holding the best hand for one pot (ties => multiple). */
function potWinners(state, eligibleSeats) {
  if (eligibleSeats.length === 1) return eligibleSeats.slice()
  const holes = eligibleSeats.map((seat) => state.players[seat].holeCards)
  const { winners } = findWinners(holes, state.board)
  return winners.map((localIdx) => eligibleSeats[localIdx])
}

/** Order tied winners for odd-chip priority: first live seat left of the button. */
function orderForOddChip(state, seats) {
  const n = state.players.length
  const rank = (seat) => (seat - state.buttonIndex - 1 + n) % n
  return seats.slice().sort((a, b) => rank(a) - rank(b))
}

// ---------------------------------------------------------------------------
// Read-only queries
// ---------------------------------------------------------------------------

/** Total chips currently in all pots (sum of everyone's committed). */
export function potTotal(state) {
  return state.players.reduce((s, p) => s + p.committed, 0)
}

/** A compact, serializable snapshot of the hand for a UI or bot to read. */
export function viewState(state) {
  return {
    street: state.street,
    board: state.board.slice(),
    pot: potTotal(state),
    currentBet: state.currentBet,
    toAct: state.toActIndex,
    complete: state.complete,
    players: state.players.map((p) => ({
      id: p.id,
      seat: p.seat,
      position: p.position,
      stack: p.stack,
      committed: p.committed,
      streetCommitted: p.streetCommitted,
      status: p.status,
      holeCards: p.holeCards.slice(),
    })),
    pots: state.pots.map((pot) => ({ ...pot, eligible: pot.eligible.slice() })),
    payouts: state.payouts.slice(),
    log: state.log.slice(),
  }
}
