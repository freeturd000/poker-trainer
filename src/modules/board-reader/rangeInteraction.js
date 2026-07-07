// Range-interaction heuristic for Module 3 (CLAUDE.md §4 Module 3).
//
// ⚠️⚠️ HEURISTIC — FLAG FOR REVIEW ⚠️⚠️
// This is the second judgment-based piece Evan needs to verify. It answers, for a
// single canonical spot (a preflop RAISER in position vs a BB CALLER), which
// player's range a flop favors. It is deliberately SIMPLE and only ever gets served
// on clear-cut boards (see the generator's acceptance filter) — it is not trying to
// be a solver.
//
// ── The heuristic ────────────────────────────────────────────────────────────
// The preflop raiser's range is stronger at the top (AK, AQ, AA, KK, QQ …). The BB
// caller's range is wider and more capped: suited connectors, suited gappers, and
// small pairs that were priced in. So:
//
//   • HIGH, BROADWAY, DISCONNECTED flops favor the RAISER — they connect with the
//     big cards and overpairs the raiser holds far more often (A-K-4, K-Q-7).
//   • LOW, CONNECTED flops favor the CALLER — suited connectors and small pairs
//     smash them into two pair / sets / straights the raiser rarely has (7-6-5,
//     9-8-7).
//   • Everything else is NEUTRAL — no meaningful edge either way.
//
// Scoring (higher = more raiser-favoring):
//   raiserScore = (# broadway cards T-A) + (top card is A or K ? 1 : 0)
//   callerScore = (# cards ≤ 8) + (board is connected [straightScore ≥ 3] ? 2 : 0)
//   diff = raiserScore − callerScore
//     diff ≥ +2 → raiser ,  diff ≤ −2 → caller ,  else → neutral
//
// The drill only SERVES archetypal boards (raiser boards have ≥2 broadway cards,
// caller boards have 0 broadway and a made-straight texture, neutral boards sit
// dead-centre), so the served spots are unambiguous even though the raw heuristic
// has fuzzy edges — those edges just never get shown.

import { RANKS } from '../../engine/card.js'
import { straightScore } from './texture.js'

const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]))
const BROADWAY = new Set(['T', 'J', 'Q', 'K', 'A'])

// The preflop framings we show. All share the same logic: an in-position preflop
// aggressor against a BB flat-caller. Only the wording changes for variety.
export const SCENARIOS = [
  { raiser: 'BTN', caller: 'BB', text: 'BTN raised, BB called.' },
  { raiser: 'CO', caller: 'BB', text: 'CO raised, BB called.' },
  { raiser: 'UTG', caller: 'BB', text: 'UTG raised, BB called.' },
]

/**
 * Which player's range this flop favors.
 * @param {string[]} flop - three canonical card strings
 * @returns {{
 *   favor: 'raiser'|'caller'|'neutral',
 *   diff: number, raiserScore: number, callerScore: number,
 *   broadway: number, low: number, connected: boolean, why: string,
 * }}
 */
export function favorFlop(flop) {
  const ranks = flop.map((c) => c[0])
  const distinct = [...new Set(ranks)]

  const broadway = ranks.filter((r) => BROADWAY.has(r)).length
  const topValue = Math.max(...ranks.map((r) => RANK_VALUE[r]))
  const topIsAK = topValue >= RANK_VALUE['K'] // K or A
  const low = ranks.filter((r) => RANK_VALUE[r] <= 8).length
  const connected = straightScore(distinct) >= 3

  const raiserScore = broadway + (topIsAK ? 1 : 0)
  const callerScore = low + (connected ? 2 : 0)
  const diff = raiserScore - callerScore

  let favor = 'neutral'
  if (diff >= 2) favor = 'raiser'
  else if (diff <= -2) favor = 'caller'

  const why =
    favor === 'raiser'
      ? 'High, broadway-heavy and disconnected — hits the raiser’s AK/AQ/big-pair range far more than the caller’s.'
      : favor === 'caller'
        ? 'Low and connected — smashes the caller’s suited connectors and small pairs into sets/two-pair/straights the raiser rarely has.'
        : 'No strong range advantage either way — both ranges interact with it similarly.'

  return { favor, diff, raiserScore, callerScore, broadway, low, connected, why }
}

/**
 * Is this a clear-cut, archetypal example of `target` favor — safe to serve in the
 * drill? Stricter than favorFlop so we never quiz an ambiguous board.
 * @param {string[]} flop
 * @param {'raiser'|'caller'|'neutral'} target
 * @param {{favor:string,diff:number,broadway:number}} f - favorFlop(flop) result
 */
export function isArchetypal(flop, target, f) {
  if (f.favor !== target) return false
  const topValue = Math.max(...flop.map((c) => RANK_VALUE[c[0]]))
  switch (target) {
    // Two big cards, decisively raiser-favoring (A-K-x, K-Q-x, A-Q-x …).
    case 'raiser':
      return f.broadway >= 2 && f.diff >= 2
    // No broadway at all, single-digit top, decisively caller-favoring (7-6-5 …).
    case 'caller':
      return f.broadway === 0 && topValue <= RANK_VALUE['9'] && f.diff <= -2
    // Sits dead-centre — genuinely no lean.
    case 'neutral':
      return f.diff === 0
    default:
      return false
  }
}
