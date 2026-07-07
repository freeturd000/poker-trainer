// Day-level activity log for the nightly streak counter (CLAUDE.md §5).
//
// Records which calendar days had at least one training session, so the dashboard
// can show a consecutive-day streak. Deliberately kept SEPARATE from progress.js:
// this only ADDS a set of day-stamps and never touches the existing attempts/
// accuracy logic. Days are stored as a sorted array of local "YYYY-MM-DD" keys.

import { get, set } from './storage.js'

const KEY = 'activity'
const DAY_MS = 24 * 60 * 60 * 1000

/** Local-date key ("YYYY-MM-DD") for an epoch-ms time, in the user's own zone. */
export function dayKey(ms) {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function readDays() {
  const arr = get(KEY, [])
  return Array.isArray(arr) ? arr : []
}

/**
 * Record one or more epoch-ms timestamps as active days. Idempotent — a day
 * already logged is not duplicated. No-op if nothing new to add.
 * @param {...number} timestamps
 * @returns {string[]} the updated sorted day-key list
 */
export function recordActiveDays(...timestamps) {
  const days = new Set(readDays())
  let changed = false
  for (const ts of timestamps) {
    if (typeof ts !== 'number' || !Number.isFinite(ts)) continue
    const k = dayKey(ts)
    if (!days.has(k)) {
      days.add(k)
      changed = true
    }
  }
  const sorted = [...days].sort()
  if (changed) set(KEY, sorted)
  return sorted
}

/** All active days, sorted ascending. */
export function getActiveDays() {
  return readDays().slice().sort()
}

/**
 * Consecutive-day streak counting back from today. If there's a session today the
 * streak includes today; if not but there was one yesterday the streak is still
 * "alive" through yesterday. If the most recent active day is older than that, the
 * streak is broken (0). Stepping via Date#setDate keeps month/DST boundaries right.
 * @param {number} nowMs - the current time (passed in so the fn stays pure/testable)
 * @returns {number}
 */
export function getDayStreak(nowMs) {
  const days = new Set(readDays())
  if (days.size === 0) return 0

  const cursor = new Date(nowMs)
  if (!days.has(dayKey(cursor.getTime()))) {
    // Nothing today — allow the streak to run through yesterday, else it's broken.
    cursor.setTime(cursor.getTime() - DAY_MS)
    if (!days.has(dayKey(cursor.getTime()))) return 0
  }

  let streak = 0
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
