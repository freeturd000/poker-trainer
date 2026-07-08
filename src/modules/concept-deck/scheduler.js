// ⚠️ SM-2 SCHEDULING LOGIC — FLAG FOR REVIEW (CLAUDE.md §4 Module 6).
//
// A compact, Anki-flavoured SM-2 spaced-repetition scheduler. Pure functions only:
// given a card's prior schedule state + a rating + the current time, return the NEW
// state. No storage, no React — persistence lives in ../../store/conceptDeck.js and
// the UI in ./ConceptDeck.jsx. This is the correctness-critical core, so it's kept
// small, documented, and covered by scheduler.test.mjs.
//
// ── State shape (per card) ──────────────────────────────────────────────────
//   ease         ease factor, ≥ MIN_EASE. Starts at DEFAULT_EASE (2.5). This is the
//                multiplier a well-known card's interval grows by each review.
//   interval     current spacing in DAYS (fractional for cards still relearning).
//   reps         count of consecutive successful reviews since the last lapse. Reset
//                to 0 by an "again". Drives the fixed graduating steps below.
//   lapses       lifetime count of "again" ratings — how often the card was forgotten.
//                Used by the session queue to resurface historically-missed cards first.
//   due          epoch ms when the card next becomes due (= reviewedAt + interval days).
//   lastReviewed epoch ms of the most recent review (null if never reviewed).
//
// ── Ratings ─────────────────────────────────────────────────────────────────
// Four standard buttons. Each nudges `ease` (Anki-style deltas) and picks the next
// interval:
//   again  forgot it        → lapse: reps→0, ease −0.20, relearn in AGAIN_MINUTES
//                              (comes back THIS session, and is due immediately next).
//   hard   recalled, barely  → ease −0.15, interval grows slowly (× HARD_MULT).
//   good   recalled          → ease unchanged, standard SM-2 steps / × ease.
//   easy   instant           → ease +0.15, interval grows fastest (× ease × EASY_BONUS).
//
// ── Interval progression for a PASS (hard/good/easy) ────────────────────────
//   reps 0 (first ever pass): fixed graduating step — hard/good → 1 day, easy → 4 days.
//   reps 1 & good:            classic SM-2 second step → 6 days.
//   otherwise (steady state): round(interval × multiplier), where multiplier is
//                             HARD_MULT / ease / ease·EASY_BONUS for hard/good/easy.
//   Every pass interval is floored at 1 day so spacing never shrinks below a day.
// An "again" ignores all of the above and schedules a short relearning step so the
// card is retried within the same sitting.

export const RATINGS = ['again', 'hard', 'good', 'easy']

export const MIN_EASE = 1.3
export const DEFAULT_EASE = 2.5

const HARD_MULT = 1.2 // slow growth when a card was hard to recall
const EASY_BONUS = 1.3 // extra stretch when a card was instant
const AGAIN_MINUTES = 10 // relearning step after a lapse — resurfaces the same session

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_TO_MS = 60 * 1000

const EASE_DELTA = { again: -0.2, hard: -0.15, good: 0, easy: 0.15 }

const clampEase = (e) => Math.max(MIN_EASE, e)

/**
 * A fresh, never-reviewed card's schedule state.
 * @returns {{ease:number,interval:number,reps:number,lapses:number,due:number|null,lastReviewed:number|null}}
 */
export function newCardState() {
  return { ease: DEFAULT_EASE, interval: 0, reps: 0, lapses: 0, due: null, lastReviewed: null }
}

/**
 * Compute the next interval in days for a PASS rating (hard/good/easy).
 * `prev` is the pre-review state; `reps`/`interval`/`ease` come from it.
 * @returns {number} days (≥ 1)
 */
function nextIntervalDays(prev, rating) {
  const { reps, interval, ease } = prev
  if (reps === 0) return rating === 'easy' ? 4 : 1 // first graduating step
  if (reps === 1 && rating === 'good') return 6 // classic SM-2 second step
  const mult = rating === 'hard' ? HARD_MULT : rating === 'easy' ? ease * EASY_BONUS : ease
  return Math.max(1, Math.round(interval * mult))
}

/**
 * Advance a card's schedule given a rating at time `nowMs`.
 * @param {object|null} prev  prior state (null/undefined → treated as a new card)
 * @param {'again'|'hard'|'good'|'easy'} rating
 * @param {number} nowMs  current epoch ms
 * @returns {{ease:number,interval:number,reps:number,lapses:number,due:number,lastReviewed:number}}
 */
export function schedule(prev, rating, nowMs) {
  if (!RATINGS.includes(rating)) throw new Error(`unknown rating: ${rating}`)
  const base = prev ? { ...newCardState(), ...prev } : newCardState()
  const ease = clampEase((base.ease ?? DEFAULT_EASE) + EASE_DELTA[rating])

  if (rating === 'again') {
    return {
      ease,
      interval: AGAIN_MINUTES / (24 * 60), // sub-day interval, expressed in days
      reps: 0,
      lapses: base.lapses + 1,
      due: nowMs + AGAIN_MINUTES * MIN_TO_MS,
      lastReviewed: nowMs,
    }
  }

  const intervalDays = nextIntervalDays(base, rating)
  return {
    ease,
    interval: intervalDays,
    reps: base.reps + 1,
    lapses: base.lapses,
    due: nowMs + intervalDays * DAY_MS,
    lastReviewed: nowMs,
  }
}

/**
 * Human-readable "next due" label for a rating preview button (e.g. "1d", "10m").
 * Pure helper used by the UI to show what each button will do before you click it.
 * @param {object|null} prev
 * @param {'again'|'hard'|'good'|'easy'} rating
 * @returns {string}
 */
export function previewInterval(prev, rating) {
  if (rating === 'again') return `${AGAIN_MINUTES}m`
  const days = nextIntervalDays(prev ? { ...newCardState(), ...prev } : newCardState(), rating)
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(days < 730 ? 1 : 0)}y`
}
