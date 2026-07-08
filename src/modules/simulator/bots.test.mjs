// Anchor tests for the rule-based bots + headless driver (Module 5, part 2).
// Run:  npm run test:bots
//
// Confirms: bots ONLY ever choose legal actions, a bot-vs-bot hand always
// resolves cleanly with balanced pot math (chips in == chips out), no crashes
// over many simulated hands and seat counts, and each archetype shows its
// characteristic tendency (station calls far more than the nit; the TAG is the
// most aggressive). Plain Node, mirrors the engine's test style.

import { playHand, isLegalAction, BOT_NAMES, resolveBot } from './index.js'

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

const sumStacks = (view) => view.players.reduce((s, p) => s + p.stack, 0)

console.log('\n=== Simulator bot anchor tests ===\n')

// ---------------------------------------------------------------------------
// 1. Legality + clean resolution + chip conservation over a big sweep.
//    Every seat count 2–6, every archetype in every seat, many seeds.
// ---------------------------------------------------------------------------
console.log('1. Legality / resolution / balance sweep')
{
  let hands = 0
  let decisions = 0
  let illegal = 0
  let crashes = 0
  let unbalanced = 0
  const START = 100
  const blinds = { sb: 1, bb: 2 }

  for (let n = 2; n <= 6; n++) {
    for (let seed = 0; seed < 120; seed++) {
      // Assign archetypes round-robin across the seats, offset by seed so every
      // combination and seating gets exercised.
      const seats = Array.from({ length: n }, (_, i) => ({
        stack: START,
        bot: BOT_NAMES[(i + seed) % BOT_NAMES.length],
      }))
      const buttonIndex = seed % n
      let out
      try {
        out = playHand({ seats, blinds, buttonIndex, deal: { seed } })
      } catch (e) {
        crashes++
        if (crashes <= 3) console.log(`    crash n=${n} seed=${seed}: ${e.message}`)
        continue
      }
      hands++
      // Re-verify every recorded action was legal against its own legal list.
      for (const step of out.history) {
        decisions++
        if (!isLegalAction(step.action, step.legal)) illegal++
      }
      // Chip conservation: total out must equal total in.
      if (sumStacks(out.result) !== START * n) unbalanced++
      // Hand must have actually completed and awarded pots.
      if (!out.result.complete) crashes++
    }
  }

  console.log(
    `  · played ${hands} hands, ${decisions} bot decisions across 2–6 handed tables`,
  )
  console.log(`  · balance: ${hands - unbalanced}/${hands} hands had chips in == chips out`)
  check('no crashes / all hands resolved', crashes === 0)
  check('zero illegal actions chosen', illegal === 0)
  check('zero unbalanced pots', unbalanced === 0)
  check('actually played a meaningful number of hands', hands >= 500)
}

// ---------------------------------------------------------------------------
// 2. Archetype tendencies over many hands.
//    Fixed 3-handed table (nit, station, tag), button rotates so each bot sees
//    every position equally. Tally each bot's action types.
// ---------------------------------------------------------------------------
console.log('\n2. Archetype tendencies (nit vs station vs tag, 3-handed)')
{
  const order = ['nit', 'station', 'tag']
  const tally = Object.fromEntries(
    order.map((name) => [name, { fold: 0, check: 0, call: 0, aggressive: 0, total: 0 }]),
  )
  const HANDS = 900
  for (let seed = 0; seed < HANDS; seed++) {
    const seats = order.map((bot) => ({ stack: 100, bot }))
    const out = playHand({ seats, blinds: { sb: 1, bb: 2 }, buttonIndex: seed % 3, deal: { seed } })
    for (const step of out.history) {
      const t = tally[order[step.seat]]
      t.total++
      if (step.action.type === 'fold') t.fold++
      else if (step.action.type === 'check') t.check++
      else if (step.action.type === 'call') t.call++
      else t.aggressive++ // bet or raise
    }
  }

  // Print a compact tendency table (rates as % of that bot's decisions).
  const pct = (x, tot) => (tot ? ((100 * x) / tot).toFixed(1) : '0.0').padStart(5)
  console.log('    archetype |  fold%  check%  call%  aggr%   (decisions)')
  for (const name of order) {
    const t = tally[name]
    console.log(
      `    ${name.padEnd(9)} | ${pct(t.fold, t.total)}  ${pct(t.check, t.total)}  ` +
        `${pct(t.call, t.total)}  ${pct(t.aggressive, t.total)}   (${t.total})`,
    )
  }

  // VPIP-ish "continue" = call + aggressive as a fraction of decisions.
  const contRate = (t) => (t.call + t.aggressive) / t.total
  const aggrRate = (t) => t.aggressive / t.total
  const callRate = (t) => t.call / t.total

  // The station calls far more often than the nit.
  check(
    `station calls more than the nit (${(100 * callRate(tally.station)).toFixed(1)}% vs ${(
      100 * callRate(tally.nit)
    ).toFixed(1)}%)`,
    callRate(tally.station) > callRate(tally.nit) * 1.5,
  )
  // The station is looser overall than the nit (higher continue rate).
  check(
    'station continues more often than the nit',
    contRate(tally.station) > contRate(tally.nit),
  )
  // The nit folds the most (tightest).
  check(
    'nit folds the most of the three',
    tally.nit.fold / tally.nit.total > tally.station.fold / tally.station.total &&
      tally.nit.fold / tally.nit.total > tally.tag.fold / tally.tag.total,
  )
  // The TAG is the most aggressive (most bets/raises per decision).
  check(
    'TAG is the most aggressive of the three',
    aggrRate(tally.tag) > aggrRate(tally.nit) && aggrRate(tally.tag) > aggrRate(tally.station),
  )
}

// ---------------------------------------------------------------------------
// 3. Small unit checks on the registry + legality helper.
// ---------------------------------------------------------------------------
console.log('\n3. Registry + helper units')
{
  check('BOT_NAMES = nit/station/tag', BOT_NAMES.join(',') === 'nit,station,tag')
  check('resolveBot returns a function', typeof resolveBot('tag') === 'function')
  let threw = false
  try {
    resolveBot('wizard')
  } catch {
    threw = true
  }
  check('resolveBot rejects an unknown archetype', threw)
  const legal = [{ type: 'fold' }, { type: 'call', amount: 10 }, { type: 'raise', min: 20, max: 100 }]
  check('isLegalAction accepts an in-range raise', isLegalAction({ type: 'raise', amount: 40 }, legal))
  check('isLegalAction rejects an under-min raise', !isLegalAction({ type: 'raise', amount: 5 }, legal))
  check('isLegalAction rejects an off-menu check', !isLegalAction({ type: 'check' }, legal))
}

console.log(`\n=== ${passed} passed, ${failed} failed ===\n`)
if (failed > 0) process.exit(1)
