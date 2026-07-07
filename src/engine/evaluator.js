// Hand evaluator — thin wrapper over `pokersolver`.
//
// CARD FORMAT: pokersolver consumes the exact same canonical two-char strings we
// use everywhere else (see ./card.js): rank in "2".."9","T","J","Q","K","A" and
// suit in "s","h","d","c". The one thing to watch is TEN: pokersolver requires
// "T" (e.g. "Ts"). Its alternate "10s" parsing is unreliable — verified that
// "10s 9s 8s 7s 6s" mis-evaluates — so we NEVER pass "10x". `toSolverCards` runs
// every card through our own parseCard, which only accepts the "T" form, so a
// stray "10" throws here instead of silently corrupting a result.
//
// COMPARABILITY: pokersolver exposes `.rank` (category only, 1=high card .. 9=
// straight flush) but no scalar that resolves within-category kickers. The
// reliable total-order comparator is `Hand.winners([...])`, so compareHands and
// findWinners route through it rather than comparing `.rank` directly.

import pokersolver from 'pokersolver'
import { parseCard } from './card.js'

const { Hand } = pokersolver

/**
 * @typedef {Object} HandResult
 * @property {string} name  - rank category, e.g. "Flush", "Two Pair"
 * @property {string} descr - human-readable description, e.g. "Flush, Ah High"
 * @property {number} rank  - numeric category (1 high card .. 9 straight flush)
 * @property {import('pokersolver').Hand} solved - the pokersolver Hand (comparable via Hand.winners)
 */

/**
 * Validate + pass through cards in the exact form pokersolver expects.
 * Identity on our canonical strings; throws on anything malformed (incl. "10x").
 * @param {string[]} cards
 * @returns {string[]}
 */
function toSolverCards(cards) {
  return cards.map((c) => {
    parseCard(c) // throws unless a valid canonical 2-char string ("T", never "10")
    return c
  })
}

/**
 * Evaluate the best 5-card hand from hole cards + board.
 * @param {string[]} hole  - e.g. ["As","Kd"]
 * @param {string[]} [board] - e.g. ["Qh","Jc","Ts","2d","7h"]
 * @returns {HandResult}
 */
export function evaluateHand(hole, board = []) {
  const cards = toSolverCards([...hole, ...board])
  if (cards.length < 5) {
    throw new Error(`Need at least 5 cards to evaluate, got ${cards.length}`)
  }
  const solved = Hand.solve(cards)
  return { name: solved.name, descr: solved.descr, rank: solved.rank, solved }
}

/**
 * Compare two evaluated hands (or raw solved Hands).
 * @param {HandResult|import('pokersolver').Hand} a
 * @param {HandResult|import('pokersolver').Hand} b
 * @returns {number} 1 if a wins, -1 if b wins, 0 if tie
 */
export function compareHands(a, b) {
  const ha = a.solved ?? a
  const hb = b.solved ?? b
  const winners = Hand.winners([ha, hb])
  const aWins = winners.includes(ha)
  const bWins = winners.includes(hb)
  if (aWins && bWins) return 0
  return aWins ? 1 : -1
}

/**
 * Given each player's hole cards and a shared board, return the winning player
 * index/indices (multiple = split pot).
 * @param {string[][]} playerHoles - e.g. [["As","Ad"], ["Kc","Kh"]]
 * @param {string[]} board
 * @returns {{ winners: number[], results: HandResult[] }}
 */
export function findWinners(playerHoles, board = []) {
  const results = playerHoles.map((hole) => evaluateHand(hole, board))
  const solved = results.map((r) => r.solved)
  const winningHands = Hand.winners(solved)
  const winners = solved.reduce((acc, h, i) => {
    if (winningHands.includes(h)) acc.push(i)
    return acc
  }, [])
  return { winners, results }
}
