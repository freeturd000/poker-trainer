// Range-chart lookup for the Preflop Range Trainer.
//
// Reads the RFI opening chart in /src/data and answers "what's the correct action
// for this hand from this position?" plus the helpers the trainer needs to turn
// two dealt cards into a chart key and back. Pure logic — no React, no store.

import chart from '../../data/preflop-ranges-6max-cash.json' with { type: 'json' }
import bbChart from '../../data/bb-defense-6max-cash.json' with { type: 'json' }
import { parseCard, formatCard } from '../../engine/card.js'

// 6-max RFI seats, in action order. BB is excluded — it never opens raise-first-in.
export const POSITIONS = chart._meta.positions_order // ['UTG','HJ','CO','BTN','SB']

// Raiser seats we defend the BB against (BB-defense mode). Same five seats, but
// here they name the OPENER we're facing, not hero's seat — hero is always the BB.
export const BBDEF_POSITIONS = bbChart._meta.positions_order // ['UTG','HJ','CO','BTN','SB']

// Rank strength high→low, for ordering the two cards in a hand token.
const RANK_ORDER = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const rankVal = Object.fromEntries(RANK_ORDER.map((r, i) => [r, RANK_ORDER.length - i]))

// Per-position Set of raising hand tokens, for O(1) lookup.
const RAISE = Object.fromEntries(
  POSITIONS.map((pos) => [pos, new Set(chart.positions[pos])]),
)

// Per-raiser BB-defense sets ({ threebet, call }) for O(1) lookup. Anything in
// neither set folds — same "not listed = fold" model as the RFI chart.
const BBDEF = Object.fromEntries(
  BBDEF_POSITIONS.map((pos) => [
    pos,
    {
      threebet: new Set(bbChart.positions[pos].threebet),
      call: new Set(bbChart.positions[pos].call),
    },
  ]),
)

/**
 * Convert two dealt cards (canonical strings, e.g. "As","Kd") into a chart token:
 * pair -> "AA", suited -> "AKs", offsuit -> "AKo" (higher rank always first).
 * @param {string} cardA
 * @param {string} cardB
 * @returns {string} hand token
 */
export function handToken(cardA, cardB) {
  const a = parseCard(cardA)
  const b = parseCard(cardB)
  if (a.rank === b.rank) return `${a.rank}${b.rank}`
  const [hi, lo] = rankVal[a.rank] >= rankVal[b.rank] ? [a, b] : [b, a]
  const suited = a.suit === b.suit ? 's' : 'o'
  return `${hi.rank}${lo.rank}${suited}`
}

/**
 * The correct RFI action for a hand token from a position.
 * @param {string} position - one of POSITIONS
 * @param {string} token - a hand token from handToken()
 * @returns {'raise'|'fold'}
 */
export function getAction(position, token) {
  const set = RAISE[position]
  if (!set) throw new Error(`Unknown position: ${position}`)
  return set.has(token) ? 'raise' : 'fold'
}

/**
 * One-line reasoning shown after a miss.
 * @param {string} position
 * @param {string} token
 * @param {'raise'|'fold'} correct
 * @returns {string}
 */
export function whyText(position, token, correct) {
  return correct === 'raise'
    ? `${token} is inside the ${position} RFI opening range — raise.`
    : `${token} is below the ${position} opening threshold — fold.`
}

/**
 * The correct BB-defense action for a hand token vs a raiser's position.
 * @param {string} position - the OPENER's seat, one of BBDEF_POSITIONS
 * @param {string} token - a hand token from handToken()
 * @returns {'3bet'|'call'|'fold'}
 */
export function getBBDefAction(position, token) {
  const sets = BBDEF[position]
  if (!sets) throw new Error(`Unknown position: ${position}`)
  if (sets.threebet.has(token)) return '3bet'
  if (sets.call.has(token)) return 'call'
  return 'fold'
}

/**
 * One-line reasoning shown after a BB-defense miss.
 * @param {string} position - the opener's seat
 * @param {string} token
 * @param {'3bet'|'call'|'fold'} correct
 * @returns {string}
 */
export function bbDefWhyText(position, token, correct) {
  if (correct === '3bet') {
    return `${token} 3-bets from the BB vs a ${position} open — strong enough to re-raise for value (or as a polar bluff).`
  }
  if (correct === 'call') {
    return `${token} defends by calling from the BB vs a ${position} open — playable at the price, not strong enough to 3-bet.`
  }
  return `${token} folds vs a ${position} open — too weak to defend out of position.`
}

/**
 * Realize a hand token into two concrete cards (canonical strings), picking
 * arbitrary suits that satisfy the token. Used to re-serve a leak spot.
 * @param {string} token - "AA" | "AKs" | "AKo"
 * @returns {[string, string]}
 */
export function tokenToCards(token) {
  if (token.length === 2) {
    // pair — two different suits
    return [formatCard(token[0], 's'), formatCard(token[1], 'h')]
  }
  const hi = token[0]
  const lo = token[1]
  const suited = token[2] === 's'
  return suited
    ? [formatCard(hi, 's'), formatCard(lo, 's')]
    : [formatCard(hi, 's'), formatCard(lo, 'h')]
}
