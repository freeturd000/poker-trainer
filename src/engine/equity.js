// Monte Carlo equity calculator.
//
// Estimates each hand's chance of winning by simulating many random runouts:
// every trial fills in any unknown hole cards and completes the board from a
// deck with all KNOWN cards removed, evaluates the showdown, and tallies the
// result. Known/dealt cards are never dealt twice — every trial draws without
// replacement from the same filtered "stub".
//
// Reuses ./deck.js (createDeck) and ./evaluator.js (findWinners). No new poker
// logic lives here.

import { createDeck } from './deck.js'
import { parseCard } from './card.js'
import { findWinners } from './evaluator.js'

/**
 * @typedef {Object} HandEquity
 * @property {number} winPct    - % of trials this hand won outright
 * @property {number} tiePct    - % of trials this hand was part of a split pot
 * @property {number} equityPct - pot-share equity (win + fractional ties); sums to ~100 across hands
 */

/**
 * Draw `count` distinct cards at random from `stub` without replacement.
 * Partial Fisher–Yates over a copy — does not mutate `stub`.
 * @param {string[]} stub
 * @param {number} count
 * @returns {string[]}
 */
function drawWithoutReplacement(stub, count) {
  const pool = stub.slice()
  const picked = []
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    picked.push(pool[i])
  }
  return picked
}

/**
 * Estimate equity for two or more hands.
 * @param {string[][]} hands - each entry is 0–2 known hole cards, e.g. [["As","Ad"], ["Kc","Kh"]].
 *                             Fewer than 2 known cards are filled randomly each trial.
 * @param {Object} [opts]
 * @param {string[]} [opts.board] - 0–5 known board cards.
 * @param {number} [opts.trials] - number of simulations (default 10000).
 * @returns {HandEquity[]} one entry per hand, in input order.
 */
export function calculateEquity(hands, { board = [], trials = 10000 } = {}) {
  if (!Array.isArray(hands) || hands.length < 2) {
    throw new Error('calculateEquity needs at least 2 hands')
  }
  if (board.length > 5) throw new Error(`Board cannot exceed 5 cards, got ${board.length}`)

  // Collect + validate every known card, and guard against duplicates.
  const known = [...hands.flat(), ...board]
  const seen = new Set()
  for (const c of known) {
    parseCard(c) // validates canonical form
    if (seen.has(c)) throw new Error(`Duplicate known card: ${c}`)
    seen.add(c)
  }

  const stub = createDeck().filter((c) => !seen.has(c))
  const boardNeed = 5 - board.length
  const holeNeeds = hands.map((h) => 2 - h.length)
  const totalNeed = holeNeeds.reduce((a, b) => a + b, 0) + boardNeed
  if (totalNeed > stub.length) {
    throw new Error(`Not enough cards left to run trials (need ${totalNeed}, have ${stub.length})`)
  }

  const n = hands.length
  const wins = new Array(n).fill(0)
  const ties = new Array(n).fill(0)
  const equity = new Array(n).fill(0)

  for (let t = 0; t < trials; t++) {
    const drawn = drawWithoutReplacement(stub, totalNeed)
    let idx = 0

    const fullHoles = hands.map((h, i) => {
      const need = holeNeeds[i]
      const filled = [...h, ...drawn.slice(idx, idx + need)]
      idx += need
      return filled
    })
    const fullBoard = [...board, ...drawn.slice(idx, idx + boardNeed)]

    const { winners } = findWinners(fullHoles, fullBoard)
    if (winners.length === 1) {
      wins[winners[0]] += 1
      equity[winners[0]] += 1
    } else {
      const share = 1 / winners.length
      for (const w of winners) {
        ties[w] += 1
        equity[w] += share
      }
    }
  }

  return hands.map((_, i) => ({
    winPct: (100 * wins[i]) / trials,
    tiePct: (100 * ties[i]) / trials,
    equityPct: (100 * equity[i]) / trials,
  }))
}
