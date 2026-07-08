// Spaced-Repetition Concept Deck schedule storage (CLAUDE.md §4 Module 6).
//
// Persists each card's SM-2 schedule state, keyed by the card's STABLE id from
// /data/concept-cards.json. The scheduling MATH lives in
// ../modules/concept-deck/scheduler.js; this file only stores/reads the resulting
// state and stays consistent with the rest of /store (namespaced, versioned,
// never-throws via the storage wrapper).
//
// Shape on disk (under one key): { [cardId]: <schedule state> }, where a state is
// { ease, interval, reps, lapses, due, lastReviewed } as produced by schedule().
// Cards with no entry here are simply "new" (never reviewed) — absence is the
// source of truth, so nothing needs pre-seeding when the deck grows.

import { get, set, remove } from './storage.js'

const KEY = 'concept-deck:schedule'

/**
 * The full { cardId -> state } schedule map (possibly empty).
 * @returns {Record<string, object>}
 */
export function getSchedule() {
  const map = get(KEY, {})
  return map && typeof map === 'object' && !Array.isArray(map) ? map : {}
}

/**
 * The stored schedule state for one card, or null if it's never been reviewed.
 * @param {string} cardId
 * @returns {object|null}
 */
export function getCardState(cardId) {
  const state = getSchedule()[cardId]
  return state ?? null
}

/**
 * Persist one card's new schedule state (from scheduler.schedule()).
 * @param {string} cardId
 * @param {object} state
 * @returns {Record<string, object>} the updated map
 */
export function saveCardState(cardId, state) {
  const map = getSchedule()
  map[cardId] = state
  set(KEY, map)
  return map
}

/** Forget all concept-deck scheduling (a "reset deck" action). */
export function resetConceptDeck() {
  remove(KEY)
}
