// Spot generator for the Range Trainer.
//
// Produces the next { position, cards, token } to quiz. Most spots are random,
// but a fraction are pulled from the leak log (weighted by how badly each spot
// is leaking) so weak spots resurface more often — the "leak weighting" in
// CLAUDE.md §4 Module 1.

import { createDeck, shuffle, deal } from '../../engine/deck.js'
import { getLeaks, getLeakWeight } from '../../store'
import { POSITIONS, handToken, tokenToCards } from './ranges.js'

// Chance the next spot is drawn from your existing leaks rather than fresh-random.
const LEAK_SERVE_RATE = 0.35

/** Leak tag for a specific spot, e.g. "UTG_open_72o". */
export const leakTag = (position, token) => `${position}_open_${token}`

/** Inverse of leakTag → { position, token }, or null if it doesn't parse. */
export function parseLeakTag(tag) {
  const m = /^([A-Z]+)_open_(.+)$/.exec(tag)
  if (!m || !POSITIONS.includes(m[1])) return null
  return { position: m[1], token: m[2] }
}

/** A fresh random spot. `only` locks the seat; null/undefined = random seat. */
function randomSpot(only) {
  const position = only ?? POSITIONS[Math.floor(Math.random() * POSITIONS.length)]
  const { cards } = deal(shuffle(createDeck()), 2)
  return { position, cards, token: handToken(cards[0], cards[1]) }
}

/**
 * Pick a leak spot weighted by leak weight; null if there are no (matching)
 * leaks. `only` restricts to leaks at that seat; null/undefined = any seat.
 */
function weightedLeakSpot(only) {
  const leaks = getLeaks()
    .map((l) => ({ ...parseLeakTag(l.tag), weight: getLeakWeight(l.tag) }))
    .filter((l) => l.position && l.token && (!only || l.position === only))
  if (leaks.length === 0) return null

  const total = leaks.reduce((a, l) => a + l.weight, 0)
  let r = Math.random() * total
  const chosen = leaks.find((l) => (r -= l.weight) < 0) ?? leaks[leaks.length - 1]
  const cards = tokenToCards(chosen.token)
  return { position: chosen.position, cards, token: chosen.token }
}

/**
 * The next spot to serve. Occasionally re-serves a weighted leak spot.
 * @param {string} [only] - restrict to a single seat (one of POSITIONS); omit
 *   or pass null/undefined for the default all-seats-random behavior.
 * @returns {{ position: string, cards: [string,string], token: string }}
 */
export function nextSpot(only) {
  if (Math.random() < LEAK_SERVE_RATE) {
    const leak = weightedLeakSpot(only)
    if (leak) return leak
  }
  return randomSpot(only)
}
