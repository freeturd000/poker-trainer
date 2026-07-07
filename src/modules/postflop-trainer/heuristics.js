// Grading heuristics for the Postflop Trainer (CLAUDE.md §4 Module 4).
//
// ⚠️⚠️ HEURISTIC — FLAG FOR REVIEW ⚠️⚠️
// Per the spec, Module 4 is explicitly HEURISTIC-BASED, not solver-perfect: it
// teaches "solid default lines," and the UI labels it as such. Every function
// below is a documented judgment call that Evan should verify. They are pure and
// deterministic so they can be unit-tested against anchor spots
// (see ./postflop-trainer.test.mjs).
//
// The hand-strength BUCKET each of these reasons about is computed once in
// ./handStrength.js; board texture (wet/dry, wetness score) and range advantage
// (favors raiser/caller) are reused from the Board Reader module — this file adds
// no new poker facts, only the decision policy on top of them.

// ---------- pot-odds bridge (reuses the Odds Trainer's math) ----------

// Required (break-even) equity % to call a bet of `f`× the pot. This is the exact
// same identity the Odds Trainer's requiredEquity() encodes — call C to win the
// pot P plus the bet B, your call joining the pot:
//     required = B / (P + B + B).
// With B = f·P that reduces to f / (1 + 2f), independent of the pot size.
export function requiredEquityFromFrac(f) {
  return (100 * f) / (1 + 2 * f)
}

// Rule of 2 & 4 (same shortcut the Odds Trainer teaches): estimated equity of a
// draw with `outs` outs. On the FLOP we credit two cards to come (×4) — i.e. we
// assume hero takes the draw to the river, a reasonable implied-odds proxy for a
// default line; on the TURN one card to come (×2). Capped to stay sane.
export function drawEquity(outs, street) {
  const multiplier = street === 'flop' ? 4 : 2
  return Math.min(outs * multiplier, 95)
}

// Human label for a bet fraction, for the "why" lines. Falls back to a percentage.
export function fracLabel(f) {
  if (Math.abs(f - 1 / 3) < 0.02) return '⅓-pot'
  if (Math.abs(f - 1 / 2) < 0.02) return '½-pot'
  if (Math.abs(f - 2 / 3) < 0.02) return '⅔-pot'
  if (Math.abs(f - 3 / 4) < 0.02) return '¾-pot'
  if (Math.abs(f - 1) < 0.02) return 'pot-sized'
  return `${Math.round(f * 100)}%-pot`
}

// ---------- Drill 1: C-bet decision (hero is the preflop aggressor) ----------
//
// The documented rule, in priority order:
//   • VALUE hand   → always c-bet (build the pot, charge worse hands & draws).
//   • STRONG DRAW  → c-bet as a semi-bluff (win now, or improve to the best hand).
//   • AIR          → c-bet ONLY as a bluff on boards good for the aggressor:
//                    dry AND not caller-favoring. On a wet or caller-favoring
//                    board, bluffing into the range that connects is spew → check.
//   • MARGINAL     → dry board: small c-bet (deny equity, fold out overcards).
//                    wet board: check for pot control.
// This mirrors the Board-Reader premise that dry, high, disconnected flops favor
// the raiser and wet/low/connected flops favor the caller.
/**
 * @param {{bucket:string, wet:boolean, favor:'raiser'|'caller'|'neutral'}} ctx
 * @returns {{action:'cbet'|'check', why:string}}
 */
export function cbetDecision({ bucket, wet, favor }) {
  if (bucket === 'value') {
    return { action: 'cbet', why: 'Value hand — c-bet to build the pot and charge worse hands and draws.' }
  }
  if (bucket === 'draw') {
    return { action: 'cbet', why: 'Strong draw — c-bet as a semi-bluff: you can win it now or improve to the best hand.' }
  }
  if (bucket === 'marginal') {
    return wet
      ? { action: 'check', why: 'Weak made hand on a wet board — check for pot control; betting only bloats the pot against a range that connects here.' }
      : { action: 'cbet', why: 'Weak made hand on a dry board — a small c-bet takes it down often and denies equity to overcards.' }
  }
  // air
  if (!wet && favor !== 'caller') {
    return { action: 'cbet', why: 'No made hand, but a dry board that favors your range — a c-bet bluff folds out most of their holdings.' }
  }
  return { action: 'check', why: 'No made hand on a wet / caller-favoring board — bluffing into the range that hits here spews chips; check and give up.' }
}

// ---------- Drill 2: Facing a bet (hero faces a flop/turn bet) ----------
//
// The documented rule combines hand strength, pot odds, and (for bluff-catchers)
// board texture:
//   • VALUE, two pair+   → RAISE for value.
//   • VALUE, one pair     → CALL (keep the pot controlled; raising folds out worse).
//   • DRAW                → CALL iff Rule-of-2&4 equity ≥ required pot odds, else FOLD.
//   • MARGINAL (weak pair) → bluff-catch small bets only: CALL when the bet is
//                            small (≤ ½ pot dry / ≤ ⅓ pot wet, since wet boards
//                            carry more value bets), otherwise FOLD.
//   • AIR                 → FOLD.
/**
 * @param {{bucket:string, strongValue:boolean, outs:number, betFrac:number,
 *          street:'flop'|'turn', wet:boolean}} ctx
 * @returns {{action:'call'|'raise'|'fold', why:string}}
 */
export function facingDecision({ bucket, strongValue, outs, betFrac, street, wet }) {
  const req = requiredEquityFromFrac(betFrac)
  const size = fracLabel(betFrac)

  if (bucket === 'value') {
    if (strongValue) {
      return { action: 'raise', why: `Two pair or better — raise the ${size} bet for value; you rate to be well ahead.` }
    }
    return { action: 'call', why: `One-pair value — call to control the pot; raising mostly folds out the hands you beat and bloats it against better.` }
  }

  if (bucket === 'draw') {
    const eq = Math.round(drawEquity(outs, street))
    if (eq >= req) {
      return { action: 'call', why: `Draw ≈ ${outs} outs (~${eq}% by the river) vs the ${req.toFixed(0)}% you need against the ${size} bet — priced in, call.` }
    }
    return { action: 'fold', why: `Draw ≈ ${outs} outs (~${eq}%) but you need ${req.toFixed(0)}% against the ${size} bet — not priced in, fold.` }
  }

  if (bucket === 'marginal') {
    const cap = wet ? 1 / 3 : 1 / 2
    if (betFrac <= cap + 0.02) {
      return { action: 'call', why: `Weak pair — bluff-catch the small ${size} bet; at this price you beat enough of their bluffs to call.` }
    }
    return { action: 'fold', why: `Weak pair against a large ${size} bet — too much of their betting range beats you; fold.` }
  }

  return { action: 'fold', why: 'No pair and no strong draw — nothing worth continuing with; fold.' }
}

// ---------- Drill 3: Bet sizing (given that betting is correct) ----------
//
// The documented rule sizes by board DYNAMISM — the wetness score from the Board
// Reader's texture classifier — because that's the dominant default: on static
// boards you bet small (a "range bet": few draws to charge, and small keeps their
// weak hands in), and on dynamic boards you bet big (charge the draws, build the
// pot with value). The same sizing applies whether hero is value-betting or
// semi-bluffing — matching sizes across value and bluffs is what keeps the line
// balanced, so texture alone determines the answer.
//
// wetness = flushScore + straightScore from classifyTexture(). Thresholds:
//     < 2   → ⅓ pot   (dry / static: K-7-2 rainbow)
//   2 – <4  → ½ pot    (semi-connected: K-Q-7)
//   4 – <6  → ¾ pot    (wet / dynamic: 9-8-7 rainbow)
//     ≥ 6   → pot      (very wet: 9-8-7 two-tone, monotone + connected)
export const SIZES = ['1/3', '1/2', '3/4', 'pot']

/**
 * @param {{wetness:number, role?:'value'|'bluff'}} ctx
 * @returns {{size:'1/3'|'1/2'|'3/4'|'pot', why:string}}
 */
export function sizingDecision({ wetness, role = 'value' }) {
  const charge = role === 'value' ? 'charge worse hands and draws' : 'apply maximum pressure'
  if (wetness < 2) {
    return { size: '1/3', why: 'Dry, static board — bet small (a range bet): there are few draws to charge, and a small size keeps their weak hands in.' }
  }
  if (wetness < 4) {
    return { size: '1/2', why: 'Semi-connected board — a medium bet balances value and protection without over-committing.' }
  }
  if (wetness < 6) {
    return { size: '3/4', why: `Wet, dynamic board — bet big to ${charge} and build the pot before the board changes.` }
  }
  return { size: 'pot', why: `Very wet board (flush/straight-heavy) — a large, pot-sized bet ${role === 'value' ? 'charges the many draws and grows the pot' : 'maximizes fold equity against a range full of draws'}.` }
}
