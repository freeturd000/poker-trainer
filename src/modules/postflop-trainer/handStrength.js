// Hand-strength analysis for the Postflop Trainer (CLAUDE.md §4 Module 4).
//
// ⚠️⚠️ CORRECTNESS-CRITICAL — FLAG FOR REVIEW ⚠️⚠️
// This file turns (hole + board) into the strength *bucket* the three postflop
// heuristics reason about. The made-hand rank comes from the exact engine
// evaluator (no judgment there), but two pieces ARE judgment calls Evan should
// verify:
//   1. pairQuality() — where the line sits between a "value" one-pair hand
//      (top pair / overpair) and a "marginal" one (middle/bottom/under pair).
//   2. the draw detectors — what counts as a *strong* draw (flush draw or
//      open-ended straight draw) versus a weak one (gutshot) versus nothing.
// Everything here is pure + deterministic so it can be unit-tested against anchor
// spots (see ./postflop-trainer.test.mjs).
//
// ── The bucket model ─────────────────────────────────────────────────────────
// analyzeHand() collapses a holding into EXACTLY ONE of four action buckets, in
// priority order (strongest action wins):
//     value    — a made hand worth betting/raising: two pair+, OR top pair /
//                overpair. These want to build the pot.
//     draw     — no (or only weak) made hand, but a STRONG draw: flush draw or
//                open-ended straight draw. Semi-bluff / equity to continue.
//     marginal — a weak made pair (middle / bottom / under pair). Showdown value,
//                pot-control candidate, thin bluff-catcher.
//     air      — no pair and no strong draw (incl. a bare gutshot). Nothing.
// The priority ordering means a weak pair that ALSO has a flush draw is bucketed
// as `draw` (its equity, not its showdown value, drives the correct action).

import { evaluateHand } from '../../engine/evaluator.js'
import { RANKS } from '../../engine/card.js'

const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2])) // '2'→2 … 'A'→14

export const BUCKETS = ['value', 'draw', 'marginal', 'air']

// Standard "outs" for the draw types we recognise, used to estimate equity later.
const FLUSH_DRAW_OUTS = 9
const OESD_OUTS = 8
const OUTS_CAP = 15 // biggest combo draw we credit (flush + open-ender ≈ 15)

// ---------- draw detection ----------

// A value-set of a card list, counting an Ace as BOTH high (14) and low (1) so
// wheel draws (A-2-3-4-…) are recognised.
function valueSet(cards) {
  const s = new Set()
  for (const c of cards) {
    const v = RANK_VALUE[c[0]]
    s.add(v)
    if (v === 14) s.add(1)
  }
  return s
}

// True if the value-set already contains five consecutive ranks (a made straight).
function hasFiveRun(valueSet) {
  for (let lo = 1; lo <= 10; lo++) {
    let run = true
    for (let k = 0; k < 5; k++) {
      if (!valueSet.has(lo + k)) {
        run = false
        break
      }
    }
    if (run) return true
  }
  return false
}

// Ranks (2..14) that, if added, would COMPLETE a straight for this value-set
// (assumes the set is not already a straight).
function completingRanks(values) {
  const out = []
  for (let r = 2; r <= 14; r++) {
    const t = new Set(values)
    t.add(r)
    if (r === 14) t.add(1)
    if (hasFiveRun(t)) out.push(r)
  }
  return out
}

/**
 * Ranks that give HERO a straight, excluding any that the board would complete on
 * its own (a shared board draw is nobody's private edge). Empty if hero already
 * has a straight or has no straight draw.
 * @param {string[]} hole
 * @param {string[]} board
 * @returns {number[]} completing ranks (2..14); length 2 ⇒ open-ended, 1 ⇒ gutshot
 */
export function heroStraightOutRanks(hole, board) {
  const heroVals = valueSet([...hole, ...board])
  if (hasFiveRun(heroVals)) return []
  const boardComp = new Set(completingRanks(valueSet(board)))
  return completingRanks(heroVals).filter((r) => !boardComp.has(r))
}

/**
 * True if hero holds a four-to-a-flush draw (any suit appears exactly 4 times
 * across hole+board). A five-card flush is a MADE hand, handled by the evaluator,
 * so it is intentionally not reported here.
 * @param {string[]} cards - hole + board
 */
export function hasFlushDraw(cards) {
  const counts = {}
  for (const c of cards) counts[c[1]] = (counts[c[1]] || 0) + 1
  return Object.values(counts).some((n) => n === 4)
}

// ---------- one-pair quality (⚠ the reviewable pair threshold) ----------

// Given a hand the evaluator scored as exactly ONE pair, decide whether it's a
// "value" pair (top pair or an overpair) or a "marginal" one (anything weaker).
function pairQuality(hole, board) {
  const boardVals = board.map((c) => RANK_VALUE[c[0]])
  const topBoard = Math.max(...boardVals)
  const holeVals = hole.map((c) => RANK_VALUE[c[0]])
  const pocketPair = hole[0][0] === hole[1][0]

  // Overpair: a pocket pair bigger than every board card (JJ on 9-7-2).
  if (pocketPair && holeVals[0] > topBoard) return 'value'
  // Top pair: hero holds a card matching the highest board card.
  if (holeVals.includes(topBoard)) return 'value'
  // Second/bottom pair, or an underpair below the top card → marginal.
  return 'marginal'
}

// ---------- the analyzer ----------

/**
 * @typedef {Object} HandAnalysis
 * @property {'value'|'draw'|'marginal'|'air'} bucket
 * @property {boolean} strongValue - two pair or better (a raise-for-value hand)
 * @property {string} madeName     - evaluator's class, e.g. "Two Pair", "Pair"
 * @property {string} madeDescr    - human-readable made hand
 * @property {boolean} flushDraw
 * @property {boolean} straightDraw - open-ended (strong); a bare gutshot is false
 * @property {boolean} gutshot
 * @property {number} outs          - estimated outs for the strong draw (0 if none)
 */

/**
 * Analyze hero's holding on a 3- (flop) or 4-card (turn) board.
 * @param {string[]} hole  - two hole cards
 * @param {string[]} board - three or four board cards
 * @returns {HandAnalysis}
 */
export function analyzeHand(hole, board) {
  const hero = evaluateHand(hole, board) // works for 5–6 cards
  const madeRank = hero.rank // 1 high card .. 9 straight flush
  const all = [...hole, ...board]

  // Draws only matter when hero hasn't already made that category.
  const flushDraw = madeRank < 6 && hasFlushDraw(all)
  const stOuts = madeRank < 5 ? heroStraightOutRanks(hole, board) : []
  const straightDraw = stOuts.length >= 2 // open-ended / double-gutter
  const gutshot = stOuts.length === 1
  const strongDraw = flushDraw || straightDraw

  // Estimated outs for the strong draw (used for equity vs pot odds later).
  let outs = 0
  if (flushDraw) outs += FLUSH_DRAW_OUTS
  if (straightDraw) outs += OESD_OUTS
  outs = Math.min(outs, OUTS_CAP)

  // Made-hand quality → the value/marginal axis.
  let madeBucket
  if (madeRank >= 3) madeBucket = 'strongValue' // two pair or better
  else if (madeRank === 2) madeBucket = pairQuality(hole, board) // 'value' | 'marginal'
  else madeBucket = 'none'

  // Collapse to one action bucket (strongest action wins).
  let bucket
  if (madeBucket === 'strongValue' || madeBucket === 'value') bucket = 'value'
  else if (strongDraw) bucket = 'draw'
  else if (madeBucket === 'marginal') bucket = 'marginal'
  else bucket = 'air'

  return {
    bucket,
    strongValue: madeRank >= 3,
    madeName: hero.name,
    madeDescr: hero.descr,
    flushDraw,
    straightDraw,
    gutshot,
    outs,
  }
}
