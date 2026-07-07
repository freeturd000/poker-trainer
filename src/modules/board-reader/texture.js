// Board texture classifier for Module 3 (CLAUDE.md §4 Module 3).
//
// ⚠️⚠️ CORRECTNESS-CRITICAL — FLAG FOR REVIEW ⚠️⚠️
// This file encodes the JUDGMENT of what makes a flop "wet" vs "dry". The suit and
// pair tags (monotone / two-tone / paired) are objective facts about the cards; the
// dry/wet axis is a heuristic scoring model and is the piece Evan needs to verify.
// Everything here is pure and deterministic so it can be unit-tested (see
// ./board-reader.test.mjs).
//
// ── The tag model ────────────────────────────────────────────────────────────
// A flop is described by tags drawn from EXACTLY this set:
//     dry | wet | paired | monotone | two-tone
// These come from three independent dimensions, so a board can carry several tags
// (e.g. "9♠8♠7♦" is BOTH wet AND two-tone):
//
//   1. Dry / Wet   — EXACTLY ONE always applies. This is the coordination axis.
//   2. Suit tag    — monotone (3 of a suit) | two-tone (exactly 2 suits) | none (rainbow).
//                    "rainbow" is deliberately NOT a tag — a rainbow board simply
//                    carries no suit tag. monotone and two-tone are mutually exclusive.
//   3. paired      — present iff two board cards share a rank.
//
// A valid answer set therefore is: {exactly one of dry|wet} ∪ {0-or-1 suit tag} ∪
// {paired?}. That invariant ("always pick dry or wet") is what makes the drill
// cleanly gradeable and learnable.
//
// ── The wetness score (the reviewable heuristic) ─────────────────────────────
// wetness = flushScore + straightScore, and the board is WET iff wetness ≥ WET_THRESHOLD.
//
//   flushScore:  monotone → 3   (flush already made — maximally wet, always wet)
//                two-tone → 1   (a flush DRAW exists)
//                rainbow  → 0
//
//   straightScore: sum over each pair of DISTINCT board ranks of a "connector"
//                  weight by the gap between them (ace counts as high OR low):
//                     adjacent (gap 1, e.g. 8-7) → 2
//                     one-gapper (gap 2, e.g. 8-6) → 1
//                     two-gapper (gap 3, e.g. 8-5) → 0.5
//                     gap ≥ 4                      → 0
//                  Paired boards have fewer distinct ranks, so they naturally score
//                  lower on straightness — which is correct (a pair kills straights).
//
// WET_THRESHOLD = 3 means, concretely:
//   • monotone            → always wet (flushScore 3 alone hits the bar).
//   • any two adjacent    → 2-tone+1connector still dry (needs more), but a fully
//     connected run like 9-8-7 (straightScore 5) is wet even rainbow.
//   • rainbow + one gap   → dry (e.g. K-7-2, A-K-4, Q-8-3 are all dry).
// See the test file for the anchor boards this is tuned against.

import { RANKS } from '../../engine/card.js'

const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2])) // '2'→2 … 'A'→14
const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' }

/** All texture tags the drill grades against, in canonical display order. */
export const TEXTURE_TAGS = ['dry', 'wet', 'paired', 'monotone', 'two-tone']

const WET_THRESHOLD = 3

// Gap between two ranks, treating an Ace as either high (14) or low (1) — so both
// A-K (gap 1) and A-2 (gap 1) read as connected.
function rankGap(a, b) {
  const vals = (r) => (r === 'A' ? [14, 1] : [RANK_VALUE[r]])
  let min = Infinity
  for (const x of vals(a)) for (const y of vals(b)) min = Math.min(min, Math.abs(x - y))
  return min
}

// Connector weight for a single gap between two ranks (see header for the scale).
function connector(gap) {
  if (gap === 1) return 2
  if (gap === 2) return 1
  if (gap === 3) return 0.5
  return 0
}

/**
 * Straight-coordination score for a set of DISTINCT board ranks. Exported because
 * the range-interaction heuristic reuses the exact same connectivity measure.
 * @param {string[]} distinctRanks - e.g. ['9','8','7']
 * @returns {number}
 */
export function straightScore(distinctRanks) {
  let s = 0
  for (let i = 0; i < distinctRanks.length; i++) {
    for (let j = i + 1; j < distinctRanks.length; j++) {
      s += connector(rankGap(distinctRanks[i], distinctRanks[j]))
    }
  }
  return s
}

// monotone (1 suit) | two-tone (2 suits) | rainbow (3 suits)
function flushClassOf(suits) {
  const distinct = new Set(suits).size
  if (distinct === 1) return 'monotone'
  if (distinct === 2) return 'two-tone'
  return 'rainbow'
}

function flushScoreOf(flushClass) {
  if (flushClass === 'monotone') return 3
  if (flushClass === 'two-tone') return 1
  return 0
}

function cardsToText(cards) {
  return cards.map((c) => `${c[0]}${SUIT_SYMBOL[c[1]]}`).join(' ')
}

/**
 * Classify a 3-card flop.
 * @param {string[]} cards - three canonical card strings, e.g. ['9s','8s','7d']
 * @returns {{
 *   tags: string[],            // sorted subset of TEXTURE_TAGS (the gradeable answer)
 *   wet: boolean,
 *   wetness: number,           // flushScore + straightScore
 *   flushClass: 'monotone'|'two-tone'|'rainbow',
 *   paired: boolean,
 *   straight: number,          // straightScore of the distinct ranks
 *   why: string,               // one-line explanation for the reveal
 * }}
 */
export function classifyTexture(cards) {
  if (cards.length !== 3) throw new Error(`Expected a 3-card flop, got ${cards.length}`)

  const ranks = cards.map((c) => c[0])
  const suits = cards.map((c) => c[1])
  const distinctRanks = [...new Set(ranks)]

  const paired = distinctRanks.length < ranks.length
  const flushClass = flushClassOf(suits)
  const straight = straightScore(distinctRanks)
  const wetness = flushScoreOf(flushClass) + straight
  const wet = wetness >= WET_THRESHOLD

  const tags = [wet ? 'wet' : 'dry']
  if (paired) tags.push('paired')
  if (flushClass === 'monotone') tags.push('monotone')
  if (flushClass === 'two-tone') tags.push('two-tone')
  // Keep tags in TEXTURE_TAGS order so equality checks and display are stable.
  tags.sort((a, b) => TEXTURE_TAGS.indexOf(a) - TEXTURE_TAGS.indexOf(b))

  // ── Build the one-line "why" from the same signals used to grade ──
  const parts = []
  if (straight >= 3) parts.push('connected (straights & straight draws)')
  else if (straight > 0) parts.push('loosely connected')
  else parts.push('disconnected')
  if (flushClass === 'monotone') parts.push('monotone (flush already possible)')
  else if (flushClass === 'two-tone') parts.push('two-tone (flush draw out there)')
  else parts.push('rainbow (no flush yet)')
  if (paired) parts.push('paired')

  const why = `${cardsToText(cards)} is ${wet ? 'wet' : 'dry'} — ${parts.join(', ')}.`

  return { tags, wet, wetness, flushClass, paired, straight, why }
}
