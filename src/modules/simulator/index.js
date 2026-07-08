// Public API for the NLHE hand engine (Module 5, part 1 — the core engine).
//
// A UI or a bot drives one hand entirely through these four calls, without
// touching engine internals:
//
//   const state = startHand({ players, buttonIndex, blinds, deal })
//   const { toAct, actions } = getLegalActions(state)   // what may the actor do?
//   const next = applyAction(state, { type, amount })   // returns a NEW state
//   const view = viewState(next)                        // serializable snapshot
//   next.complete === true                              // hand is over; read payouts
//
// Determinism: pass deal.seed for a reproducible shuffle, or deal.deck for a
// fully fixed deck (see startHand docs). No bot AI, no rendering, no persistence
// live here — this is only the rules engine.

export {
  startHand,
  getLegalActions,
  applyAction,
  viewState,
  potTotal,
} from './handEngine.js'

// Lower-level pieces, exposed for reuse and direct testing.
export { computeSidePots, splitPot } from './pot.js'
export {
  positionLabels,
  smallBlindIndex,
  bigBlindIndex,
  firstToActPreflop,
  firstToActPostflop,
} from './positions.js'
export { mulberry32, shuffleWith } from './rng.js'
