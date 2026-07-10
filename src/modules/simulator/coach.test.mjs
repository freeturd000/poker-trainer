// Coach showdown-recap tests — the plain-English explanation of WHY a hand won.
// Run:  node src/modules/simulator/coach.test.mjs
//
// Covers recapResult's showdown breakdown: the ranked list (best → worst), each
// hand's beginner phrasing (reusing the /engine evaluator's own results), and the
// one-line verdict for a win, a loss, and a split pot. Plain Node, no framework —
// mirrors the other *.test.mjs files.

import { recapResult } from './coach.js'

let passed = 0
let failed = 0
function check(label, cond) {
  if (cond) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.log(`  ✗ FAIL: ${label}`)
  }
}
function has(label, str, sub) {
  check(`${label} — contains "${sub}"`, typeof str === 'string' && str.includes(sub))
  if (!(typeof str === 'string' && str.includes(sub))) console.log(`      got: ${str}`)
}

// Minimal `view` shaped like the simulator's: players array (index === seat),
// payouts with {index, amount}, a 5-card board.
function makeView({ board, players, payouts }) {
  return { board, players, payouts }
}
const nameBySeat = { 0: 'You', 1: 'Station', 2: 'Nit' }
const HERO = 0

// ── Hero wins: pair of sixes vs ace-high ─────────────────────────────────────
console.log('\nHero WIN — a pair beats no pair:')
{
  const board = ['6s', 'Kd', '2c', '9h', '4h']
  const view = makeView({
    board,
    players: [
      { status: 'active', holeCards: ['6d', 'Jc'] }, // hero: pair of sixes
      { status: 'active', holeCards: ['As', 'Ts'] }, // station: ace-high
    ],
    payouts: [{ index: 0, amount: 120 }],
  })
  const r = recapResult({ view, heroSeat: HERO, nameBySeat })
  check('has showdown block', !!r.showdown)
  check('two rows', r.showdown.rows.length === 2)
  check('winner ranked first', r.showdown.rows[0].isWinner && r.showdown.rows[0].isHero)
  has('row1 made', r.showdown.rows[0].made, 'a pair of sixes')
  has('row2 made', r.showdown.rows[1].made, 'ace-high')
  has('verdict names winner hand', r.showdown.verdict, 'A pair of sixes beats')
  has('verdict cites ranking order', r.showdown.verdict, 'hand-ranking order')
  has('summary', r.summary, 'You win 120 with a pair of sixes')
}

// ── Hero loses: their two pair beats hero's one pair ─────────────────────────
console.log('\nHero LOSS — two pair beats one pair:')
{
  const board = ['As', 'Kd', '2c', '7h', '9d']
  const view = makeView({
    board,
    players: [
      { status: 'active', holeCards: ['Ah', '4c'] }, // hero: pair of aces
      { status: 'active', holeCards: ['Ac', 'Kc'] }, // station: two pair, aces & kings
    ],
    payouts: [{ index: 1, amount: 200 }],
  })
  const r = recapResult({ view, heroSeat: HERO, nameBySeat })
  check('winner (Station) ranked first', r.showdown.rows[0].name === 'Station' && r.showdown.rows[0].isWinner)
  check('hero ranked below', r.showdown.rows[1].isHero && !r.showdown.rows[1].isWinner)
  has('verdict', r.showdown.verdict, 'Two pair, aces and kings beats a pair of aces')
  has('verdict cites ranking order', r.showdown.verdict, 'always ranks above')
  has('loss lesson is instructive', r.lesson, 'beaten')
}

// ── Same category → kicker decides ───────────────────────────────────────────
console.log('\nSame type — higher cards break the tie:')
{
  const board = ['As', 'Kd', '2c', '7h', '9d']
  const view = makeView({
    board,
    players: [
      { status: 'active', holeCards: ['Ah', 'Qc'] }, // pair of aces, Q kicker (wins)
      { status: 'active', holeCards: ['Ac', '4d'] }, // pair of aces, weaker kicker
    ],
    payouts: [{ index: 0, amount: 80 }],
  })
  const r = recapResult({ view, heroSeat: HERO, nameBySeat })
  has('verdict cites kicker', r.showdown.verdict, 'kicker')
}

// ── Split pot: both play the board ───────────────────────────────────────────
console.log('\nSplit pot — exact tie:')
{
  const board = ['As', 'Ad', 'Ac', 'Ah', 'Kd'] // quad aces on board, K plays
  const view = makeView({
    board,
    players: [
      { status: 'active', holeCards: ['2c', '3c'] },
      { status: 'active', holeCards: ['4d', '5s'] },
    ],
    payouts: [
      { index: 0, amount: 50 },
      { index: 1, amount: 50 },
    ],
  })
  const r = recapResult({ view, heroSeat: HERO, nameBySeat })
  has('verdict describes split', r.showdown.verdict, 'split the pot evenly')
}

// ── No showdown: everyone folded → no breakdown ──────────────────────────────
console.log('\nNo showdown — folded out:')
{
  const view = makeView({
    board: ['As', 'Kd', '2c'],
    players: [
      { status: 'active', holeCards: ['Ah', '4c'] },
      { status: 'folded', holeCards: ['Ac', 'Kc'] },
    ],
    payouts: [{ index: 0, amount: 30 }],
  })
  const r = recapResult({ view, heroSeat: HERO, nameBySeat })
  check('no showdown block', !r.showdown)
  has('summary notes uncontested win', r.summary, 'everyone else folded')
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`)
if (failed > 0) process.exit(1)
