// Headless bot-vs-bot hand driver (CLAUDE.md §4, Module 5).
//
// Plays ONE full hand start-to-finish by asking each seat's bot for an action
// and applying it through the engine's public API, until the hand resolves and
// pots are awarded. No UI, no persistence — this is the harness that lets bots be
// tested (and later, dropped behind a UI) without any rendering.
//
//   const { history, result } = playHand({
//     seats: [{ stack: 100, bot: 'tag' }, { stack: 100, bot: 'station' }],
//     blinds: { sb: 1, bb: 2 },
//     buttonIndex: 0,
//     deal: { seed: 42 },     // or { deck: [...] }; omit for a random shuffle
//   })

import { startHand, getLegalActions, applyAction, viewState, potTotal } from './handEngine.js'
import { resolveBot } from './bots.js'

const MAX_ACTIONS = 1000 // safety cap: a resolving hand needs far fewer

/**
 * Build the read-only context a bot sees for the player currently to act. Only
 * that player's hole cards are exposed — bots never see opponents' cards.
 */
function botContext(state) {
  const p = state.players[state.toActIndex]
  const { actions } = getLegalActions(state)
  const call = actions.find((a) => a.type === 'call')
  const toCall = call ? call.amount : Math.max(0, state.currentBet - p.streetCommitted)
  return {
    actions,
    ctx: {
      hole: p.holeCards.slice(),
      board: state.board.slice(),
      street: state.street,
      pot: potTotal(state),
      currentBet: state.currentBet,
      bigBlind: state.blinds.bb,
      toCall,
      stack: p.stack,
      streetCommitted: p.streetCommitted,
      position: p.position,
      seat: p.seat,
    },
  }
}

/** True if `action` is present (and correctly sized) in the legal-actions list. */
export function isLegalAction(action, legalActions) {
  const match = legalActions.find((a) => a.type === action.type)
  if (!match) return false
  if (action.type === 'bet' || action.type === 'raise') {
    if (!Number.isInteger(action.amount)) return false
    if (action.amount < match.min || action.amount > match.max) return false
  }
  return true
}

/**
 * Play one full hand of bots against each other.
 * @param {Object} config
 * @param {{stack:number, bot:string|Function}[]} config.seats - 2–6 seats in seat
 *        order; `bot` is an archetype name ('nit'|'station'|'tag') or a function.
 * @param {{sb:number, bb:number}} config.blinds
 * @param {number} config.buttonIndex
 * @param {Object} [config.deal] - { seed } or { deck } for determinism.
 * @returns {{ history: Array, result: Object }} history is the action trace;
 *          result is the final viewState (board, pots, payouts, stacks, log).
 */
export function playHand({ seats, blinds, buttonIndex, deal = {} }) {
  const bots = seats.map((s) => resolveBot(s.bot))
  let state = startHand({
    players: seats.map((s) => ({ stack: s.stack })),
    buttonIndex,
    blinds,
    deal,
  })

  const history = []
  let steps = 0
  while (!state.complete) {
    if (++steps > MAX_ACTIONS) {
      throw new Error('playHand exceeded MAX_ACTIONS — engine did not resolve')
    }
    const { actions, ctx } = botContext(state)
    const seat = ctx.seat
    const action = bots[seat](actions, ctx)

    if (!action || !isLegalAction(action, actions)) {
      throw new Error(
        `Bot at seat ${seat} (${seats[seat].bot}) returned an illegal action: ` +
          `${JSON.stringify(action)} — legal were ${JSON.stringify(actions)}`,
      )
    }

    history.push({
      seat,
      position: ctx.position,
      street: ctx.street,
      action,
      legal: actions,
    })
    state = applyAction(state, action)
  }

  return { history, result: viewState(state) }
}
