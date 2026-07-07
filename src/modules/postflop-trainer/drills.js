// Spot generation + grading for the Postflop Trainer (CLAUDE.md §4 Module 4).
//
// Three drill types, each producing a self-describing `spot` object the UI renders
// and `gradeSpot` scores. The poker JUDGMENT lives in the dedicated, reviewable
// modules — this file only deals random layouts and routes to them:
//   • cbet    → ./heuristics.js cbetDecision   (⚠️ reviewable c-bet policy)
//   • facing  → ./heuristics.js facingDecision (⚠️ reviewable facing-a-bet policy)
//   • sizing  → ./heuristics.js sizingDecision (⚠️ reviewable bet-sizing policy)
// Hand strength comes from ./handStrength.js; texture + range advantage are reused
// from the Board Reader (../board-reader) — nothing is duplicated here.

import { createDeck, shuffle } from '../../engine/deck.js'
import { getLeakWeight } from '../../store'
import { classifyTexture } from '../board-reader/texture.js'
import { favorFlop, SCENARIOS } from '../board-reader/rangeInteraction.js'
import { analyzeHand } from './handStrength.js'
import {
  cbetDecision,
  facingDecision,
  sizingDecision,
  requiredEquityFromFrac,
  drawEquity,
  fracLabel,
} from './heuristics.js'

export const DRILL_TYPES = ['cbet', 'facing', 'sizing']

export const TYPE_LABEL = {
  cbet: 'C-bet Decision',
  facing: 'Facing a Bet',
  sizing: 'Bet Sizing',
}

// Leak tags — all namespaced with `postflop_` so the module clears ONLY its own leaks.
export const LEAK_PREFIX = 'postflop_'
export const LEAK_TAG = {
  cbet: 'postflop_cbet_miss',
  facing: 'postflop_facing_miss',
  sizing: 'postflop_sizing_miss',
}

// Bet sizes offered in the Facing drill (fraction of pot + display label).
const BET_SIZES = [
  { frac: 1 / 3, label: '⅓ pot' },
  { frac: 1 / 2, label: '½ pot' },
  { frac: 2 / 3, label: '⅔ pot' },
  { frac: 3 / 4, label: '¾ pot' },
  { frac: 1, label: 'pot' },
]

const rand = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rand(arr.length)]

// ---------- generators ----------

// C-bet: hero is the preflop raiser (a Board-Reader scenario, framed from the
// raiser's seat) and sees a random flop. Every flop has a deterministic answer, so
// no filtering is needed beyond dealing.
function genCbet() {
  const deck = shuffle(createDeck())
  const hole = deck.slice(0, 2)
  const flop = deck.slice(2, 5)
  const tex = classifyTexture(flop)
  const fav = favorFlop(flop)
  const a = analyzeHand(hole, flop)
  const dec = cbetDecision({ bucket: a.bucket, wet: tex.wet, favor: fav.favor })
  const scenario = pick(SCENARIOS) // reuse "BTN raised, BB called" framings
  return {
    type: 'cbet',
    hole,
    board: flop,
    scenario,
    bucket: a.bucket,
    handDescr: a.madeDescr,
    correct: dec.action, // 'cbet' | 'check'
    why: dec.why,
  }
}

// Facing a bet: hero called preflop and now faces a flop OR turn bet of a random
// size. Re-deal a few times to avoid serving DRAW spots whose equity sits right on
// the pot-odds line (an ambiguous, coin-flip grade).
function genFacing() {
  let spot = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const deck = shuffle(createDeck())
    const hole = deck.slice(0, 2)
    const streetCards = pick([3, 4]) // flop (3) or turn (4)
    const board = deck.slice(2, 2 + streetCards)
    const street = streetCards === 3 ? 'flop' : 'turn'
    const tex = classifyTexture(board.slice(0, 3)) // texture is set by the flop
    const a = analyzeHand(hole, board)
    const { frac, label } = pick(BET_SIZES)

    // Skip borderline draw spots: keep the correct call/fold clearly one-sided.
    if (a.bucket === 'draw') {
      const margin = drawEquity(a.outs, street) - requiredEquityFromFrac(frac)
      if (Math.abs(margin) < 4) continue
    }

    const dec = facingDecision({
      bucket: a.bucket,
      strongValue: a.strongValue,
      outs: a.outs,
      betFrac: frac,
      street,
      wet: tex.wet,
    })
    spot = {
      type: 'facing',
      hole,
      board,
      street,
      betFrac: frac,
      betLabel: label,
      bucket: a.bucket,
      handDescr: a.madeDescr,
      correct: dec.action, // 'call' | 'raise' | 'fold'
      why: dec.why,
    }
    break
  }
  return spot ?? genFacing()
}

// Bet sizing: only serve spots where BETTING is correct (hero has a value hand or a
// strong draw) and the board's wetness sits comfortably inside a size bucket, so
// the ⅓/½/¾/pot answer is unambiguous.
const SIZE_THRESHOLDS = [2, 4, 6]
const nearThreshold = (w) => SIZE_THRESHOLDS.some((t) => w >= t - 0.5 && w < t)

function genSizing() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const deck = shuffle(createDeck())
    const hole = deck.slice(0, 2)
    const flop = deck.slice(2, 5)
    const a = analyzeHand(hole, flop)
    if (a.bucket !== 'value' && a.bucket !== 'draw') continue // betting must be correct
    const tex = classifyTexture(flop)
    if (nearThreshold(tex.wetness)) continue // avoid on-the-line wetness

    const role = a.bucket === 'value' ? 'value' : 'bluff'
    const dec = sizingDecision({ wetness: tex.wetness, role })
    return {
      type: 'sizing',
      hole,
      board: flop,
      role, // 'value' | 'bluff' (semi-bluff)
      bucket: a.bucket,
      handDescr: a.madeDescr,
      correct: dec.size, // '1/3' | '1/2' | '3/4' | 'pot'
      why: dec.why,
    }
  }
  // Extremely unlikely fallback.
  return genSizing()
}

const GENERATORS = { cbet: genCbet, facing: genFacing, sizing: genSizing }

// Weighted drill-type pick for "mixed" sessions: types you miss more get served
// more (leak weighting, CLAUDE.md §4). Mirrors the Odds Trainer and Board Reader.
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

// Uppercased, human labels for each drill's answer options (also drives the UI).
export const ANSWERS = {
  cbet: [
    { value: 'cbet', label: 'C-bet' },
    { value: 'check', label: 'Check' },
  ],
  facing: [
    { value: 'call', label: 'Call' },
    { value: 'raise', label: 'Raise' },
    { value: 'fold', label: 'Fold' },
  ],
  sizing: [
    { value: '1/3', label: '⅓' },
    { value: '1/2', label: '½' },
    { value: '3/4', label: '¾' },
    { value: 'pot', label: 'Pot' },
  ],
}

const CORRECT_TEXT = {
  cbet: { cbet: 'C-bet', check: 'Check' },
  facing: { call: 'Call', raise: 'Raise', fold: 'Fold' },
  sizing: { '1/3': '⅓ pot', '1/2': '½ pot', '3/4': '¾ pot', pot: 'Pot-sized' },
}

/**
 * Grade a user's answer.
 * @param {object} spot - from nextSpot()
 * @param {string} input - one of the ANSWERS[type] values
 * @returns {{ correct: boolean, correctText: string, explain: string }}
 */
export function gradeSpot(spot, input) {
  const correct = input === spot.correct
  return {
    correct,
    correctText: CORRECT_TEXT[spot.type][spot.correct] ?? spot.correct,
    explain: spot.why,
  }
}

/**
 * Leak entries to record when a spot is missed. One type-level tag per drill (drives
 * the leak weighting above), all `postflop_`-prefixed. Mirrors the other trainers.
 * @param {object} spot
 * @returns {{tag: string, meta: object}[]}
 */
export function leakEntriesForMiss(spot) {
  return [{ tag: LEAK_TAG[spot.type], meta: { type: spot.type, label: TYPE_LABEL[spot.type] } }]
}

// Re-export for the UI's bet-size labelling.
export { fracLabel }
