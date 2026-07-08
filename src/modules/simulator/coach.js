// Coach mode for the Local Play Simulator (CLAUDE.md §4, Module 5).
//
// Turns the table into a guided tutorial with plain-English, beginner-friendly
// explanations at each decision point. This file owns NO new poker judgment — it
// is a thin narrator that REUSES the existing analysis modules and translates
// their output into simple language:
//
//   • Preflop hand strength  → range-trainer RFI chart + BB-defense chart
//                              (../range-trainer/ranges.js)
//   • Postflop hand strength → postflop-trainer analyzer
//                              (../postflop-trainer/handStrength.js)
//   • Postflop decisions      → postflop-trainer heuristics
//                              (../postflop-trainer/heuristics.js)
//   • Board texture / range   → board-reader (../board-reader/*)
//   • Made-hand naming        → /engine evaluator
//
// ⚠️ APPROXIMATIONS are flagged inline with "APPROX:" where the simulator asks a
// question the source module doesn't answer exactly (see each site). Everything
// here is advisory — the human always acts freely; the coach only suggests.

import {
  handToken,
  getAction,
  getBBDefAction,
  bbDefWhyText,
  BBDEF_POSITIONS,
} from '../range-trainer/ranges.js'
import { analyzeHand } from '../postflop-trainer/handStrength.js'
import {
  cbetDecision,
  facingDecision,
  requiredEquityFromFrac,
} from '../postflop-trainer/heuristics.js'
import { classifyTexture } from '../board-reader/texture.js'
import { favorFlop } from '../board-reader/rangeInteraction.js'
import { evaluateHand } from '../../engine/evaluator.js'

// ── Archetype descriptions (plain-English, term defined on first use) ─────────
// Keyed by the bot id stored per seat ('nit' | 'station' | 'tag').
export const ARCHETYPE_INFO = {
  nit: {
    name: 'Nit',
    // "Nit" = an extremely tight player who only plays premium hands.
    gloss: 'an extremely tight player who only plays premium hands',
  },
  station: {
    name: 'calling station',
    // "Calling station" = a loose player who calls with almost anything.
    gloss: 'a loose player who calls with almost anything and hates folding',
  },
  tag: {
    name: 'TAG',
    // "TAG" = tight-aggressive: plays few hands, but bets and raises them hard.
    gloss: 'a tight-aggressive player — plays few hands but bets them hard',
  },
}

// Friendly verb for each recommended action the heuristics can return.
const VERB = {
  raise: 'Raise',
  call: 'Call',
  fold: 'Fold',
  check: 'Check',
  bet: 'Bet',
  cbet: 'Bet',
  '3bet': 'Re-raise (3-bet)',
}

// ── Explaining an opponent's action ───────────────────────────────────────────

// Collapse a concrete action into the three things a beginner reads off it.
function actionClass(type) {
  if (type === 'bet' || type === 'raise') return 'aggro'
  return type // 'call' | 'check' | 'fold'
}

/**
 * A short, beginner-friendly read on what a bot just did, from its archetype.
 * Bots never reveal cards, so this leans only on style + action (never hole cards).
 * @param {'nit'|'station'|'tag'} archId
 * @param {{type:string}} action
 * @returns {string}
 */
export function explainBotAction(archId, action) {
  const info = ARCHETYPE_INFO[archId]
  if (!info) return '' // unknown archetype (shouldn't happen) → say nothing
  const who = `The ${info.name} (${info.gloss})`
  const cls = actionClass(action.type)

  switch (archId) {
    case 'tag':
      if (cls === 'aggro')
        return `${who} raised. Tight-aggressive players rarely bluff, so this usually means a genuinely strong hand — be careful.`
      if (cls === 'call')
        return `${who} just called. A TAG prefers to raise its best hands, so a flat call often means a decent-but-not-huge holding, or a draw.`
      if (cls === 'check')
        return `${who} checked — with a tight-aggressive player that usually means they missed the board or don't want to build a big pot.`
      return `${who} folded. Tight players give up easily when they miss; there's nothing more to read into it.`
    case 'nit':
      if (cls === 'aggro')
        return `${who} put money in. Nits only play premium hands, so a bet or raise from one is a big red flag for real strength.`
      if (cls === 'call')
        return `${who} called. Even a call is a strong signal from such a tight player — they don't get involved without a real hand.`
      if (cls === 'check')
        return `${who} checked — probably a hand they're unsure about, or they're slow-playing. Proceed carefully.`
      return `${who} folded, which is what nits do most of the time. No information beyond that.`
    case 'station':
      if (cls === 'aggro')
        return `${who} actually bet/raised — unusual for a player who mostly just calls, so it's more likely real strength than a bluff.`
      if (cls === 'call')
        return `${who} just called. Stations call with almost anything, so this tells you very little about their hand.`
      if (cls === 'check')
        return `${who} checked — they'll call a bet but rarely lead out, so this is normal and uninformative.`
      return `${who} folded — since stations almost never fold, they very likely had nothing at all.`
    default:
      return ''
  }
}

// ── Advising the hero ─────────────────────────────────────────────────────────

// Preflop strength tier from the RFI chart, reusing the public getAction lookup.
// Mirrors the bots' preflopTier ladder (bots.js) via the same shared chart data:
// a hand that opens from a tighter seat is stronger. 3 premium … 0 junk.
function preflopTier(token) {
  const opens = (pos) => getAction(pos, token) === 'raise'
  if (opens('UTG')) return 3
  if (opens('CO')) return 2
  if (opens('BTN')) return 1
  return 0
}

// Preflop: is the hand playable from hero's seat, noting if a raise is in front.
function advisePreflop({ token, position, facingRaise, isBB, canCheck, raiserPos }) {
  // Big blind, unraised: you've already posted — take the free flop.
  if (isBB && !facingRaise && canCheck) {
    return {
      action: 'Check',
      reason: `You're in the big blind (a forced bet you've already put in) and no one raised. You can see the flop for free — just check.`,
      approx: false,
    }
  }

  if (!facingRaise) {
    // Open-raise-or-fold decision, straight from the RFI opening chart.
    const rfi = getAction(position, token) // 'raise' | 'fold'
    return rfi === 'raise'
      ? {
          action: 'Raise',
          reason: `${token} is inside the standard opening range for your seat (${position}) — strong enough to open with a raise.`,
          approx: false,
        }
      : {
          action: 'Fold',
          reason: `${token} is below the opening threshold for ${position} — not strong enough to enter the pot from here.`,
          approx: false,
        }
  }

  // Facing a raise. The range-trainer's BB-defense chart is the one piece of
  // existing data that answers "continue vs a raise?" (call / 3-bet / fold), so we
  // reuse it whenever we know the raiser's seat. It's EXACT when hero is the big
  // blind (what the chart is built for) and a reasonable APPROX otherwise (a
  // non-BB hero is in a different spot, but the chart still ranks the hands well).
  if (raiserPos && BBDEF_POSITIONS.includes(raiserPos)) {
    const act = getBBDefAction(raiserPos, token) // '3bet' | 'call' | 'fold'
    if (isBB) {
      return {
        action: VERB[act] ?? VERB.fold,
        reason: `${bbDefWhyText(raiserPos, token, act)} (Assumes a standard single raise.)`,
        approx: false, // exact: this is precisely the BB-defense spot the chart grades
      }
    }
    const note = `(Based on big-blind defense ranges — a rough guide when you're not in the big blind.)`
    const reason =
      act === '3bet'
        ? `${token} is strong enough to re-raise (3-bet) a raise for value. ${note}`
        : act === 'call'
          ? `${token} is playable enough to call the raise, but not to re-raise. ${note}`
          : `${token} is too weak to continue against a raise — fold. ${note}`
    return { action: VERB[act] ?? VERB.fold, reason, approx: true }
  }

  // Fallback only when the raiser's seat is unknown (e.g. a limped pot that got
  // raised). APPROX: grade playability by how premium the hand is on the opening
  // ladder and tighten up because a raise is in front — a coarse simplification.
  const tier = preflopTier(token)
  if (tier >= 2)
    return {
      action: 'Call',
      reason: `${token} is a strong opening hand — good enough to continue against a raise, usually by calling. Save re-raising (3-betting) for your very best hands.`,
      approx: true,
    }
  if (tier === 1)
    return {
      action: 'Fold',
      reason: `${token} is speculative — it plays poorly against a raise. Continue only if the price is very cheap.`,
      approx: true,
    }
  return {
    action: 'Fold',
    reason: `${token} is too weak to continue against a raise — save your chips for a better spot.`,
    approx: true,
  }
}

// River made-hand tier from the exact evaluator (draws no longer matter here).
function riverTier(rank) {
  if (rank >= 3) return 'strong' // two pair or better
  if (rank === 2) return 'pair'
  return 'weak'
}

// Postflop on a completed board (river): a simple made-hand + pot-odds line.
// APPROX: the postflop analyzer/heuristics are built for the flop & turn (they
// reason about draws). Once all five cards are out there are no draws, so the
// coach falls back to made-hand strength plus the price being offered.
function adviseRiver({ hole, board, facingBet, toCall, pot }) {
  const made = evaluateHand(hole, board)
  const tier = riverTier(made.rank)
  const descr = made.descr

  if (facingBet) {
    const betFrac = toCall / Math.max(1, pot - toCall)
    const req = Math.round(requiredEquityFromFrac(betFrac))
    if (tier === 'strong')
      return { action: 'Raise', reason: `You have ${descr} — a strong made hand on the river. Raise (or at least call) to get value.`, approx: true }
    if (tier === 'pair')
      return { action: 'Call', reason: `You have one pair (${descr}). It can win, but with no more cards to come it rarely beats a big bet — call small bets, lean fold vs large ones (you'd need ~${req}% to call).`, approx: true }
    return { action: 'Fold', reason: `You have only ${descr} and there are no more cards to come — nothing to improve to, so fold.`, approx: true }
  }

  if (tier === 'strong')
    return { action: 'Bet', reason: `You have ${descr} — bet the river for value and get paid by worse hands.`, approx: true }
  if (tier === 'pair')
    return { action: 'Check', reason: `One pair (${descr}) on the river is usually a check-and-call, not a bet — betting mostly folds out worse and gets called by better.`, approx: true }
  return { action: 'Check', reason: `You have only ${descr}. Check and give up unless you have a strong reason to bluff.`, approx: true }
}

// Postflop on the flop or turn: reuse the postflop-trainer heuristics directly.
function advisePostflop({ hole, board, facingBet, toCall, pot }) {
  if (board.length >= 5) return adviseRiver({ hole, board, facingBet, toCall, pot })

  const flop = board.slice(0, 3)
  const tex = classifyTexture(flop) // wet/dry + wetness (board-reader)
  const a = analyzeHand(hole, board) // value/draw/marginal/air bucket (postflop-trainer)
  const street = board.length === 3 ? 'flop' : 'turn'
  const have = `You have ${a.madeDescr}.`

  if (facingBet) {
    // APPROX: betFrac = bet ÷ pot-before-your-call. view.pot already includes the
    // bet facing you, so the pot before it is (pot − toCall). Matches the
    // heuristics' definition of bet fraction closely enough for a teaching read.
    const betFrac = toCall / Math.max(1, pot - toCall)
    const dec = facingDecision({
      bucket: a.bucket,
      strongValue: a.strongValue,
      outs: a.outs,
      betFrac,
      street,
      wet: tex.wet,
    })
    return { action: VERB[dec.action] ?? dec.action, reason: `${have} ${dec.why}`, approx: false }
  }

  // No bet facing hero: should you bet or check? Reuse the c-bet policy.
  // APPROX: cbetDecision is framed for the preflop raiser taking the betting lead;
  // we present it as a general "bet vs check" read regardless of who raised.
  const fav = favorFlop(flop)
  const dec = cbetDecision({ bucket: a.bucket, wet: tex.wet, favor: fav.favor })
  return { action: VERB[dec.action] ?? dec.action, reason: `${have} ${dec.why}`, approx: true }
}

/**
 * The coach's suggestion for the hero's current decision.
 * @returns {{action:string, reason:string, approx:boolean}}
 */
export function adviseHero({ hole, board, position, street, currentBet, bb, pot, toCall, isBB, raiserPos }) {
  if (street === 'preflop') {
    const token = handToken(hole[0], hole[1])
    const facingRaise = currentBet > bb // someone put in more than the big blind
    return advisePreflop({ token, position, facingRaise, isBB, canCheck: toCall === 0, raiserPos })
  }
  return advisePostflop({ hole, board, facingBet: toCall > 0, toCall, pot })
}

// ── Explaining the result ─────────────────────────────────────────────────────

/**
 * A plain-English recap at showdown: who won with what, plus one line on the key
 * decision point when identifiable.
 * @returns {{ summary:string, lesson:string }}
 */
export function recapResult({ view, heroSeat, nameBySeat }) {
  const nameOf = (i) => (i === heroSeat ? 'You' : nameBySeat[i] ?? `Seat ${i}`)
  const winners = view.payouts.filter((p) => p.amount > 0)
  const contenders = view.players.filter((p) => p.status !== 'folded')
  const showdown = contenders.length > 1 && view.board.length === 5
  const hero = view.players[heroSeat]
  const heroFolded = hero.status === 'folded'
  const heroWon = winners.some((w) => w.index === heroSeat)

  // Who won, with what.
  const summary = winners
    .map((w) => {
      const p = view.players[w.index]
      const verb = w.index === heroSeat ? 'win' : 'wins'
      const why =
        showdown && p.status !== 'folded' && p.holeCards.length === 2
          ? ` with ${evaluateHand(p.holeCards, view.board).descr}`
          : ' — everyone else folded'
      return `${nameOf(w.index)} ${verb} ${w.amount}${why}.`
    })
    .join(' ')

  // One line on the key decision. APPROX: a general teaching takeaway from the
  // outcome, not a solver read of the specific hand.
  let lesson
  if (heroFolded) {
    lesson = `Key decision: you folded. Letting go when you're likely behind is exactly how you save chips for stronger spots.`
  } else if (heroWon && showdown) {
    lesson = `Key decision: you stayed in with a hand strong enough to win at showdown — that's the payoff for playing solid holdings.`
  } else if (heroWon) {
    lesson = `Key decision: everyone folded to you. Winning without a showdown is a clean result — your strength or pressure got them to give up.`
  } else if (showdown) {
    const winHand = (() => {
      const w = winners[0]
      const p = w && view.players[w.index]
      return p && p.holeCards.length === 2 ? evaluateHand(p.holeCards, view.board).descr : 'a better hand'
    })()
    lesson = `Key decision: you reached showdown but ran into ${winHand}. When you're beaten like this, keeping the pot small on earlier streets limits the damage.`
  } else {
    lesson = `Key decision: the hand ended without a showdown. Next time, note which street the big money went in — that's usually where the hand was won or lost.`
  }

  return { summary, lesson }
}
