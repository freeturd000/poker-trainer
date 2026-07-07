// Board Reader correctness checks — run after touching the classifier or the
// range heuristic:  npm run test:board
//
// These are the anchor boards the two REVIEWABLE heuristics are tuned against
// (texture wet/dry, and range advantage), plus a couple of exact evaluator spots
// for the "what beats you" drill. A non-zero exit means something regressed.

import { classifyTexture } from './texture.js'
import { favorFlop, isArchetypal } from './rangeInteraction.js'
import { beatingCategories } from './whatBeats.js'

let failed = 0
const eq = (label, got, want) => {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  const ok = g === w
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `\n     got ${g}\n     want ${w}`}`)
}

console.log('\n=== Texture classifier (⚠ reviewable wet/dry heuristic) ===\n')
// Dry: high, disconnected, rainbow.
eq('K♦ 7♠ 2♣ → dry', classifyTexture(['Kd', '7s', '2c']).tags, ['dry'])
eq('A♠ K♦ 4♣ → dry (broadway but uncoordinated)', classifyTexture(['As', 'Kd', '4c']).tags, ['dry'])
// Wet: connected.
eq('9♠ 8♠ 7♦ → wet + two-tone', classifyTexture(['9s', '8s', '7d']).tags, ['wet', 'two-tone'])
eq('7♥ 6♠ 5♦ → wet (rainbow but connected)', classifyTexture(['7h', '6s', '5d']).tags, ['wet'])
// Suit tags.
eq('A♥ 9♥ 4♥ → wet + monotone (flush made)', classifyTexture(['Ah', '9h', '4h']).tags, ['wet', 'monotone'])
eq('K♠ 7♠ 2♦ → dry + two-tone (bare flush draw)', classifyTexture(['Ks', '7s', '2d']).tags, ['dry', 'two-tone'])
// Paired.
eq('8♥ 8♦ 3♣ → dry + paired', classifyTexture(['8h', '8d', '3c']).tags, ['dry', 'paired'])
eq('9♠ 9♦ 8♠ → wet + paired + two-tone', classifyTexture(['9s', '9d', '8s']).tags, ['wet', 'paired', 'two-tone'])
// Ace-low connectivity is recognised.
eq('A♠ 2♦ 3♣ → wet (wheel-connected)', classifyTexture(['As', '2d', '3c']).tags, ['wet'])

console.log('\n=== Range interaction (⚠ reviewable heuristic) ===\n')
eq('A-K-4 rainbow → raiser', favorFlop(['As', 'Kd', '4c']).favor, 'raiser')
eq('K-Q-7 rainbow → raiser', favorFlop(['Ks', 'Qd', '7c']).favor, 'raiser')
eq('7-6-5 rainbow → caller', favorFlop(['7h', '6s', '5d']).favor, 'caller')
eq('9-8-7 rainbow → caller', favorFlop(['9h', '8s', '7d']).favor, 'caller')
eq('K-8-3 rainbow → neutral', favorFlop(['Kh', '8s', '3d']).favor, 'neutral')
// The stricter "safe to serve" gate must agree with the favor for archetypes…
eq('A-K-4 is archetypal raiser', isArchetypal(['As', 'Kd', '4c'], 'raiser', favorFlop(['As', 'Kd', '4c'])), true)
eq('7-6-5 is archetypal caller', isArchetypal(['7h', '6s', '5d'], 'caller', favorFlop(['7h', '6s', '5d'])), true)
// …and must REJECT a board for the wrong bucket.
eq('7-6-5 is NOT an archetypal raiser', isArchetypal(['7h', '6s', '5d'], 'raiser', favorFlop(['7h', '6s', '5d'])), false)

console.log('\n=== What beats you (exact evaluator truth) ===\n')
// Hero has top set of kings on K-9-4 rainbow; only better sets/straights aren't
// possible (no straight/flush on this board), so only a bigger made hand — none
// here beats a set of kings except quads (impossible, both other Ks... actually
// 0 other kings) → nothing. Use a board where the answer is clearly bounded:
{
  // Hero: A♠A♦ on A♣ K♦ Q♠ 2h 3c — top set of aces. Beatable only by a straight
  // (J-T for Broadway) — no flush (rainbow-ish), no bigger set/quads.
  const r = beatingCategories(['As', 'Ad'], ['Ac', 'Kd', 'Qs', '2h', '3c'])
  eq('AAA on A-K-Q-2-3 → only a Straight beats', r.categories, ['Straight'])
}
{
  // Hero: 9♠8♠ flush on a 4-heart... use monotone spades so hero has a flush but a
  // bigger spade flush is possible. Board: A♠ K♠ 2♠ 7d 3c. Hero has K-high... wait
  // hero holds 9♠8♠ → 9-high spade flush; A♠/K♠ are on board, so a villain with any
  // higher spade (Q♠/J♠/T♠) beats them, and A♠K♠ on board means top flushes exist.
  const r = beatingCategories(['9s', '8s'], ['As', 'Ks', '2s', '7d', '3c'])
  // A bigger flush is possible; also a paired board could give a full house? board
  // is unpaired, so no full house / quads. Straight flush needs 5-4-3-2-6 spades —
  // not here. So exactly: Flush.
  eq('9♠8♠ flush on A♠K♠2♠… → only a bigger Flush beats', r.categories, ['Flush'])
}

console.log(`\n${failed === 0 ? 'ALL PASS ✓' : `${failed} FAILED ✗`}\n`)
process.exit(failed === 0 ? 0 : 1)
