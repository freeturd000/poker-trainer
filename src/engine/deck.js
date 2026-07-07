// Deck utilities — build, shuffle, and deal from a 52-card deck.
// A deck is an array of canonical card strings (see ./card.js), e.g. ["As", "2c", ...].
// All operations are immutable: they return new arrays and never mutate inputs.

import { RANKS, SUITS, formatCard } from './card.js'

/**
 * Create a fresh, ordered 52-card deck.
 * @returns {string[]} 52 canonical card strings
 */
export function createDeck() {
  const deck = []
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(formatCard(rank, suit))
    }
  }
  return deck
}

/**
 * Return a shuffled copy of the deck (Fisher–Yates). Does not mutate the input.
 * @param {string[]} deck
 * @returns {string[]}
 */
export function shuffle(deck) {
  const out = deck.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Deal n cards off the top of the deck, immutably.
 * @param {string[]} deck
 * @param {number} n
 * @returns {{ cards: string[], remaining: string[] }}
 */
export function deal(deck, n) {
  if (n < 0 || n > deck.length) {
    throw new Error(`Cannot deal ${n} from a deck of ${deck.length}`)
  }
  return {
    cards: deck.slice(0, n),
    remaining: deck.slice(n),
  }
}
