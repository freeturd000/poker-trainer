// Card model — the single source of truth for how a card is represented.
//
// CANONICAL STRING FORM: "<rank><suit>", exactly two characters.
//   rank: one of  2 3 4 5 6 7 8 9 T J Q K A   (T = ten, uppercase)
//   suit: one of  s h d c                       (spade heart diamond club, lowercase)
//   examples: "As" (ace of spades), "Td" (ten of diamonds), "2c" (two of clubs)
//
// This format is intentionally the same one `pokersolver` consumes later, so a
// canonical string can be handed straight to the evaluator with no translation.
// Keep it stable — every module reads and writes cards in this exact form.

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
export const SUITS = ['s', 'h', 'd', 'c']

const RANK_SET = new Set(RANKS)
const SUIT_SET = new Set(SUITS)

/**
 * @typedef {Object} Card
 * @property {string} rank - one of RANKS ("2"–"9", "T", "J", "Q", "K", "A")
 * @property {string} suit - one of SUITS ("s", "h", "d", "c")
 */

/**
 * Parse a canonical card string into a { rank, suit } model.
 * @param {string} str - e.g. "As", "Td"
 * @returns {Card}
 */
export function parseCard(str) {
  if (typeof str !== 'string' || str.length !== 2) {
    throw new Error(`Invalid card string: ${JSON.stringify(str)}`)
  }
  const rank = str[0]
  const suit = str[1]
  if (!RANK_SET.has(rank)) throw new Error(`Invalid rank: ${JSON.stringify(rank)}`)
  if (!SUIT_SET.has(suit)) throw new Error(`Invalid suit: ${JSON.stringify(suit)}`)
  return { rank, suit }
}

/**
 * Format a rank + suit (or a Card model) back into the canonical string form.
 * Accepts either formatCard({ rank, suit }) or formatCard(rank, suit).
 * @param {Card|string} rankOrCard
 * @param {string} [suit]
 * @returns {string} canonical card string, e.g. "As"
 */
export function formatCard(rankOrCard, suit) {
  const rank = typeof rankOrCard === 'object' ? rankOrCard.rank : rankOrCard
  const s = typeof rankOrCard === 'object' ? rankOrCard.suit : suit
  if (!RANK_SET.has(rank)) throw new Error(`Invalid rank: ${JSON.stringify(rank)}`)
  if (!SUIT_SET.has(s)) throw new Error(`Invalid suit: ${JSON.stringify(s)}`)
  return `${rank}${s}`
}

/**
 * Normalize any accepted card input (canonical string or Card model) to a
 * canonical string. Convenience for components/consumers that take either.
 * @param {Card|string} card
 * @returns {string}
 */
export function toCardString(card) {
  return typeof card === 'string' ? formatCard(parseCard(card)) : formatCard(card)
}
