// Spot generation + grading for the Odds Trainer (CLAUDE.md §4 Module 2).
//
// Four drill types, each producing a self-describing `spot` object that the UI
// renders and `gradeSpot` scores. Reads the outs reference from /src/data and the
// Monte Carlo equity calc from /src/engine — no new poker logic lives here.
//
// ⚠️ CORRECTNESS-CRITICAL bits are flagged inline: the pot-odds formula, the
// rule-of-2-&-4 shortcut, and the combined-verdict equity comparison.

import { createDeck, shuffle } from '../../engine/deck.js'
import { parseCard, formatCard, SUITS } from '../../engine/card.js'
import { calculateEquity } from '../../engine/equity.js'
import { getLeakWeight } from '../../store'
import { OUTS_TEMPLATES, OUTS_BY_TYPE } from '../../data/draws.js'

export const DRILL_TYPES = ['potodds', 'outs', 'ruleof24', 'combined']

export const TYPE_LABEL = {
  potodds: 'Pot Odds',
  outs: 'Outs',
  ruleof24: 'Rule of 2 & 4',
  combined: 'Combined Verdict',
}

// Leak tags — namespaced with the `odds_` prefix so the module can clear ONLY its
// own leaks (see LEAK_PREFIX) without touching other modules' leak log.
export const LEAK_PREFIX = 'odds_'
export const LEAK_TAG = {
  potodds: 'odds_potodds_miss',
  outs: 'odds_outs_miscount',
  ruleof24: 'odds_ruleof24_miss',
  combined: 'odds_combined_miss',
}

// Grading tolerances (percentage points). Pot odds and the shortcut allow a
// little slack for rounding; outs and the call/fold verdict are exact.
const POTODDS_TOL = 1.5
const RULE_TOL = 1

// Monte Carlo trials for the combined drill — enough to be stable, few enough to
// stay snappy on a click (hero vs one random villain).
const COMBINED_TRIALS = 3000

const rand = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rand(arr.length)]

// ---------- suit-permutation variety (safe: bijection over suits) ----------

function randomSuitMap() {
  const shuffled = shuffle(SUITS)
  const map = {}
  SUITS.forEach((s, i) => (map[s] = shuffled[i]))
  return map
}

function remapSuits(cards, map) {
  return cards.map((c) => {
    const { rank, suit } = parseCard(c)
    return formatCard(rank, map[suit])
  })
}

// ---------- pot / bet sizing shared by potodds + combined ----------

const POTS = [10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200]
const BET_FRACTIONS = [0.5, 0.6667, 0.75, 1, 1.5] // ½, ⅔, ¾, pot, overbet

// `pot` = chips in the middle BEFORE the bet; `bet` = what villain just bet (= the
// amount you must call).
function pickPotBet() {
  const pot = pick(POTS)
  const bet = Math.max(1, Math.round(pot * pick(BET_FRACTIONS)))
  return { pot, bet }
}

// ⚠️ CORRECTNESS-CRITICAL — the break-even (required) equity to call.
// You risk `call` to win the `pot + bet` already out there, and your call is also
// added to the pot, so:
//   required = call / ((pot + bet) + call)
// With call === bet this is bet / (pot + 2·bet). Matches the spec's
// requiredEquity = callAmount / (pot + callAmount), where `pot` there is the pot
// INCLUDING villain's bet (pot + bet here).
function requiredEquity(pot, bet) {
  const call = bet
  const potIncludingBet = pot + bet
  return (100 * call) / (potIncludingBet + call)
}

// ---------- generators ----------

function genPotOdds() {
  const { pot, bet } = pickPotBet()
  return { type: 'potodds', pot, bet, call: bet, required: requiredEquity(pot, bet) }
}

function genOuts() {
  const type = pick(Object.keys(OUTS_TEMPLATES))
  const info = OUTS_BY_TYPE[type]
  const map = randomSuitMap()
  const tmpl = OUTS_TEMPLATES[type]
  return {
    type: 'outs',
    drawType: type,
    hole: remapSuits(tmpl.hole, map),
    board: remapSuits(tmpl.board, map),
    outs: info.outs,
    label: info.label,
    why: info.why,
  }
}

function genRuleOf24() {
  // Realistic out counts that map to the draws we teach.
  const outs = pick([2, 4, 6, 8, 9, 12, 15])
  const cardsToCome = pick([1, 2]) // 1 = turn only (×2), 2 = flop, two to come (×4)
  const multiplier = cardsToCome === 2 ? 4 : 2 // ⚠️ the Rule of 2 and 4
  return { type: 'ruleof24', outs, cardsToCome, multiplier, answer: outs * multiplier }
}

function genCombined() {
  const deck = shuffle(createDeck())
  const hole = deck.slice(0, 2)
  const street = pick([3, 4]) // flop (3) or turn (4)
  const board = deck.slice(2, 2 + street)
  const { pot, bet } = pickPotBet()
  const required = requiredEquity(pot, bet)

  // ⚠️ CORRECTNESS-CRITICAL — real equity vs one random villain from the engine's
  // Monte Carlo calc, then call iff equity meets the pot-odds requirement.
  const equity = calculateEquity([hole, []], { board, trials: COMBINED_TRIALS })[0].equityPct
  const correctAction = equity >= required ? 'call' : 'fold'

  return { type: 'combined', hole, board, pot, bet, call: bet, required, equity, correctAction }
}

const GENERATORS = {
  potodds: genPotOdds,
  outs: genOuts,
  ruleof24: genRuleOf24,
  combined: genCombined,
}

// Weighted drill-type pick for "mixed" sessions: types you miss (higher leak
// weight) are served more often — the leak weighting from CLAUDE.md §4.
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
 * @param {string|null} [selected] - a specific drill type, or null/undefined for a
 *   leak-weighted mixed session.
 */
export function nextSpot(selected) {
  const type = selected ?? pickWeightedType()
  return GENERATORS[type]()
}

/**
 * Grade a user's answer for a spot.
 * @param {object} spot   - from nextSpot()
 * @param {number|string} input - number for potodds/outs/ruleof24; 'call'|'fold' for combined
 * @returns {{correct: boolean, correctText: string, explain: string}}
 */
export function gradeSpot(spot, input) {
  switch (spot.type) {
    case 'potodds': {
      const correct = Math.abs(Number(input) - spot.required) <= POTODDS_TOL
      const potNow = spot.pot + spot.bet
      return {
        correct,
        correctText: `${spot.required.toFixed(1)}%`,
        explain: `Call $${spot.call} to win the $${potNow} pot. Break-even = ${spot.call} ÷ (${spot.call} + ${potNow}) = ${spot.required.toFixed(1)}%.`,
      }
    }
    case 'outs': {
      const correct = Number(input) === spot.outs
      return {
        correct,
        correctText: `${spot.outs} outs`,
        explain: `${spot.label}: ${spot.why}`,
      }
    }
    case 'ruleof24': {
      const correct = Math.abs(Number(input) - spot.answer) <= RULE_TOL
      const come = spot.cardsToCome === 2 ? 'two cards to come' : 'one card to come'
      return {
        correct,
        correctText: `≈ ${spot.answer}%`,
        explain: `${spot.outs} outs × ${spot.multiplier} (${come}) ≈ ${spot.answer}%.`,
      }
    }
    case 'combined': {
      const correct = input === spot.correctAction
      return {
        correct,
        correctText: spot.correctAction.toUpperCase(),
        // The verdict line requested in the spec.
        explain: `You need ${spot.required.toFixed(0)}%, you have ${spot.equity.toFixed(0)}% — ${spot.correctAction}.`,
      }
    }
    default:
      throw new Error(`Unknown spot type: ${spot.type}`)
  }
}
