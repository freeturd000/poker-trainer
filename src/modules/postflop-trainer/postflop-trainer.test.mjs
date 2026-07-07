// Postflop Trainer correctness checks — run after touching the hand-strength
// analyzer or any of the three grading heuristics:  npm run test:postflop
//
// These are the anchor spots the ⚠ REVIEWABLE pieces are tuned against:
//   • analyzeHand()      — the value/draw/marginal/air bucketing
//   • cbetDecision()     — c-bet vs check policy
//   • facingDecision()   — call/raise/fold policy
//   • sizingDecision()   — ⅓/½/¾/pot policy
// It imports ONLY the pure modules (like the Board-Reader test), so it needs no
// browser/localStorage. A non-zero exit means a heuristic regressed.

import { analyzeHand } from './handStrength.js'
import { cbetDecision, facingDecision, sizingDecision, requiredEquityFromFrac, drawEquity } from './heuristics.js'
import { classifyTexture } from '../board-reader/texture.js'

let failed = 0
const eq = (label, got, want) => {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  const ok = g === w
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `\n     got ${g}\n     want ${w}`}`)
}

console.log('\n=== Hand strength (⚠ reviewable bucketing) ===\n')
// Value: strong made hands and good top pairs / overpairs.
eq('AsKd on Ac-7h-2c → value (top pair)', analyzeHand(['As', 'Kd'], ['Ac', '7h', '2c']).bucket, 'value')
eq('QsQd on Jh-7c-2d → value (overpair)', analyzeHand(['Qs', 'Qd'], ['Jh', '7c', '2d']).bucket, 'value')
eq('As7d on Ac-7h-2c → value (two pair)', analyzeHand(['As', '7d'], ['Ac', '7h', '2c']).bucket, 'value')
eq('  …and two pair reports strongValue', analyzeHand(['As', '7d'], ['Ac', '7h', '2c']).strongValue, true)
eq('  …top pair is NOT strongValue', analyzeHand(['As', 'Kd'], ['Ac', '7h', '2c']).strongValue, false)
// Marginal: weak/under pairs.
eq('8s4d on Kh-8c-2d → marginal (middle pair)', analyzeHand(['8s', '4d'], ['Kh', '8c', '2d']).bucket, 'marginal')
eq('9s9d on Kh-7c-2d → marginal (underpair)', analyzeHand(['9s', '9d'], ['Kh', '7c', '2d']).bucket, 'marginal')
// Draw: flush draw and open-ended straight draw.
eq('AsKs on 7s-2s-9d → draw (flush draw)', analyzeHand(['As', 'Ks'], ['7s', '2s', '9d']).bucket, 'draw')
eq('Ts9d on 8c-7h-2s → draw (OESD)', analyzeHand(['Ts', '9d'], ['8c', '7h', '2s']).bucket, 'draw')
eq('  …OESD credits 8 outs', analyzeHand(['Ts', '9d'], ['8c', '7h', '2s']).outs, 8)
eq('  …flush draw credits 9 outs', analyzeHand(['As', 'Ks'], ['7s', '2s', '9d']).outs, 9)
// A weak pair that ALSO has a flush draw buckets as draw (equity drives the line).
eq('4s2s (bottom pair) + FD on Ks-8s-4d → draw', analyzeHand(['4s', '2s'], ['Ks', '8s', '4d']).bucket, 'draw')
// Air: no pair, and a bare gutshot is NOT a strong draw.
eq('As4d on Kh-9c-2s → air', analyzeHand(['As', '4d'], ['Kh', '9c', '2s']).bucket, 'air')
eq('Js8d on 9c-7h-2s → air (gutshot only)', analyzeHand(['Js', '8d'], ['9c', '7h', '2s']).bucket, 'air')
eq('  …gutshot is flagged, not counted as a straight draw', analyzeHand(['Js', '8d'], ['9c', '7h', '2s']).gutshot, true)

console.log('\n=== C-bet decision (⚠ reviewable heuristic) ===\n')
eq('value → c-bet', cbetDecision({ bucket: 'value', wet: true, favor: 'caller' }).action, 'cbet')
eq('draw → c-bet (semi-bluff)', cbetDecision({ bucket: 'draw', wet: true, favor: 'caller' }).action, 'cbet')
eq('air on dry raiser-favoring → c-bet (bluff)', cbetDecision({ bucket: 'air', wet: false, favor: 'raiser' }).action, 'cbet')
eq('air on wet caller-favoring → check', cbetDecision({ bucket: 'air', wet: true, favor: 'caller' }).action, 'check')
eq('air on dry caller-favoring → check', cbetDecision({ bucket: 'air', wet: false, favor: 'caller' }).action, 'check')
eq('marginal on wet → check (pot control)', cbetDecision({ bucket: 'marginal', wet: true, favor: 'neutral' }).action, 'check')
eq('marginal on dry → c-bet (deny equity)', cbetDecision({ bucket: 'marginal', wet: false, favor: 'neutral' }).action, 'cbet')

console.log('\n=== Facing a bet (⚠ reviewable heuristic) ===\n')
eq('two pair+ → raise', facingDecision({ bucket: 'value', strongValue: true, betFrac: 0.5, street: 'flop', wet: false }).action, 'raise')
eq('one-pair value → call', facingDecision({ bucket: 'value', strongValue: false, betFrac: 0.5, street: 'flop', wet: false }).action, 'call')
eq('flush draw (9 outs) flop vs ½-pot → call (priced in)', facingDecision({ bucket: 'draw', outs: 9, betFrac: 0.5, street: 'flop', wet: true }).action, 'call')
eq('OESD (8 outs) turn vs ¾-pot → fold (not priced)', facingDecision({ bucket: 'draw', outs: 8, betFrac: 0.75, street: 'turn', wet: true }).action, 'fold')
eq('weak pair vs ⅓-pot dry → call (bluff-catch)', facingDecision({ bucket: 'marginal', betFrac: 1 / 3, street: 'flop', wet: false }).action, 'call')
eq('weak pair vs pot bet → fold', facingDecision({ bucket: 'marginal', betFrac: 1, street: 'flop', wet: false }).action, 'fold')
eq('weak pair vs ½-pot on WET board → fold (tighter)', facingDecision({ bucket: 'marginal', betFrac: 0.5, street: 'flop', wet: true }).action, 'fold')
eq('weak pair vs ½-pot on DRY board → call', facingDecision({ bucket: 'marginal', betFrac: 0.5, street: 'flop', wet: false }).action, 'call')
eq('air → fold', facingDecision({ bucket: 'air', betFrac: 0.33, street: 'flop', wet: false }).action, 'fold')

console.log('\n=== Pot-odds / equity bridge (matches the Odds Trainer math) ===\n')
eq('required equity vs pot-sized bet ≈ 33.3%', Math.round(requiredEquityFromFrac(1) * 10) / 10, 33.3)
eq('required equity vs ½-pot bet = 25%', requiredEquityFromFrac(0.5), 25)
eq('required equity vs ¾-pot bet = 30%', requiredEquityFromFrac(0.75), 30)
eq('9 outs on the flop ≈ 36% (Rule of 4)', drawEquity(9, 'flop'), 36)
eq('9 outs on the turn ≈ 18% (Rule of 2)', drawEquity(9, 'turn'), 18)

console.log('\n=== Bet sizing (⚠ reviewable heuristic) ===\n')
eq('wetness 0 → ⅓ pot', sizingDecision({ wetness: 0 }).size, '1/3')
eq('wetness 3 → ½ pot', sizingDecision({ wetness: 3 }).size, '1/2')
eq('wetness 5 → ¾ pot', sizingDecision({ wetness: 5 }).size, '3/4')
eq('wetness 6.5 → pot', sizingDecision({ wetness: 6.5 }).size, 'pot')
// Tied to real classified boards (the sizes the drill will actually serve):
eq('K♦7♠2♣ (dry) → ⅓ pot', sizingDecision({ wetness: classifyTexture(['Kd', '7s', '2c']).wetness }).size, '1/3')
eq('K♠Q♥7♣ (semi) → ½ pot', sizingDecision({ wetness: classifyTexture(['Ks', 'Qh', '7c']).wetness }).size, '1/2')
eq('9♥8♠7♦ (wet rainbow) → ¾ pot', sizingDecision({ wetness: classifyTexture(['9h', '8s', '7d']).wetness }).size, '3/4')
eq('9♠8♠7♦ (wet two-tone) → pot', sizingDecision({ wetness: classifyTexture(['9s', '8s', '7d']).wetness }).size, 'pot')

console.log(`\n${failed === 0 ? 'ALL PASS ✓' : `${failed} FAILED ✗`}\n`)
process.exit(failed === 0 ? 0 : 1)
