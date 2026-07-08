// Anchor tests for the Concept Deck's SM-2 scheduler and session queue.
// Run:  npm run test:concept
//
// The scheduler is the correctness-critical piece (interval/ease progression), so
// these lock in the documented behaviour: graduating steps, ease adjustments,
// lapse handling, the min-ease floor, and the due/new queue ordering. Plain Node,
// no framework — mirrors simulator/simulator.test.mjs.

import {
  schedule,
  newCardState,
  previewInterval,
  MIN_EASE,
  DEFAULT_EASE,
} from './scheduler.js'
import { buildQueue, countQueue } from './session.js'

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
function approx(label, actual, expected, tol = 1e-9) {
  check(`${label} (≈ ${expected})`, Math.abs(actual - expected) <= tol)
}

const DAY_MS = 24 * 60 * 60 * 1000
const NOW = 1_700_000_000_000 // fixed epoch ms — tests must be deterministic

// --- graduating steps (fresh card) -----------------------------------------
console.log('\nGraduating steps from a new card:')
{
  const good = schedule(null, 'good', NOW)
  eq('new + good → 1 day interval', good.interval, 1)
  eq('new + good → reps 1', good.reps, 1)
  eq('new + good → due = now + 1d', good.due, NOW + DAY_MS)
  eq('new + good → ease unchanged', good.ease, DEFAULT_EASE)

  const easy = schedule(null, 'easy', NOW)
  eq('new + easy → 4 day interval', easy.interval, 4)
  approx('new + easy → ease +0.15', easy.ease, DEFAULT_EASE + 0.15)

  const hard = schedule(null, 'hard', NOW)
  eq('new + hard → 1 day interval', hard.interval, 1)
  approx('new + hard → ease -0.15', hard.ease, DEFAULT_EASE - 0.15)
}

// --- classic SM-2 second step -----------------------------------------------
console.log('\nSecond step (reps 1, good):')
{
  const first = schedule(null, 'good', NOW) // reps 1, interval 1
  const second = schedule(first, 'good', NOW + DAY_MS)
  eq('reps1 + good → 6 day interval', second.interval, 6)
  eq('reps1 + good → reps 2', second.reps, 2)
}

// --- steady-state growth by ease --------------------------------------------
console.log('\nSteady state (reps ≥ 2 scales by ease):')
{
  // reps: new→1 (I=1), →2 (I=6), →3 (I=round(6*2.5)=15)
  let s = schedule(null, 'good', NOW)
  s = schedule(s, 'good', NOW)
  s = schedule(s, 'good', NOW)
  eq('third good → round(6 × 2.5) = 15', s.interval, 15)
  eq('third good → reps 3', s.reps, 3)
}

// --- again = lapse ----------------------------------------------------------
console.log('\nLapse (again):')
{
  let s = schedule(null, 'good', NOW) // reps 1
  s = schedule(s, 'good', NOW) // reps 2, interval 6
  const lapsed = schedule(s, 'again', NOW)
  eq('again → reps reset to 0', lapsed.reps, 0)
  eq('again → lapses incremented', lapsed.lapses, 1)
  approx('again → ease -0.20', lapsed.ease, DEFAULT_EASE - 0.2)
  check('again → due within the hour (relearn this session)', lapsed.due - NOW < 60 * 60 * 1000)
  check('again → sub-day interval', lapsed.interval < 1)
}

// --- ease floor -------------------------------------------------------------
console.log('\nEase floor:')
{
  let s = newCardState()
  for (let i = 0; i < 20; i++) s = schedule(s, 'again', NOW)
  check(`ease never drops below MIN_EASE (${MIN_EASE})`, s.ease >= MIN_EASE)
  eq('ease pinned at MIN_EASE after many agains', s.ease, MIN_EASE)
}

// --- previewInterval labels -------------------------------------------------
console.log('\nPreview labels:')
{
  eq('new + good preview', previewInterval(null, 'good'), '1d')
  eq('new + easy preview', previewInterval(null, 'easy'), '4d')
  eq('again preview', previewInterval(null, 'again'), '10m')
}

// --- session queue ordering -------------------------------------------------
console.log('\nSession queue:')
{
  const cards = [
    { id: 'a', category: 'X', front: 'a', back: 'a' },
    { id: 'b', category: 'X', front: 'b', back: 'b' },
    { id: 'c', category: 'X', front: 'c', back: 'c' },
    { id: 'd', category: 'X', front: 'd', back: 'd' }, // new (no state)
    { id: 'e', category: 'X', front: 'e', back: 'e' }, // new (no state)
  ]
  const sched = {
    a: { ease: 2.5, interval: 1, reps: 1, lapses: 0, due: NOW - 1000, lastReviewed: NOW },
    b: { ease: 2.0, interval: 1, reps: 1, lapses: 2, due: NOW - 500, lastReviewed: NOW }, // missed
    c: { ease: 2.5, interval: 5, reps: 3, lapses: 0, due: NOW + DAY_MS, lastReviewed: NOW }, // not due
  }

  const q = buildQueue(cards, sched, NOW, { newPerSession: 1 })
  eq('queue length = 2 due + 1 new (capped)', q.length, 3)
  eq('missed card (b) served first', q[0].card.id, 'b')
  eq('other due card (a) second', q[1].card.id, 'a')
  check('new card comes after due cards', q[2].isNew === true)
  check('not-due card (c) excluded', !q.some((i) => i.card.id === 'c'))

  const counts = countQueue(cards, sched, NOW)
  eq('countQueue due', counts.due, 2)
  eq('countQueue fresh (new)', counts.fresh, 2)
}

// --- summary ----------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
