// Engine sanity check — a manual regression test for the poker engine.
//
// Run this after ANY change to evaluator.js or equity.js:  npm run sanity
// It prints known-answer results so correctness can be eyeballed. Expected:
//   - AA vs KK preflop   -> AA ~82% equity   (roughly 80–82%)
//   - AKs vs QQ preflop  -> ~50/50 coin flip (roughly 46–54% each)
//   - a made board flush -> evaluates as "Flush" and beats one pair
// Monte Carlo numbers wobble a percent or two between runs — that's expected.

import { evaluateHand, findWinners } from './evaluator.js'
import { calculateEquity } from './equity.js'

const pct = (x) => `${x.toFixed(1)}%`
const TRIALS = 50000

console.log(`\n=== Engine sanity checks (${TRIALS} trials) ===\n`)

// 1. AA vs KK
{
  const [aa, kk] = calculateEquity([['As', 'Ah'], ['Ks', 'Kh']], { trials: TRIALS })
  console.log('AA vs KK preflop (expect AA ~80–82%):')
  console.log(`  AA  win ${pct(aa.winPct)}  tie ${pct(aa.tiePct)}  equity ${pct(aa.equityPct)}`)
  console.log(`  KK  win ${pct(kk.winPct)}  tie ${pct(kk.tiePct)}  equity ${pct(kk.equityPct)}`)
}

// 2. AKs vs QQ — classic coin flip
{
  const [ak, qq] = calculateEquity([['As', 'Ks'], ['Qh', 'Qd']], { trials: TRIALS })
  console.log('\nAKs vs QQ preflop (expect ~46–54% each):')
  console.log(`  AKs win ${pct(ak.winPct)}  tie ${pct(ak.tiePct)}  equity ${pct(ak.equityPct)}`)
  console.log(`  QQ  win ${pct(qq.winPct)}  tie ${pct(qq.tiePct)}  equity ${pct(qq.equityPct)}`)
}

// 3. Made flush beats a pair on a fixed board
{
  const board = ['2h', '7h', 'Th', 'Ks', '4d'] // three hearts out
  const flush = evaluateHand(['Ah', 'Qh'], board) // nut-ish flush
  const pair = evaluateHand(['Kd', 'Qc'], board) // pair of kings
  const { winners } = findWinners([['Ah', 'Qh'], ['Kd', 'Qc']], board)
  console.log('\nMade flush vs one pair (board 2h 7h Th Ks 4d):')
  console.log(`  Hand A AhQh -> ${flush.name} (${flush.descr})`)
  console.log(`  Hand B KdQc -> ${pair.name} (${pair.descr})`)
  console.log(`  Winner: player ${winners.join(',')} (expect 0 = the flush)`)
}

console.log('')
