// Spot generation + grading for the Board Reader (CLAUDE.md §4 Module 3).
//
// Three drill types, each producing a self-describing `spot` object the UI renders
// and `gradeSpot` scores. The poker JUDGMENT lives in the dedicated, reviewable
// modules — this file only deals random layouts and routes to them:
//   • texture   → ./texture.js        (⚠️ reviewable wet/dry heuristic)
//   • whatbeats → ./whatBeats.js      (exact, evaluator-driven — no heuristic)
//   • range     → ./rangeInteraction.js (⚠️ reviewable range-advantage heuristic)

import { createDeck, shuffle } from '../../engine/deck.js'
import { evaluateHand } from '../../engine/evaluator.js'
import { getLeakWeight } from '../../store'
import { classifyTexture, TEXTURE_TAGS } from './texture.js'
import { beatingCategories, HAND_CLASSES } from './whatBeats.js'
import { favorFlop, isArchetypal, SCENARIOS } from './rangeInteraction.js'

export const DRILL_TYPES = ['texture', 'whatbeats', 'range']

export const TYPE_LABEL = {
  texture: 'Texture ID',
  whatbeats: 'What Beats You',
  range: 'Range Interaction',
}

// Leak tags — all namespaced with `board_` so the module clears ONLY its own leaks.
export const LEAK_PREFIX = 'board_'
export const LEAK_TAG = {
  texture: 'board_texture_miss',
  whatbeats: 'board_whatbeats_miss',
  range: 'board_range_miss',
}

const RANGE_TARGETS = ['raiser', 'caller', 'neutral']

const rand = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rand(arr.length)]

// ---------- generators ----------

// Texture: any random flop is fair game.
function genTexture() {
  const board = shuffle(createDeck()).slice(0, 3)
  const classify = classifyTexture(board)
  return { type: 'texture', board, classify, correctTags: classify.tags }
}

// What beats you: random hole + full board, but keep re-dealing until the hero has
// at least a pair AND at least one class of hand can beat them — otherwise the drill
// is trivial ("nothing beats a bare ace-high" / "you have the nuts").
function genWhatBeats() {
  let spot = null
  for (let attempt = 0; attempt < 40; attempt++) {
    const deck = shuffle(createDeck())
    const hole = deck.slice(0, 2)
    const board = deck.slice(2, 7)
    const hero = evaluateHand(hole, board)
    if (hero.rank < 2) continue // hero has only high card — skip
    const beat = beatingCategories(hole, board)
    if (beat.categories.length === 0) continue // hero holds the effective nuts — skip
    spot = { type: 'whatbeats', hole, board, ...beat }
    break
  }
  // Fallback (astronomically unlikely to be hit): a plain flush-over-flush spot.
  return spot ?? genWhatBeats()
}

// Range interaction: only serve archetypal, clear-cut boards for the chosen target.
function genRange() {
  const target = pick(RANGE_TARGETS)
  const scenario = pick(SCENARIOS)
  for (let attempt = 0; attempt < 400; attempt++) {
    const flop = shuffle(createDeck()).slice(0, 3)
    // Skip monotone boards — a made-flip texture muddies the range read for v1.
    if (new Set(flop.map((c) => c[1])).size === 1) continue
    const f = favorFlop(flop)
    if (isArchetypal(flop, target, f)) {
      return { type: 'range', flop, scenario, favor: f.favor, why: f.why }
    }
  }
  // Extremely unlikely fallback: retry with a fresh target.
  return genRange()
}

const GENERATORS = { texture: genTexture, whatbeats: genWhatBeats, range: genRange }

// Weighted drill-type pick for "mixed" sessions: types you miss more get served
// more (leak weighting, CLAUDE.md §4). Mirrors the Odds Trainer.
function pickWeightedType() {
  const weights = DRILL_TYPES.map((t) => getLeakWeight(LEAK_TAG[t]))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < DRILL_TYPES.length; i++) {
    if ((r -= weights[i]) < 0) return DRILL_TYPES[i]
  }
  return DRILL_TYPES[DRILL_TYPES.length - 1]
}

/**
 * The next spot to serve.
 * @param {string|null} [selected] - a specific drill type, or null for leak-weighted mixed.
 */
export function nextSpot(selected) {
  const type = selected ?? pickWeightedType()
  return GENERATORS[type]()
}

// ---------- grading ----------

const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

/**
 * Grade a user's answer.
 * @param {object} spot - from nextSpot()
 * @param {string[]|string} input - array of tags/classes (texture, whatbeats) OR a
 *   favor string 'raiser'|'caller'|'neutral' (range).
 * @returns {{ correct: boolean, correctText: string, explain: string }}
 */
export function gradeSpot(spot, input) {
  switch (spot.type) {
    case 'texture': {
      const correct = sameSet(input, spot.correctTags)
      return {
        correct,
        correctText: spot.correctTags.join(' · '),
        explain: spot.classify.why,
      }
    }
    case 'whatbeats': {
      const correct = sameSet(input, spot.categories)
      const list = spot.categories.length ? spot.categories.join(', ') : 'nothing — you have the nuts'
      return {
        correct,
        correctText: list,
        explain: `You hold ${spot.heroDescr}. Hands that beat you here: ${list}.`,
      }
    }
    case 'range': {
      const correct = input === spot.favor
      const label = { raiser: 'the preflop raiser', caller: 'the caller', neutral: 'neither (neutral)' }[spot.favor]
      return {
        correct,
        correctText: `Favors ${label}`,
        explain: spot.why,
      }
    }
    default:
      throw new Error(`Unknown spot type: ${spot.type}`)
  }
}

/**
 * Leak entries to record when a spot is missed. Returns one type-level tag (drives
 * the leak weighting above) plus, for texture, a finer wet/dry tag for the dashboard
 * detail — all `board_`-prefixed. Mirrors how the Odds Trainer records leaks.
 * @param {object} spot
 * @returns {{tag: string, meta: object}[]}
 */
export function leakEntriesForMiss(spot) {
  switch (spot.type) {
    case 'texture': {
      const axis = spot.classify.wet ? 'wet' : 'dry'
      const Axis = axis[0].toUpperCase() + axis.slice(1)
      return [
        { tag: LEAK_TAG.texture, meta: { type: 'texture', label: 'Texture ID' } },
        { tag: `board_texture_${axis}_miss`, meta: { type: 'texture', label: `${Axis} board misread` } },
      ]
    }
    case 'whatbeats':
      return [{ tag: LEAK_TAG.whatbeats, meta: { type: 'whatbeats', label: 'What beats you' } }]
    case 'range':
      return [{ tag: LEAK_TAG.range, meta: { type: 'range', label: `Range read (favors ${spot.favor})` } }]
    default:
      return []
  }
}

// Re-exports the UI needs for rendering answer menus.
export { TEXTURE_TAGS, HAND_CLASSES }
