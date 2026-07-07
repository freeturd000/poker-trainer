// Per-module progress tracking.
//
// Every trainer module (range, odds, board-reader, ...) shares this exact API,
// keyed by a module id string. Accuracy is DERIVED on read, never stored, so it
// can't drift out of sync with attempts/correct.

import { get, set, remove } from './storage.js'

const key = (moduleId) => `progress:${moduleId}`

// Stored shape (accuracy is computed, not persisted).
const EMPTY = {
  attempts: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  lastPlayed: null, // epoch ms of the last recorded attempt
}

/**
 * @typedef {Object} Progress
 * @property {number} attempts
 * @property {number} correct
 * @property {number} accuracy   - derived %, 0 when no attempts yet
 * @property {number} streak     - current consecutive-correct streak
 * @property {number} bestStreak
 * @property {number|null} lastPlayed - epoch ms
 */

/**
 * Read a module's progress. Always returns a full object (zeros if untouched).
 * @param {string} moduleId
 * @returns {Progress}
 */
export function getProgress(moduleId) {
  const stored = get(key(moduleId), null)
  const p = { ...EMPTY, ...(stored || {}) }
  return {
    ...p,
    accuracy: p.attempts > 0 ? (100 * p.correct) / p.attempts : 0,
  }
}

/**
 * Record one graded attempt for a module and persist it.
 * @param {string} moduleId
 * @param {{ correct?: boolean }} [result]
 * @returns {Progress} the updated progress
 */
export function recordAttempt(moduleId, { correct = false } = {}) {
  const stored = get(key(moduleId), null)
  const p = { ...EMPTY, ...(stored || {}) }

  p.attempts += 1
  if (correct) {
    p.correct += 1
    p.streak += 1
    if (p.streak > p.bestStreak) p.bestStreak = p.streak
  } else {
    p.streak = 0
  }
  p.lastPlayed = Date.now()

  set(key(moduleId), p)
  return getProgress(moduleId)
}

/**
 * Clear a single module's stored progress (back to zeros). Only touches that
 * module's key — other modules' progress is untouched.
 * @param {string} moduleId
 */
export function resetProgress(moduleId) {
  remove(key(moduleId))
}
