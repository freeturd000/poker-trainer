// Pot math for the simulator — CORRECTNESS-CRITICAL, pure, fully testable.
//
// Two jobs:
//   1. computeSidePots — turn each player's total committed chips into a stack of
//      pots (main + side pots) with the correct eligible winners for each, given
//      that all-in players can only win up to what they matched.
//   2. splitPot — divide one pot among tied winners, distributing the odd-chip
//      remainder deterministically.
//
// No poker knowledge lives here (no card evaluation) — this is pure chip
// arithmetic. Hand evaluation and which players tie is decided by the caller
// (handEngine, via /engine's evaluator) and fed in.

/**
 * @typedef {Object} PlayerContribution
 * @property {number} committed - total chips this player put in the pot this hand
 * @property {boolean} folded   - true if the player folded (dead money: contributes
 *                                to pots but can never be an eligible winner)
 */

/**
 * @typedef {Object} Pot
 * @property {number} amount        - chips in this pot layer
 * @property {number[]} eligible    - player indices who can win this layer
 *                                    (contributed to it AND did not fold)
 */

/**
 * Build the main pot + any side pots from every player's committed total.
 *
 * Algorithm — "peel by the smallest all-in level":
 *   Repeatedly find the smallest positive remaining contribution. Every player
 *   with chips left contributes that much to the current layer; players who
 *   haven't folded are eligible to win it. Subtract the level from everyone and
 *   repeat until no chips remain. This produces the standard main-pot / side-pot
 *   layering for arbitrary unequal all-ins.
 *
 * Dead money: a folded player's chips still swell the pots they reached, but the
 * folded player is never eligible. A layer whose contributors ALL folded (can
 * happen only with an uncalled over-bet; handEngine returns those before
 * showdown) has empty `eligible` — the caller must refund it rather than lose
 * the chips.
 *
 * @param {PlayerContribution[]} players - indexed by player; committed >= 0
 * @returns {Pot[]} pots from main (index 0) outward; each amount > 0
 */
export function computeSidePots(players) {
  // Work on a mutable copy of remaining contributions.
  const remaining = players.map((p, i) => ({
    index: i,
    left: p.committed,
    folded: p.folded,
  }))

  const pots = []
  while (true) {
    // Smallest strictly-positive remaining contribution defines the next layer.
    const level = remaining.reduce(
      (min, p) => (p.left > 0 && p.left < min ? p.left : min),
      Infinity,
    )
    if (level === Infinity) break // nothing left to allocate

    let amount = 0
    const eligible = []
    for (const p of remaining) {
      if (p.left <= 0) continue
      amount += level
      p.left -= level
      if (!p.folded) eligible.push(p.index)
    }
    pots.push({ amount, eligible })
  }

  // Merge adjacent layers that share the exact same eligible set — they only
  // split because of a folded player's dead-money boundary and are functionally
  // one pot. Purely cosmetic; keeps the pot list minimal.
  const merged = []
  for (const pot of pots) {
    const prev = merged[merged.length - 1]
    if (prev && sameSet(prev.eligible, pot.eligible)) {
      prev.amount += pot.amount
    } else {
      merged.push({ amount: pot.amount, eligible: pot.eligible.slice() })
    }
  }
  return merged
}

/**
 * Divide one pot's chips among tied winners, awarding the odd-chip remainder one
 * chip at a time in the given order (poker convention: earliest seat left of the
 * button first). All chips are integers and fully distributed — no chip is lost.
 *
 * @param {number} amount - chips in the pot (integer >= 0)
 * @param {number[]} winnersOrdered - winning player indices, already ordered for
 *                                    odd-chip priority (first gets the first extra)
 * @returns {Map<number, number>} playerIndex -> chips awarded (sums to `amount`)
 */
export function splitPot(amount, winnersOrdered) {
  const payouts = new Map()
  const n = winnersOrdered.length
  if (n === 0) return payouts
  const base = Math.floor(amount / n)
  let remainder = amount - base * n
  for (const idx of winnersOrdered) {
    const extra = remainder > 0 ? 1 : 0
    if (remainder > 0) remainder -= 1
    payouts.set(idx, base + extra)
  }
  return payouts
}

/** True if two index arrays contain the same set of players. */
function sameSet(a, b) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}
