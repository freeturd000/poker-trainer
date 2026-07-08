// Seedable RNG + deterministic shuffle for the simulator.
//
// /engine/deck.js shuffles with Math.random (non-deterministic), which is fine
// for the trainers but useless for reproducible engine tests. This provides a
// tiny seeded PRNG (mulberry32) and a seeded Fisher–Yates so a hand can be
// replayed exactly. Self-contained; does not touch /engine.

/**
 * Create a deterministic PRNG from a 32-bit integer seed.
 * @param {number} seed
 * @returns {() => number} function returning floats in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Return a shuffled copy of `deck` using the provided random fn (default
 * Math.random). Fisher–Yates; does not mutate the input.
 * @param {string[]} deck
 * @param {() => number} [rand]
 * @returns {string[]}
 */
export function shuffleWith(deck, rand = Math.random) {
  const out = deck.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
