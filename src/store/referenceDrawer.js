// Reference-drawer width (desktop), persisted via the shared storage wrapper.
//
// The Learn reference drawer is a slim non-blocking side panel on desktop whose
// width the user can drag to resize. That chosen width lives here so it's
// remembered across sessions. Purely a presentation preference — it touches no
// trainer state, engine, ranges, or grading.

import { get, set } from './storage.js'

const WIDTH_KEY = 'referenceDrawer.width'

// Clamp range: min keeps the glossary/phase content readable; max keeps the
// trainer beside it usable (also capped to ~half the viewport at read time).
export const MIN_DRAWER_WIDTH = 300
export const MAX_DRAWER_WIDTH = 600
export const DEFAULT_DRAWER_WIDTH = 340

/** Clamp a candidate width into the allowed range, falling back to the default. */
export function clampDrawerWidth(px) {
  if (typeof px !== 'number' || !Number.isFinite(px)) return DEFAULT_DRAWER_WIDTH
  return Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, Math.round(px)))
}

/** @returns {number} the saved drawer width (clamped), or the default. */
export function getDrawerWidth() {
  const saved = get(WIDTH_KEY, null)
  return saved === null ? DEFAULT_DRAWER_WIDTH : clampDrawerWidth(saved)
}

/**
 * Persist a drawer width. The value is clamped before writing.
 * @param {number} px
 * @returns {number} the width now stored
 */
export function setDrawerWidth(px) {
  const next = clampDrawerWidth(px)
  set(WIDTH_KEY, next)
  return next
}
