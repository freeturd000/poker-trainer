// UI-side bot stepping — advance ONE bot action at a time.
//
// playHand.js plays a whole hand headlessly; the interactive table instead needs
// to take a single bot action (then pause so the human can watch) whenever it is
// a bot's turn. This builds the same peek-proof context playHand feeds its bots,
// but from the public read API (viewState + getLegalActions) so it stays a pure
// consumer of the engine — it does not reach into engine internals or modify the
// bots. Mirrors playHand.js's internal botContext by design.

import { getLegalActions, viewState } from './handEngine.js'

/**
 * Decide the acting bot's action for the current state.
 * @param {Object} state - the engine hand state (as returned by startHand/applyAction)
 * @param {Function} botFn - the archetype decision function for the seat to act
 * @param {number} bigBlind - the table big blind (bots use it to read raise sizing)
 * @returns {{type:string, amount?:number}} a legal action to apply
 */
export function botActionFor(state, botFn, bigBlind) {
  const { actions } = getLegalActions(state)
  const view = viewState(state)
  const seat = view.toAct
  const p = view.players[seat]
  const call = actions.find((a) => a.type === 'call')
  const toCall = call ? call.amount : Math.max(0, view.currentBet - p.streetCommitted)
  const ctx = {
    hole: p.holeCards, // only THIS seat's cards — bots never see others'
    board: view.board,
    street: view.street,
    pot: view.pot,
    currentBet: view.currentBet,
    bigBlind,
    toCall,
    stack: p.stack,
    streetCommitted: p.streetCommitted,
    position: p.position,
    seat,
  }
  return botFn(actions, ctx)
}

/** Human-readable one-liner for an applied action, for the table's action feed. */
export function describeAction(action) {
  switch (action.type) {
    case 'fold':
      return 'Folds'
    case 'check':
      return 'Checks'
    case 'call':
      return action.amount != null ? `Calls ${action.amount}` : 'Calls'
    case 'bet':
      return `Bets ${action.amount}`
    case 'raise':
      return `Raises to ${action.amount}`
    default:
      return action.type
  }
}
