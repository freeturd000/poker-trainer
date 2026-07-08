// Anchor tests for the Live Toolkit's pure logic: session stats + bankroll/stakes.
// Run:  npm run test:live
//
// Covers the two correctness-flagged pieces — the session P/L math and the
// conservative bankroll thresholds. Plain Node, no framework — mirrors the other
// modules' *.test.mjs files.

import { computeSessionStats, sessionProfit } from './stats.js'
import {
  evaluateStake,
  recommendedStake,
  evaluateAll,
  STAKES,
  MIN_BUYINS,
  COMFORTABLE_BUYINS,
} from './stakes.js'

// --- tiny assertion harness -------------------------------------------------
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
function eq(label, actual, expected) {
  const ok = actual === expected
  check(`${label} (= ${expected})`, ok)
  if (!ok) console.log(`      got ${actual}`)
}

// --- session profit ---------------------------------------------------------
console.log('\nSession profit:')
{
  eq('cash 350 − buy 200 = +150', sessionProfit({ buyIn: 200, cashOut: 350 }), 150)
  eq('cash 0 − buy 200 = −200', sessionProfit({ buyIn: 200, cashOut: 0 }), -200)
  eq('missing fields → 0', sessionProfit({}), 0)
}

// --- lifetime stats ---------------------------------------------------------
console.log('\nLifetime stats:')
{
  const empty = computeSessionStats([])
  eq('empty → count 0', empty.count, 0)
  eq('empty → hourlyRate 0', empty.hourlyRate, 0)

  const sessions = [
    { buyIn: 200, cashOut: 500, hours: 3 }, // +300
    { buyIn: 300, cashOut: 100, hours: 2 }, // −200
    { buyIn: 200, cashOut: 200, hours: 5 }, // 0 (break-even, not a "win")
  ]
  const s = computeSessionStats(sessions)
  eq('count', s.count, 3)
  eq('totalProfit = 300 − 200 + 0 = 100', s.totalProfit, 100)
  eq('totalHours = 10', s.totalHours, 10)
  eq('hourlyRate = 100/10 = 10', s.hourlyRate, 10)
  eq('biggestWin = 300', s.biggestWin, 300)
  eq('biggestLoss = −200', s.biggestLoss, -200)
  eq('winningSessions = 1 (break-even excluded)', s.winningSessions, 1)
  check('winRate ≈ 33.3%', Math.abs(s.winRate - 100 / 3) < 1e-9)
}

console.log('\nAll-losing stats (biggestWin can be ≤ 0):')
{
  const s = computeSessionStats([
    { buyIn: 200, cashOut: 100, hours: 2 }, // −100
    { buyIn: 200, cashOut: 50, hours: 1 }, // −150
  ])
  eq('biggestWin = −100 (best of the losers)', s.biggestWin, -100)
  eq('biggestLoss = −150', s.biggestLoss, -150)
  eq('winningSessions = 0', s.winningSessions, 0)
  eq('winRate = 0', s.winRate, 0)
}

// --- stakes thresholds ------------------------------------------------------
console.log('\nBankroll thresholds (20 min / 30 comfortable, 100bb buy-in):')
{
  const stake12 = STAKES.find((x) => x.id === '1-2')
  eq('$1/$2 buy-in = 100bb = $200', stake12.buyIn, 200)

  eq('$6,000 at $1/$2 → comfortable', evaluateStake(6000, stake12).status, 'comfortable')
  eq('$4,000 at $1/$2 → minimum (exactly 20 buy-ins)', evaluateStake(4000, stake12).status, 'minimum')
  eq('$3,999 at $1/$2 → under', evaluateStake(3999, stake12).status, 'under')
  eq('$6,000 = exactly 30 buy-ins', evaluateStake(6000, stake12).buyIns, COMFORTABLE_BUYINS)

  // boundary is inclusive at MIN_BUYINS
  eq(
    `exactly ${MIN_BUYINS} buy-ins is "minimum" not "under"`,
    evaluateStake(stake12.buyIn * MIN_BUYINS, stake12).status,
    'minimum',
  )
}

// --- recommendedStake -------------------------------------------------------
console.log('\nRecommended stake (highest at least minimally rolled):')
{
  eq('$0 → null (under-rolled for smallest)', recommendedStake(0), null)
  eq('$3,999 → null', recommendedStake(3999), null)
  eq('$5,000 → $1/$2 (min $4k, comfy $6k)', recommendedStake(5000).stake.id, '1-2')
  eq('$5,000 → minimum status', recommendedStake(5000).status, 'minimum')
  // At $6,000 you're comfy for $1/$2 but ALSO exactly minimally rolled (20 buy-ins)
  // for the higher $1/$3 — the recommendation is the highest stake you can play.
  eq('$6,000 → $1/$3 (higher stake, min roll)', recommendedStake(6000).stake.id, '1-3')
  eq('$6,000 → minimum status', recommendedStake(6000).status, 'minimum')
  // $10,000: 2/5 wants $10k min (20×500), 1/3 wants $6k min → highest minimally-rolled is 2/5
  eq('$10,000 → $2/$5 (highest ≥20 buy-ins)', recommendedStake(10000).stake.id, '2-5')
  // Top of the ladder can show "comfortable": $10/$25 comfy = 30×$2,500 = $75,000
  eq('$80,000 → $10/$25 comfortable', recommendedStake(80000).stake.id, '10-25')
  eq('$80,000 → comfortable status', recommendedStake(80000).status, 'comfortable')

  const rows = evaluateAll(6000)
  eq('evaluateAll returns one row per stake', rows.length, STAKES.length)
  eq('evaluateAll preserves ascending order', rows[0].stake.id, STAKES[0].id)
}

// --- summary ----------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
