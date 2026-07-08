// Rule-based bot opponents for the simulator (CLAUDE.md §4, Module 5).
//
// These are deliberately SIMPLE heuristic archetypes — NOT a solver, NOT learning
// AI. v1's explicit goal is "heuristic bots are plenty for learning mechanics and
// bet sizing." Each bot is a pure decision function:
//
//     decide(legalActions, ctx) -> one action drawn from legalActions
//
// A bot sees only what a real player sees (ctx below) — never opponents' cards —
// and MUST return an action that is present in `legalActions`. Every path here
// ends by selecting from the provided list (or clamping a bet/raise size into the
// action's own [min,max]), so an illegal action can't escape.
//
// REUSE (sanctioned by the task): preflop strength comes from the range-trainer's
// RFI chart (../range-trainer/ranges.js); postflop strength comes from the
// postflop-trainer's analyzer (../postflop-trainer/handStrength.js). We import
// both rather than duplicating that logic.
//
// ── ctx shape (built by playHand.js) ─────────────────────────────────────────
//   hole            two hole cards (canonical strings)
//   board           0/3/4/5 community cards
//   street          'preflop' | 'flop' | 'turn' | 'river'
//   pot             total chips in the pot right now (incl. any bet facing hero)
//   currentBet      highest street commitment to match
//   toCall          chips hero must add to call (0 if hero can check), ≤ stack
//   stack           hero's remaining chips
//   position        seat label ('BTN','SB','BB','UTG','HJ','CO')
//
// ⚠️ JUDGMENT CALLS are flagged inline with ⚠️ — thresholds Evan may want to tune.

import { handToken, getAction } from '../range-trainer/ranges.js'
import { analyzeHand } from '../postflop-trainer/handStrength.js'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
const find = (actions, type) => actions.find((a) => a.type === type)

// Late = has position / closes action; early = acts first. Used to widen or
// tighten the range a bit by seat. BB is grouped "late" (it closes preflop).
const LATE = new Set(['BTN', 'CO', 'SB', 'BB'])
const isLate = (position) => LATE.has(position)

/**
 * Rough preflop strength on a 0–3 ladder, derived purely from the RFI chart:
 *   3 premium     — opens even from UTG (the tightest RFI seat)
 *   2 strong      — opens by CO
 *   1 speculative — opens only from the BTN (widest RFI)
 *   0 junk        — not in any opening range
 * The chart ranges nest (UTG ⊂ CO ⊂ BTN), so checking tightest-first is correct.
 * ⚠️ This is a seat-independent hand-quality proxy; each archetype layers its own
 * positional looseness on top.
 */
function preflopTier(hole) {
  const token = handToken(hole[0], hole[1])
  const opens = (pos) => getAction(pos, token) === 'raise'
  if (opens('UTG')) return 3
  if (opens('CO')) return 2
  if (opens('BTN')) return 1
  return 0
}

/**
 * Postflop strength, wrapping the postflop-trainer analyzer. On the river all
 * draws are dead (no card to come), so a pure draw collapses to air and outs=0.
 * @returns {{ bucket:'value'|'draw'|'marginal'|'air', strongValue:boolean, outs:number }}
 */
function postflopStrength(ctx) {
  const a = analyzeHand(ctx.hole, ctx.board)
  if (ctx.street === 'river') {
    return {
      bucket: a.bucket === 'draw' ? 'air' : a.bucket,
      strongValue: a.strongValue,
      outs: 0,
    }
  }
  return { bucket: a.bucket, strongValue: a.strongValue, outs: a.outs }
}

/** % equity hero needs to profitably call: cost / (pot after calling). */
function potOddsNeededPct(ctx) {
  if (ctx.toCall <= 0) return 0
  return (100 * ctx.toCall) / (ctx.pot + ctx.toCall)
}

/**
 * Rough draw equity via the rule of 2 & 4. One card to come → outs×2. When the
 * call puts hero all-in on the flop, both cards are guaranteed → outs×(2×2).
 * ⚠️ Optimistic when NOT all-in on the flop (we still price a single card), and
 * ignores implied odds — intentionally simple.
 */
function drawEquityPct(outs, ctx) {
  if (outs <= 0 || ctx.street === 'river') return 0
  const cardsToCome = ctx.board.length === 3 ? 2 : 1
  const allIn = ctx.toCall >= ctx.stack
  const mult = allIn ? cardsToCome : 1
  return outs * 2 * mult
}

// --- action builders (always legal: picked from the list / clamped to bounds) ---

const doCheck = (actions) => find(actions, 'check')
const doFold = (actions) => find(actions, 'fold')
const doCall = (actions) => find(actions, 'call')

/** Bet a fraction of the pot, clamped to the legal [min,max] to-amount. */
function betFraction(actions, ctx, fraction) {
  const bet = find(actions, 'bet')
  if (!bet) return null
  return { type: 'bet', amount: clamp(Math.round(ctx.pot * fraction), bet.min, bet.max) }
}

/** Raise toward a target TO-amount, clamped to the legal [min,max]. */
function raiseTo(actions, targetTo) {
  const r = find(actions, 'raise')
  if (!r) return null
  return { type: 'raise', amount: clamp(Math.round(targetTo), r.min, r.max) }
}

/**
 * Resolve an intended action to a guaranteed-legal one. If the intent isn't
 * available, degrade sensibly so a bot never folds a free check and never
 * returns something off the menu.
 */
function ensureLegal(intended, actions, ctx) {
  if (intended && find(actions, intended.type)) return intended
  // Degrade: aggression → call → check → fold.
  if (doCall(actions) && ctx.toCall > 0) return doCall(actions)
  if (doCheck(actions)) return doCheck(actions)
  return doFold(actions)
}

// ---------------------------------------------------------------------------
// Archetype 1 — Tight-passive ("nit")
// Plays few hands, rarely raises, mostly calls/folds, folds weak to bets.
// ---------------------------------------------------------------------------
export function nit(actions, ctx) {
  const intended = ctx.street === 'preflop' ? nitPreflop(actions, ctx) : nitPostflop(actions, ctx)
  return ensureLegal(intended, actions, ctx)
}

function nitPreflop(actions, ctx) {
  const tier = preflopTier(ctx.hole)
  // Premium: the only hand a nit will raise with (rarely raises). Open to ~3x.
  if (tier === 3) return raiseTo(actions, 3 * ctx.currentBet) ?? doCall(actions)
  // Strong: play it, but passively — limp/call a cheap price, fold to real heat.
  if (tier === 2) {
    if (ctx.toCall === 0) return doCheck(actions) ?? doCall(actions)
    // ⚠️ "cheap" = at most a min-raise-ish price relative to the pot.
    return ctx.toCall <= ctx.pot ? doCall(actions) : doFold(actions)
  }
  // Everything else: fold, unless it's free to see a flop from the big blind.
  return doCheck(actions) ?? doFold(actions)
}

function nitPostflop(actions, ctx) {
  const s = postflopStrength(ctx)
  if (ctx.toCall === 0) {
    // Bet only genuine value (two pair+ or strong top pair); otherwise check.
    // Nits under-bluff and rarely raise, so this is the only bet they make.
    if (s.strongValue) return betFraction(actions, ctx, 0.5) ?? doCheck(actions)
    return doCheck(actions)
  }
  // Facing a bet — call value, fold most else; call draws only at a fair price.
  if (s.bucket === 'value') return doCall(actions) // passive: calls, doesn't raise
  if (s.bucket === 'draw') {
    return drawEquityPct(s.outs, ctx) >= potOddsNeededPct(ctx) ? doCall(actions) : doFold(actions)
  }
  // ⚠️ Marginal made hands only continue for a small price.
  if (s.bucket === 'marginal' && ctx.toCall <= ctx.pot * 0.33) return doCall(actions)
  return doFold(actions)
}

// ---------------------------------------------------------------------------
// Archetype 2 — Loose-passive ("calling station")
// Plays many hands, calls too much, rarely folds, rarely raises.
// ---------------------------------------------------------------------------
export function station(actions, ctx) {
  const intended =
    ctx.street === 'preflop' ? stationPreflop(actions, ctx) : stationPostflop(actions, ctx)
  return ensureLegal(intended, actions, ctx)
}

function stationPreflop(actions, ctx) {
  const tier = preflopTier(ctx.hole)
  if (ctx.toCall === 0) return doCheck(actions) ?? doCall(actions) // never opens for a raise
  // Calls with any playable hand at any sane price; even junk if it's cheap.
  // ⚠️ The station's defining leak: too many calls. Cap only to avoid literally
  // stacking off with total trash — junk calls at most a pot-sized price.
  if (tier >= 1) return doCall(actions)
  return ctx.toCall <= ctx.pot ? doCall(actions) : doFold(actions)
}

function stationPostflop(actions, ctx) {
  const s = postflopStrength(ctx)
  if (ctx.toCall === 0) {
    // Rarely the aggressor: bets only obvious value, otherwise checks.
    if (s.strongValue) return betFraction(actions, ctx, 0.5) ?? doCheck(actions)
    return doCheck(actions)
  }
  // Calls almost anything — value, draws, marginal pairs, all at face value.
  if (s.bucket !== 'air') return doCall(actions)
  // Pure air: still calls small, only folds to a big bet. ⚠️ pot-sized cutoff.
  return ctx.toCall <= ctx.pot ? doCall(actions) : doFold(actions)
}

// ---------------------------------------------------------------------------
// Archetype 3 — Tight-aggressive ("TAG")
// Reasonable range, bets/raises strong hands and draws (semi-bluff), folds junk.
// ---------------------------------------------------------------------------
export function tag(actions, ctx) {
  const intended = ctx.street === 'preflop' ? tagPreflop(actions, ctx) : tagPostflop(actions, ctx)
  return ensureLegal(intended, actions, ctx)
}

function tagPreflop(actions, ctx) {
  const tier = preflopTier(ctx.hole)
  const minToPlay = isLate(ctx.position) ? 1 : 2 // wider in position, tighter early
  // The pot is "raised" only once the bet exceeds the big blind — a fresh
  // player's toCall equals currentBet whether or not there's been a raise, so we
  // must compare against the blind, not against toCall.
  const raisedPot = ctx.currentBet > ctx.bigBlind

  if (ctx.toCall === 0) {
    // BB option / limped to us: raise a qualifying hand, else take the free card.
    return tier >= minToPlay
      ? raiseTo(actions, 3 * ctx.currentBet) ?? doCheck(actions)
      : doCheck(actions)
  }
  if (!raisedPot) {
    // Unraised — only the blind is out there: open-raise qualifiers, fold junk.
    return tier >= minToPlay ? raiseTo(actions, 3 * ctx.currentBet) ?? doCall(actions) : doFold(actions)
  }
  // A genuine raise is in front of us: 3-bet premium, flat strong, fold the rest.
  if (tier === 3) return raiseTo(actions, 3 * ctx.currentBet) ?? doCall(actions)
  if (tier >= 2) return doCall(actions)
  return doFold(actions)
}

function tagPostflop(actions, ctx) {
  const s = postflopStrength(ctx)
  if (ctx.toCall === 0) {
    // Bet value for value and draws as semi-bluffs (~2/3 pot); check weak.
    if (s.bucket === 'value' || s.bucket === 'draw') {
      return betFraction(actions, ctx, 0.66) ?? doCheck(actions)
    }
    return doCheck(actions)
  }
  // Facing a bet.
  if (s.bucket === 'value') {
    // Raise the strongest hands for value; just call one-pair-type value.
    if (s.strongValue) return raiseTo(actions, ctx.currentBet + ctx.pot) ?? doCall(actions)
    return doCall(actions)
  }
  if (s.bucket === 'draw') {
    return drawEquityPct(s.outs, ctx) >= potOddsNeededPct(ctx) ? doCall(actions) : doFold(actions)
  }
  // ⚠️ Marginal continues only at a cheap price; air gives up.
  if (s.bucket === 'marginal' && ctx.toCall <= ctx.pot * 0.33) return doCall(actions)
  return doFold(actions)
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** archetype name -> decision function. */
export const BOTS = { nit, station, tag }
export const BOT_NAMES = Object.keys(BOTS)

/** Resolve a bot spec (name string or function) to a decision function. */
export function resolveBot(spec) {
  if (typeof spec === 'function') return spec
  const fn = BOTS[spec]
  if (!fn) throw new Error(`Unknown bot archetype: ${spec}`)
  return fn
}
