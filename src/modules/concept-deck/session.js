// Concept-deck session building (CLAUDE.md §4 Module 6).
//
// Pure selection logic: given the deck + the stored schedule map + the current time,
// decide WHICH cards to serve this sitting and in what order. Kept separate from the
// scheduler (interval math) and the store (persistence) so it's easy to reason about
// and test.
//
// A card is one of:
//   • due    — has a saved state whose `due` time is at or before now.
//   • new    — has no saved state yet (never reviewed).
//   • waiting— has a state but isn't due yet (excluded from the session).
//
// Ordering (what you see first):
//   1. Due cards, prioritising (a) previously-MISSED cards (lapses > 0) and then
//      (b) the most OVERDUE (smallest `due` first). Missed-and-overdue rises to top.
//   2. New cards, capped at `newPerSession`, in deck order — so a big deck doesn't
//      dump every unseen card on you at once.
// New cards are appended AFTER due cards: reviews you already owe always come before
// brand-new material.

export const DEFAULT_NEW_PER_SESSION = 8

/**
 * @typedef {Object} QueueItem
 * @property {object} card    the raw card ({ id, category, front, back })
 * @property {object|null} state saved schedule state, or null if new
 * @property {boolean} isNew  true if the card has never been reviewed
 */

/**
 * Build the ordered review queue for a sitting.
 * @param {object[]} cards            the full deck (from concept-cards.json)
 * @param {Record<string,object>} schedule  the stored { cardId -> state } map
 * @param {number} nowMs              current epoch ms
 * @param {{ newPerSession?: number }} [opts]
 * @returns {QueueItem[]}
 */
export function buildQueue(cards, schedule, nowMs, { newPerSession = DEFAULT_NEW_PER_SESSION } = {}) {
  const due = []
  const fresh = []

  for (const card of cards) {
    const state = schedule[card.id] ?? null
    if (!state) {
      fresh.push({ card, state: null, isNew: true })
    } else if (typeof state.due === 'number' && state.due <= nowMs) {
      due.push({ card, state, isNew: false })
    }
    // else: waiting — not due yet, skip.
  }

  // Missed cards first, then most-overdue first.
  const missed = (s) => ((s.lapses || 0) > 0 ? 1 : 0)
  due.sort((a, b) => {
    const missDiff = missed(b.state) - missed(a.state)
    if (missDiff !== 0) return missDiff
    return a.state.due - b.state.due
  })

  return [...due, ...fresh.slice(0, Math.max(0, newPerSession))]
}

/**
 * How many cards are DUE right now (excludes new cards) — the dashboard's
 * "cards due" number. New cards are counted separately.
 * @param {object[]} cards
 * @param {Record<string,object>} schedule
 * @param {number} nowMs
 * @returns {{ due: number, fresh: number }}
 */
export function countQueue(cards, schedule, nowMs) {
  let due = 0
  let fresh = 0
  for (const card of cards) {
    const state = schedule[card.id]
    if (!state) fresh += 1
    else if (typeof state.due === 'number' && state.due <= nowMs) due += 1
  }
  return { due, fresh }
}
