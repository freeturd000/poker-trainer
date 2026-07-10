// Bet-sizing presentation helper for Coach mode (CLAUDE.md §4, Module 5).
//
// Owns NO sizing judgment. The Postflop Trainer's sizingDecision() decides the
// sizing CATEGORY from board texture ('1/3' | '1/2' | '3/4' | 'pot'); this file
// only turns that category into (a) a pot fraction, (b) a plain-English label, and
// (c) a concrete, legal chip amount — using the SAME arithmetic as the bet slider
// (SimControls' sizeFor) so the coach's number and the slider can never disagree.

import { sizingDecision } from '../postflop-trainer/heuristics.js'
import { classifyTexture } from '../board-reader/texture.js'

// sizingDecision size id → pot fraction and a beginner-friendly label (with the
// same ⅓ / ½ / ¾ glyphs the slider's shortcut buttons use).
const FRAC = { '1/3': 1 / 3, '1/2': 1 / 2, '3/4': 3 / 4, pot: 1 }
const LABEL = {
  '1/3': 'small, about ⅓ of the pot',
  '1/2': 'about ½ of the pot',
  '3/4': 'big, about ¾ of the pot',
  pot: 'the full pot',
}

/**
 * Fraction-of-pot → a legal TO-amount. IDENTICAL math to SimControls' sizeFor: for
 * a raise the fraction is added on top of the current bet; for an open bet it's a
 * fraction of the pot. Clamped to the engine's legal [min, max].
 */
export function fracToAmount({ frac, pot, currentBet, isRaise, min, max }) {
  const base = isRaise ? currentBet + Math.round(pot * frac) : Math.round(pot * frac)
  return Math.max(min, Math.min(max, base))
}

/**
 * The coach's recommended postflop size, from the flop texture. Returns null when
 * there is no flop yet (preflop), since sizingDecision is a board-texture heuristic
 * and has nothing to say about a preflop open.
 * @param {string[]} board - 3+ community cards
 * @param {'value'|'bluff'} [role]
 * @returns {{ size:string, frac:number, label:string } | null}
 */
export function coachSizing(board, role = 'value') {
  if (!Array.isArray(board) || board.length < 3) return null
  const { wetness } = classifyTexture(board.slice(0, 3))
  const { size } = sizingDecision({ wetness, role })
  return { size, frac: FRAC[size], label: LABEL[size] }
}
