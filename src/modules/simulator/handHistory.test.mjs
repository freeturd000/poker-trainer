// Tests for the simulator's structured hand-history builder/formatter.
//
// Pure-logic tests: they feed viewState-shaped snapshots (not the live engine) so
// they pin down the RECORD SHAPE and the reveal/formatting rules independently of
// engine internals. Hand classes come from the real evaluator.

import test from 'node:test'
import assert from 'node:assert/strict'
import { beginHand, recordAction, buildRecord, describeHand } from './handHistory.js'

// A 3-handed snapshot: hero (BTN) vs Nit (SB, folds) vs Station (BB, showdown).
const initialView = {
  players: [
    { seat: 0, position: 'BTN', stack: 200, committed: 0, streetCommitted: 0, status: 'active', holeCards: ['As', 'Kd'] },
    { seat: 1, position: 'SB', stack: 199, committed: 1, streetCommitted: 1, status: 'active', holeCards: ['Qc', 'Qh'] },
    { seat: 2, position: 'BB', stack: 198, committed: 2, streetCommitted: 2, status: 'active', holeCards: ['7c', '2d'] },
  ],
}
const nameBySeat = { 1: 'Nit', 2: 'Station' }

function playedOutBuilder() {
  const b = beginHand({
    view: initialView,
    blinds: { sb: 1, bb: 2 },
    buttonSeat: 0,
    heroSeat: 0,
    nameBySeat,
    handNo: 1,
  })
  // Preflop: hero raises, SB folds, BB calls.
  recordAction(b, { seat: 0, street: 'preflop', type: 'raise', amount: 6 })
  recordAction(b, { seat: 1, street: 'preflop', type: 'fold' })
  recordAction(b, { seat: 2, street: 'preflop', type: 'call', amount: 6 })
  // Flop: BB checks, hero bets, BB calls.
  recordAction(b, { seat: 2, street: 'flop', type: 'check' })
  recordAction(b, { seat: 0, street: 'flop', type: 'bet', amount: 8 })
  recordAction(b, { seat: 2, street: 'flop', type: 'call', amount: 8 })
  // Turn + river check through.
  recordAction(b, { seat: 2, street: 'turn', type: 'check' })
  recordAction(b, { seat: 0, street: 'turn', type: 'check' })
  recordAction(b, { seat: 2, street: 'river', type: 'check' })
  recordAction(b, { seat: 0, street: 'river', type: 'check' })
  return b
}

const board = ['Ah', '7h', '2s', 'Kh', '3d'] // hero: two pair A+K
const finalView = {
  board,
  players: [
    { seat: 0, position: 'BTN', stack: 215, status: 'active', holeCards: ['As', 'Kd'] },
    { seat: 1, position: 'SB', stack: 199, status: 'folded', holeCards: ['Qc', 'Qh'] },
    { seat: 2, position: 'BB', stack: 186, status: 'active', holeCards: ['7c', '2d'] },
  ],
  payouts: [{ index: 0, amount: 29 }],
  pots: [{ amount: 29, eligible: [0, 2] }],
}

test('beginHand captures blinds posted and hole cards', () => {
  const b = beginHand({ view: initialView, blinds: { sb: 1, bb: 2 }, buttonSeat: 0, heroSeat: 0, nameBySeat, handNo: 1 })
  assert.deepEqual(
    b.posts.map((p) => [p.position, p.kind, p.amount]),
    [['SB', 'sb', 1], ['BB', 'bb', 2]],
  )
  assert.equal(b.playersMeta[0].name, 'You')
  assert.equal(b.playersMeta[1].name, 'Nit')
})

test('buildRecord groups actions by street with the right board cards', () => {
  const rec = buildRecord({ builder: playedOutBuilder(), view: finalView, board, final: true, ts: 123 })
  const byStreet = Object.fromEntries(rec.streets.map((s) => [s.street, s]))
  assert.deepEqual(Object.keys(byStreet), ['preflop', 'flop', 'turn', 'river'])
  assert.deepEqual(byStreet.preflop.cards, [])
  assert.deepEqual(byStreet.flop.cards, ['Ah', '7h', '2s'])
  assert.deepEqual(byStreet.turn.cards, ['Kh'])
  assert.deepEqual(byStreet.river.cards, ['3d'])
  assert.equal(byStreet.preflop.actions.length, 3)
})

test('reveal rule: hero always, folded bot hidden, showdown bot shown', () => {
  const rec = buildRecord({ builder: playedOutBuilder(), view: finalView, board, final: true, ts: 123 })
  const bySeat = Object.fromEntries(rec.players.map((p) => [p.seat, p]))
  assert.deepEqual(bySeat[0].holeCards, ['As', 'Kd']) // hero
  assert.equal(bySeat[1].holeCards, null) // folded bot — hidden
  assert.deepEqual(bySeat[2].holeCards, ['7c', '2d']) // reached showdown — shown
})

test('result: winner, amount, evaluated hand, and hero net', () => {
  const rec = buildRecord({ builder: playedOutBuilder(), view: finalView, board, final: true, ts: 123 })
  assert.equal(rec.result.heroNet, 15) // 215 - 200
  assert.equal(rec.result.winners.length, 1)
  const w = rec.result.winners[0]
  assert.equal(w.seat, 0)
  assert.equal(w.amount, 29)
  assert.match(w.hand, /two pair/i)
  assert.equal(w.uncontested, false)
})

test('in-progress record hides bots and omits the result', () => {
  const rec = buildRecord({ builder: playedOutBuilder(), view: finalView, board, final: false })
  assert.equal(rec.result, null)
  const bySeat = Object.fromEntries(rec.players.map((p) => [p.seat, p]))
  assert.equal(bySeat[2].holeCards, null) // no showdown reveal while in progress
})

test('describeHand renders plain-English lines with correct person', () => {
  const d = describeHand(buildRecord({ builder: playedOutBuilder(), view: finalView, board, final: true, ts: 123 }))
  const preflop = d.streets.find((s) => s.label === 'Preflop')
  assert.match(preflop.line, /You \(BTN\) raise to 6/)
  assert.match(preflop.line, /Nit \(SB\) folds/)
  assert.match(preflop.line, /Station \(BB\) calls 6/)
  assert.match(d.resultLines[0], /You win 29 with Two Pair/i)
  assert.equal(d.net, 15)
})
