// Live Play Toolkit storage (CLAUDE.md §4 Module 7).
//
// Persists two things under the shared, namespaced, versioned /store:
//   • live:sessions  — an array of logged live-poker session records, newest first.
//   • live:bankroll  — a single number: the player's current bankroll in dollars.
//
// This file is storage-only. The session STATS math lives in
// ../modules/live-toolkit/stats.js and the bankroll/stakes logic in
// ../modules/live-toolkit/stakes.js; keeping them separate keeps this a thin,
// never-throws persistence layer like the rest of /store.
//
// SESSION RECORD SHAPE (all amounts in dollars):
//   { id, date: "YYYY-MM-DD", location, stakes, buyIn, cashOut, hours }
//   profit is DERIVED (cashOut − buyIn), never stored, so it can't drift.

import { get, set, remove } from './storage.js'

const SESSIONS_KEY = 'live:sessions'
const BANKROLL_KEY = 'live:bankroll'

/** All logged sessions, newest first (possibly empty). */
export function getSessions() {
  const list = get(SESSIONS_KEY, [])
  return Array.isArray(list) ? list : []
}

function saveSessions(list) {
  set(SESSIONS_KEY, list)
  return list
}

/** A short unique id for a new session. Time-based + a random suffix. */
function newId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Add a session (prepended as newest). The caller passes validated fields; we
 * stamp an id. Returns the stored record.
 * @param {{date:string,location:string,stakes:string,buyIn:number,cashOut:number,hours:number}} fields
 */
export function addSession(fields) {
  const record = { id: newId(), ...fields }
  const list = getSessions()
  list.unshift(record)
  saveSessions(list)
  return record
}

/**
 * Patch an existing session by id (id itself is never overwritten). No-op if the
 * id isn't found. Returns the updated list.
 */
export function updateSession(id, patch) {
  const list = getSessions().map((s) => (s.id === id ? { ...s, ...patch, id } : s))
  return saveSessions(list)
}

/** Delete a session by id. Returns the updated list. */
export function deleteSession(id) {
  return saveSessions(getSessions().filter((s) => s.id !== id))
}

/** Current bankroll in dollars (0 if never set). */
export function getBankroll() {
  const v = get(BANKROLL_KEY, 0)
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Set the bankroll to an absolute dollar amount. Non-numbers coerce to 0. */
export function setBankroll(amount) {
  const n = Number(amount)
  set(BANKROLL_KEY, Number.isFinite(n) ? n : 0)
  return getBankroll()
}

/** Forget all Live Toolkit data (sessions + bankroll). */
export function clearLiveToolkit() {
  remove(SESSIONS_KEY)
  remove(BANKROLL_KEY)
}
