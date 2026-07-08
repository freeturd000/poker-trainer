// Anchor tests for the NLHE hand engine — the correctness-critical core.
// Run:  npm run test:sim
//
// Covers: blinds posted correctly, min-raise math, a full hand to showdown, a
// split pot, and a side-pot scenario with unequal all-ins. Every hand-level test
// asserts chip conservation (total chips in == total chips out) and PRINTS the
// balance check. Plain Node, no test framework — mirrors engine/sanity.test.mjs.

import {
  startHand,
  getLegalActions,
  applyAction,
  potTotal,
  computeSidePots,
  splitPot,
} from './index.js'
import { smallBlindIndex } from './positions.js'
import { createDeck } from '../../engine/deck.js'

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
  check(`${label} (= ${JSON.stringify(expected)})`, deepEq(actual, expected))
  if (!deepEq(actual, expected)) console.log(`      got ${JSON.stringify(actual)}`)
}
function deepEq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}
function throws(label, fn) {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  check(label, threw)
}

// Build a full 52-card deck that deals the requested hole cards + board, matching
// the engine's deal order (player-by-player from the small blind, 2 rounds, then
// flop/turn/river off the top — no burns).
function buildDeck({ n, buttonIndex, holes, board }) {
  const full = createDeck()
  const slots = new Array(52).fill(null)
  const used = new Set()
  const sb = smallBlindIndex(n, buttonIndex)
  for (const [seatStr, cards] of Object.entries(holes)) {
    const s = Number(seatStr)
    const offset = ((s - sb) % n + n) % n
    cards.forEach((c, j) => {
      slots[j * n + offset] = c
      used.add(c)
    })
  }
  board.forEach((c, i) => {
    slots[2 * n + i] = c
    used.add(c)
  })
  const leftover = full.filter((c) => !used.has(c))
  let li = 0
  for (let i = 0; i < 52; i++) if (slots[i] == null) slots[i] = leftover[li++]
  return slots
}

// Sum of all stacks (chips "out" once the hand is complete and pots are awarded).
const totalStacks = (state) => state.players.reduce((s, p) => s + p.stack, 0)

// Assert + print chip conservation for a completed hand.
function balanceCheck(label, startTotal, state) {
  const after = totalStacks(state)
  console.log(
    `  · balance [${label}]: chips in ${startTotal} == chips out ${after}  ${
      startTotal === after ? 'OK' : 'MISMATCH'
    }`,
  )
  check(`chip conservation: ${label}`, startTotal === after)
}

console.log('\n=== Simulator hand-engine anchor tests ===\n')

// ---------------------------------------------------------------------------
// 1. Blinds posted correctly
// ---------------------------------------------------------------------------
console.log('1. Blinds posted correctly (3-handed, btn=0, blinds 1/2)')
{
  const state = startHand({
    players: [{ stack: 100 }, { stack: 100 }, { stack: 100 }],
    buttonIndex: 0,
    blinds: { sb: 1, bb: 2 },
    deal: { seed: 1 },
  })
  eq('SB seat is 1', smallBlindIndex(3, 0), 1)
  eq('positions', state.players.map((p) => p.position), ['BTN', 'SB', 'BB'])
  eq('SB committed 1', state.players[1].committed, 1)
  eq('BB committed 2', state.players[2].committed, 2)
  eq('BTN committed 0', state.players[0].committed, 0)
  eq('currentBet = BB', state.currentBet, 2)
  eq('lastRaiseSize = BB', state.lastRaiseSize, 2)
  eq('pot total = 3', potTotal(state), 3)
  eq('first to act is BTN/UTG (seat 0)', state.toActIndex, 0)
}

// ---------------------------------------------------------------------------
// 2. Min-raise math
// ---------------------------------------------------------------------------
console.log('\n2. Min-raise math (3-handed, btn=0, blinds 1/2)')
{
  let state = startHand({
    players: [{ stack: 100 }, { stack: 100 }, { stack: 100 }],
    buttonIndex: 0,
    blinds: { sb: 1, bb: 2 },
    deal: { seed: 2 },
  })
  // Facing the BB: min raise-to is currentBet + lastRaiseSize = 2 + 2 = 4.
  let la = getLegalActions(state)
  const raise0 = la.actions.find((a) => a.type === 'raise')
  eq('BTN min raise-to = 4', raise0.min, 4)
  eq('BTN max raise-to = 100 (all-in)', raise0.max, 100)

  // A raise below the minimum is illegal (raise-to 3).
  throws('raise-to 3 is rejected', () => applyAction(state, { type: 'raise', amount: 3 }))

  // Raise to the minimum (4). Increment 2 == lastRaiseSize → full raise.
  state = applyAction(state, { type: 'raise', amount: 4 })
  eq('after raise: currentBet 4', state.currentBet, 4)
  eq('after raise: lastRaiseSize 2', state.lastRaiseSize, 2)

  // SB to act; next min raise-to = 4 + 2 = 6.
  la = getLegalActions(state)
  eq('to act is SB (seat 1)', la.toAct, 1)
  eq('SB min raise-to = 6', la.actions.find((a) => a.type === 'raise').min, 6)

  // SB re-raises to 10 (increment 6 → full). Next min raise-to = 10 + 6 = 16.
  state = applyAction(state, { type: 'raise', amount: 10 })
  eq('lastRaiseSize now 6', state.lastRaiseSize, 6)
  la = getLegalActions(state)
  eq('BB min raise-to = 16', la.actions.find((a) => a.type === 'raise').min, 16)
}

// ---------------------------------------------------------------------------
// 3. Full hand to showdown (heads-up, AA vs KK, checks down)
// ---------------------------------------------------------------------------
console.log('\n3. Full hand to showdown (heads-up, AA beats KK)')
{
  const startStacks = [100, 100]
  const deck = buildDeck({
    n: 2,
    buttonIndex: 0,
    holes: { 0: ['As', 'Ah'], 1: ['Ks', 'Kh'] },
    board: ['2c', '7d', '9h', 'Js', '3s'],
  })
  let state = startHand({
    players: [{ stack: 100 }, { stack: 100 }],
    buttonIndex: 0,
    blinds: { sb: 1, bb: 2 },
    deal: { deck },
  })
  // Preflop: SB(button) limps/calls, BB checks option.
  state = applyAction(state, { type: 'call' }) // seat 0 completes to 2
  state = applyAction(state, { type: 'check' }) // seat 1 checks option
  // Flop, turn, river: check-check each.
  for (const street of ['flop', 'turn', 'river']) {
    eq(`reached ${street}`, state.street, street)
    state = applyAction(state, { type: 'check' })
    state = applyAction(state, { type: 'check' })
  }
  eq('hand complete', state.complete, true)
  eq('board has 5 cards', state.board.length, 5)
  eq('pot was 4', state.pots.reduce((s, p) => s + p.amount, 0), 4)
  eq('single winner is seat 0 (AA)', state.payouts, [{ index: 0, amount: 4 }])
  eq('winner stack 102', state.players[0].stack, 102)
  eq('loser stack 98', state.players[1].stack, 98)
  balanceCheck('showdown', startStacks[0] + startStacks[1], state)
}

// ---------------------------------------------------------------------------
// 4. Split pot (heads-up, board plays, both tie)
// ---------------------------------------------------------------------------
console.log('\n4. Split pot (heads-up, royal flush on board — both play the board)')
{
  const startTotal = 200
  const deck = buildDeck({
    n: 2,
    buttonIndex: 0,
    holes: { 0: ['2c', '2d'], 1: ['3c', '3d'] },
    board: ['As', 'Ks', 'Qs', 'Js', 'Ts'], // royal flush; hole cards irrelevant
  })
  let state = startHand({
    players: [{ stack: 100 }, { stack: 100 }],
    buttonIndex: 0,
    blinds: { sb: 1, bb: 2 },
    deal: { deck },
  })
  // Get 10 in each: SB raises to 10, BB calls; then check down.
  state = applyAction(state, { type: 'raise', amount: 10 })
  state = applyAction(state, { type: 'call' })
  for (const _ of ['flop', 'turn', 'river']) {
    state = applyAction(state, { type: 'check' })
    state = applyAction(state, { type: 'check' })
  }
  eq('hand complete', state.complete, true)
  eq('pot was 20', state.pots.reduce((s, p) => s + p.amount, 0), 20)
  const byIdx = Object.fromEntries(state.payouts.map((x) => [x.index, x.amount]))
  eq('seat 0 gets half', byIdx[0], 10)
  eq('seat 1 gets half', byIdx[1], 10)
  eq('both stacks restored to 100', [state.players[0].stack, state.players[1].stack], [100, 100])
  balanceCheck('split pot', startTotal, state)
}

// ---------------------------------------------------------------------------
// 5. Side pot with unequal all-ins (3-handed)
//    Short stack (seat 1, 50) can only win the main pot; the extra goes to a
//    side pot contested by seats 0 and 2. Seat 1 (AA) wins main; seat 0 (KK)
//    beats seat 2 (QQ) for the side.
// ---------------------------------------------------------------------------
console.log('\n5. Side pot with unequal all-ins (3-handed)')
{
  const startStacks = [100, 50, 200]
  const startTotal = 350
  const deck = buildDeck({
    n: 3,
    buttonIndex: 0,
    holes: { 0: ['Ks', 'Kh'], 1: ['As', 'Ah'], 2: ['Qs', 'Qh'] },
    board: ['2c', '7d', '9h', 'Jd', '3d'],
  })
  let state = startHand({
    players: [{ stack: 100 }, { stack: 50 }, { stack: 200 }],
    buttonIndex: 0,
    blinds: { sb: 1, bb: 2 },
    deal: { deck },
  })
  // Seat 0 (BTN/UTG) shoves 100. Seat 1 (SB, 50) calls all-in for 50. Seat 2
  // (BB, 200) raises all-in to 200 — 100 of it is uncalled and returned.
  state = applyAction(state, { type: 'raise', amount: 100 }) // seat 0 all-in
  eq('seat 0 all-in', state.players[0].status, 'allin')
  state = applyAction(state, { type: 'call' }) // seat 1 all-in for 50
  eq('seat 1 all-in short', state.players[1].status, 'allin')
  eq('seat 1 committed 50', state.players[1].committed, 50)
  state = applyAction(state, { type: 'raise', amount: 200 }) // seat 2 all-in
  eq('hand complete after all-ins', state.complete, true)

  // Uncalled 100 returned to seat 2 → seat 2 committed 100.
  eq('seat 2 committed 100 (uncalled 100 returned)', state.players[2].committed, 100)

  // Pot structure: main 150 (all three), side 100 (seats 0 & 2).
  eq('two pots', state.pots.length, 2)
  eq('main pot', state.pots[0], { amount: 150, eligible: [0, 1, 2] })
  eq('side pot', state.pots[1], { amount: 100, eligible: [0, 2] })

  const byIdx = Object.fromEntries(state.payouts.map((x) => [x.index, x.amount]))
  eq('seat 1 (AA) wins main 150', byIdx[1], 150)
  eq('seat 0 (KK) wins side 100', byIdx[0], 100)
  check('seat 2 (QQ) wins nothing', byIdx[2] === undefined)
  eq('final stacks', [state.players[0].stack, state.players[1].stack, state.players[2].stack], [100, 150, 100])
  balanceCheck('side pot', startTotal, state)
}

// ---------------------------------------------------------------------------
// 6. Pot-math units: side-pot construction + split/odd-chip division
// ---------------------------------------------------------------------------
console.log('\n6. Pot math units (computeSidePots + splitPot)')
{
  eq(
    'equal contributions → single pot',
    computeSidePots([
      { committed: 100, folded: false },
      { committed: 100, folded: false },
      { committed: 100, folded: false },
    ]),
    [{ amount: 300, eligible: [0, 1, 2] }],
  )
  eq(
    'unequal all-ins → main + side',
    computeSidePots([
      { committed: 100, folded: false },
      { committed: 50, folded: false },
      { committed: 100, folded: false },
    ]),
    [
      { amount: 150, eligible: [0, 1, 2] },
      { amount: 100, eligible: [0, 2] },
    ],
  )
  eq(
    'folded player is dead money, not eligible',
    computeSidePots([
      { committed: 50, folded: true },
      { committed: 100, folded: false },
      { committed: 100, folded: false },
    ]),
    [{ amount: 250, eligible: [1, 2] }],
  )
  // splitPot: odd chip goes to the first listed winner.
  eq('split 10 / 3 → 4,3,3 (extra to first)', [...splitPot(10, [2, 0, 1]).entries()], [
    [2, 4],
    [0, 3],
    [1, 3],
  ])
  eq('split 9 / 3 → even', [...splitPot(9, [0, 1, 2]).entries()], [
    [0, 3],
    [1, 3],
    [2, 3],
  ])
  // Conservation of a split.
  const s = splitPot(101, [3, 1, 2])
  eq('split conserves chips', [...s.values()].reduce((a, b) => a + b, 0), 101)
}

// ---------------------------------------------------------------------------
console.log(`\n=== ${passed} passed, ${failed} failed ===\n`)
if (failed > 0) process.exit(1)
