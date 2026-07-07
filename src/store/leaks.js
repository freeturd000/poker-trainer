// Leak log — tracks the SPECIFIC spots you get wrong so trainers can serve your
// weak spots more often (CLAUDE.md §3c).
//
// A "leak" is identified by a caller-chosen tag string, e.g. "UTG_open_72o" or
// "BTN_vs_3bet_overfold". Each tag accumulates a hit count, a last-seen time,
// and optional freeform meta (the most recent one wins) for later display.

import { get, set } from './storage.js'

const KEY = 'leaks'

/**
 * @typedef {Object} Leak
 * @property {string} tag
 * @property {number} count       - times this exact spot was missed
 * @property {number} lastSeen    - epoch ms of the most recent hit
 * @property {*} [meta]           - optional context from the last hit
 */

/** @returns {Record<string, Leak>} */
function readAll() {
  return get(KEY, {}) || {}
}

/**
 * Record that a specific leak spot was hit (missed). Increments its count.
 * @param {string} tag
 * @param {*} [meta] - optional context (stored from the most recent hit)
 * @returns {Leak} the updated leak entry
 */
export function recordLeak(tag, meta) {
  const leaks = readAll()
  const entry = leaks[tag] || { tag, count: 0, lastSeen: null }
  entry.count += 1
  entry.lastSeen = Date.now()
  if (meta !== undefined) entry.meta = meta
  leaks[tag] = entry
  set(KEY, leaks)
  return entry
}

/**
 * All leaks, sorted worst-first (highest count, then most recent).
 * @returns {Leak[]}
 */
export function getLeaks() {
  return Object.values(readAll()).sort(
    (a, b) => b.count - a.count || (b.lastSeen || 0) - (a.lastSeen || 0),
  )
}

// How much more often a trainer should serve a given spot. Simple + bounded:
// weight = 1 + count, capped at WEIGHT_CAP so a single much-missed spot can't
// crowd out everything else. An unseen spot has weight 1 (baseline); a spot
// missed 3 times has weight 4; anything ≥ CAP-1 misses saturates at the cap.
const WEIGHT_CAP = 5

/**
 * @param {string} tag
 * @returns {number} serve-frequency weight in [1, WEIGHT_CAP]
 */
export function getLeakWeight(tag) {
  const count = readAll()[tag]?.count ?? 0
  return Math.min(1 + count, WEIGHT_CAP)
}
