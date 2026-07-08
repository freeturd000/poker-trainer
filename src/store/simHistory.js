// Simulator hand-history storage (CLAUDE.md §4 Module 5; §8 Analyzer will consume).
//
// Persists the structured, serializable hand records the simulator produces so the
// player can scroll back through recent hands — and so a future Hand History
// Analyzer (Module 8) can read them without re-deriving anything. The RECORD SHAPE
// is defined and documented in ../modules/simulator/handHistory.js; this file only
// stores and bounds them.
//
// BOUNDED: we keep at most MAX_HANDS most-recent records (newest first) so
// localStorage can't grow without limit over long nightly sessions. Older hands
// fall off the end. Records are small (a few actions + short card strings), so a
// couple dozen is a comfortable cap well under any storage quota.

import { get, set, remove } from './storage.js'

const KEY = 'sim:handHistory'

// Cap on retained hands. Tuned for "scroll back through what I just played" plus a
// little cross-session history for the analyzer — not a full database.
export const MAX_HANDS = 20

/**
 * All retained hand records, newest first (possibly empty).
 * @returns {object[]}
 */
export function getSimHands() {
  const list = get(KEY, [])
  return Array.isArray(list) ? list : []
}

/**
 * Persist one finished hand record (prepended as newest), trimming to MAX_HANDS.
 * @param {object} record - a serializable record from buildRecord({ final: true })
 * @returns {object[]} the updated, bounded list (newest first)
 */
export function recordSimHand(record) {
  const list = getSimHands()
  list.unshift(record)
  if (list.length > MAX_HANDS) list.length = MAX_HANDS // drop the oldest
  set(KEY, list)
  return list
}

/** Forget all stored hand history (e.g. a "Clear" action in the panel). */
export function clearSimHands() {
  remove(KEY)
}
