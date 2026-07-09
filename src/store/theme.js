// Theme preference (light / dark), persisted via the shared storage wrapper.
//
// The app defaults to DARK when nothing is saved. The chosen theme is applied by
// stamping `data-theme` on <html>, which selects the matching CSS-variable block
// in index.css. `applyTheme` is called once before React mounts (see main.jsx)
// so there's no light-theme flash before the store is read.

import { get, set } from './storage.js'

const THEME_KEY = 'theme'
const THEMES = ['light', 'dark']
export const DEFAULT_THEME = 'dark'

/** @returns {'light'|'dark'} the saved theme, or the dark default. */
export function getTheme() {
  const saved = get(THEME_KEY, null)
  return THEMES.includes(saved) ? saved : DEFAULT_THEME
}

/**
 * Persist + apply a theme. Ignores unknown values.
 * @param {'light'|'dark'} theme
 * @returns {'light'|'dark'} the theme now in effect
 */
export function setTheme(theme) {
  const next = THEMES.includes(theme) ? theme : DEFAULT_THEME
  set(THEME_KEY, next)
  applyTheme(next)
  return next
}

/** Stamp `data-theme` on the document root so the CSS variables switch. */
export function applyTheme(theme = getTheme()) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
  return theme
}
