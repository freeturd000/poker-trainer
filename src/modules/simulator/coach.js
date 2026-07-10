// Coach mode for the Local Play Simulator (CLAUDE.md §4, Module 5).
//
// Turns the table into a guided tutorial for a complete beginner. This file owns
// NO new poker judgment — every DECISION (what action is best, whether a draw is
// priced in, which board favors whom) still comes from the existing analysis
// modules. What this file owns is the TEACHING: it translates those decisions into
// short, plain-English lessons with no undefined jargon, defines any real poker
// term inline on first use (wording sourced from the shared glossary), and — the
// part beginners need most — reads the specific opponent who bet, using the bot's
// archetype, so the advice is about *this* table, not a textbook.
//
//   • Preflop hand strength  → range-trainer RFI chart + BB-defense chart
//                              (../range-trainer/ranges.js) — used for the ACTION only
//   • Postflop hand strength → postflop-trainer analyzer
//                              (../postflop-trainer/handStrength.js)
//   • Postflop decisions      → postflop-trainer heuristics (../postflop-trainer/heuristics.js)
//                               — used for the ACTION; the plain-English "why" is written here
//   • Board texture           → board-reader (../board-reader/*)
//   • Made-hand naming        → /engine evaluator
//   • Term definitions        → shared glossary (../../components/glossary.js)
//
// ⚠️ Nothing here changes the game, the bots' play, the ranges, or the trainers'
// grading. It is a narrator: the human always acts freely; the coach only suggests.

import {
  handToken,
  getAction,
  getBBDefAction,
  BBDEF_POSITIONS,
} from '../range-trainer/ranges.js'
import { analyzeHand } from '../postflop-trainer/handStrength.js'
import {
  cbetDecision,
  facingDecision,
  requiredEquityFromFrac,
  drawEquity,
} from '../postflop-trainer/heuristics.js'
import { classifyTexture } from '../board-reader/texture.js'
import { favorFlop } from '../board-reader/rangeInteraction.js'
import { coachSizing } from './sizing.js'
import { evaluateHand, compareHands } from '../../engine/evaluator.js'
import { GLOSSARY, describeHand as describeToken } from '../../components/glossary.js'

// ── Archetype descriptions ────────────────────────────────────────────────────
// Keyed by the bot id stored per seat ('nit' | 'station' | 'tag'). The one-line
// gloss is sourced from the shared glossary so there is a single source of truth
// (the glossary entry reads "Name — definition"; we keep the definition half).
const glossOf = (id) => ((GLOSSARY[id] ?? '').split(' — ')[1] ?? '').replace(/\.$/, '')
export const ARCHETYPE_INFO = {
  nit: { name: 'Nit', gloss: glossOf('nit') },
  station: { name: 'calling station', gloss: glossOf('station') },
  tag: { name: 'TAG', gloss: glossOf('tag') },
}

// Friendly verb for each recommended action the heuristics/charts can return.
const VERB = {
  raise: 'Raise',
  call: 'Call',
  fold: 'Fold',
  check: 'Check',
  bet: 'Bet',
  cbet: 'Bet',
  '3bet': 'Re-raise',
}

// Plain-English name of a dealt hand token, e.g. "A2o (an Ace and a 2 of
// different suits)". Falls back to the bare token when it can't be described.
function handPhrase(token) {
  const d = describeToken(token) // "72o — a 7 and a 2 of different suits (offsuit)."
  if (!d) return token
  const tail = d.split(' — ')[1]
  if (!tail) return token
  // Drop the trailing "(suited)"/"(offsuit)" tag and period — we already spell the
  // suits out — so the phrase doesn't end in nested parentheses.
  const plain = tail.replace(/\s*\((?:suited|offsuit)\)\.?$/, '').replace(/\.$/, '')
  return `${token} (${plain})`
}

// ── Explaining an opponent's action ───────────────────────────────────────────

function actionClass(type) {
  if (type === 'bet' || type === 'raise') return 'aggro'
  return type // 'call' | 'check' | 'fold'
}

/**
 * A short, beginner-friendly read on what a bot just did, from its archetype.
 * Bots never reveal cards, so this leans only on style + action (never hole cards).
 * @param {'nit'|'station'|'tag'} archId
 * @param {{type:string}} action
 * @returns {string}
 */
export function explainBotAction(archId, action) {
  const info = ARCHETYPE_INFO[archId]
  if (!info) return '' // unknown archetype (shouldn't happen) → say nothing
  const who = `The ${info.name} (${info.gloss})`
  const cls = actionClass(action.type)
  // Use the true verb so a "bet" is never mislabelled a "raise".
  const put = action.type === 'raise' ? 'raised' : 'bet'

  switch (archId) {
    case 'tag':
      if (cls === 'aggro')
        return `${who} ${put}. A tight-aggressive player mostly bets real hands and only rarely bluffs, so this usually means genuine strength — respect it.`
      if (cls === 'call')
        return `${who} just called instead of raising. From a TAG that often means a decent hand they don't love, or a draw — not their very best.`
      if (cls === 'check')
        return `${who} checked (passed without betting). For a TAG that usually means they missed the board or don't want to grow the pot yet.`
      return `${who} folded. Tight players let go easily when they miss — there's nothing more to read into it.`
    case 'nit':
      if (cls === 'aggro')
        return `${who} ${put}. A Nit only plays premium hands, so putting money in is a big red flag that they have a strong hand.`
      if (cls === 'call')
        return `${who} called. Even a call is a strong signal from such a tight player — they don't get involved without a real hand.`
      if (cls === 'check')
        return `${who} checked (passed without betting) — probably a hand they're unsure about. Proceed carefully.`
      return `${who} folded, which is what Nits do most of the time. No information beyond that.`
    case 'station':
      if (cls === 'aggro')
        return `${who} actually ${put} — unusual for a player who mostly just calls. When a calling station finally bets, it's much more likely to be a real hand than a bluff.`
      if (cls === 'call')
        return `${who} just called. Stations call with almost anything, so this tells you very little about their hand.`
      if (cls === 'check')
        return `${who} checked (passed without betting) — they'll call a bet but rarely lead out, so this is normal and tells you little.`
      return `${who} folded — since stations almost never fold, they very likely had nothing at all.`
    default:
      return ''
  }
}

// ── "What just happened" — a one-line recap of opponents' recent action ───────
// Before advising hero, the coach narrates the meaningful thing opponents did
// since hero last acted, in beginner terms and coloured by archetype. It reads
// ONLY the action stream the table already records (the hand-history builder) —
// no cards, no new poker judgement. Returns '' when nothing meaningful happened
// (e.g. hero is first to act), so the caller can simply omit the line.

// Concise, archetype-flavoured read on an opponent betting or raising into hero.
const AGGRO_READ = {
  tag: "they play tight, so that usually means real strength — be cautious.",
  nit: 'a Nit only puts chips in with premium hands, so treat this as a big warning.',
  station: "that's unusual for a player who mostly just calls, so it's more likely a real hand than a bluff.",
}
// Read on an opponent flat-calling hero's bet.
const CALL_READ = {
  station: 'remember, they call with almost anything, so it tells you little about their hand.',
  tag: 'a flat call from a tight player usually means a decent hand, not their strongest.',
  nit: 'even a call from such a tight player points to a real hand.',
}

const numberWord = (n) =>
  ({ 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five' }[n] ?? String(n))

/**
 * A short "what just happened" line for the hero's turn, built from the recorded
 * action stream. Focuses on the most recent street with opponent action since
 * hero last acted, and narrates the single most meaningful thing about it.
 * @param {object} p
 * @param {Array<{seat:number,street:string,type:string}>} p.actions - builder.actions
 * @param {number} p.heroSeat
 * @param {Object<number,string>} p.nameBySeat - seat -> display name ("TAG"/"Station"/…)
 * @param {Object<number,string>} p.archBySeat - seat -> archetype id
 * @returns {string} one sentence, or '' if nothing meaningful happened
 */
export function narrateSinceHero({ actions, heroSeat, nameBySeat, archBySeat }) {
  if (!Array.isArray(actions) || actions.length === 0) return ''

  // Everything opponents did after hero's most recent action.
  let last = -1
  for (let i = actions.length - 1; i >= 0; i--) {
    if (actions[i].seat === heroSeat) {
      last = i
      break
    }
  }
  const heroLast = last >= 0 ? actions[last] : null
  const heroBetLast = heroLast && (heroLast.type === 'bet' || heroLast.type === 'raise')
  const since = actions.slice(last + 1).filter((a) => a.seat !== heroSeat)
  if (since.length === 0) return ''

  // Narrate only the most recent street with action, so a new street doesn't get
  // muddied by earlier calls (e.g. preflop callers before a flop check-around).
  const lastStreet = since[since.length - 1].street
  const cluster = since.filter((a) => a.street === lastStreet)

  const nameOf = (seat) => nameBySeat[seat] ?? `Seat ${seat}`
  const readFor = (map, seat, fallback) => map[archBySeat[seat]] ?? fallback

  // 1) Aggression trumps everything — narrate the most recent bettor/raiser.
  const aggro = [...cluster].reverse().find((a) => a.type === 'bet' || a.type === 'raise')
  if (aggro) {
    const verb = aggro.type === 'raise' ? 'raised' : 'bet'
    const read = readFor(AGGRO_READ, aggro.seat, 'a bet like this shows strength — proceed with care.')
    return `The ${nameOf(aggro.seat)} ${verb} — ${read}`
  }

  const calls = cluster.filter((a) => a.type === 'call')
  const checks = cluster.filter((a) => a.type === 'check')
  const folds = cluster.filter((a) => a.type === 'fold')

  // 2) Opponents called hero's bet (the bet closed the street, now hero's turn again).
  if (calls.length) {
    const alsoFolded = heroBetLast && folds.length ? ` (${numberWord(folds.length).toLowerCase()} folded)` : ''
    if (calls.length === 1) {
      const read = readFor(CALL_READ, calls[0].seat, 'a call keeps them in the pot.')
      return `The ${nameOf(calls[0].seat)} just called${alsoFolded} — ${read}`
    }
    return `${numberWord(calls.length)} players called${alsoFolded} — more opponents left in means you'll want a stronger hand to keep betting.`
  }

  // 3) Nobody bet — it's checked to you.
  if (checks.length) {
    return `Everyone checked to you — nobody's shown strength, so it's often a good spot to bet.`
  }

  // 4) Only folds — your bet thinned or cleared the field.
  if (folds.length) {
    if (heroBetLast)
      return folds.length === 1
        ? `The ${nameOf(folds[0].seat)} folded to your bet — your bet worked, and there's one fewer player to beat.`
        : `${numberWord(folds.length)} players folded to your bet — fewer opponents left to beat.`
    return folds.length === 1
      ? `The ${nameOf(folds[0].seat)} folded — one fewer player to beat.`
      : `${numberWord(folds.length)} players folded — fewer opponents left to beat.`
  }

  return ''
}

// A one-sentence read on the player who bet or raised into hero, plus whether
// this player type almost never bluffs (which makes a weak "call to catch a bluff"
// far less appealing). Sourced from the same archetype knowledge as the bots.
function bettorRead(archId) {
  switch (archId) {
    case 'nit':
      return {
        note: 'The player betting is a Nit — they only put chips in with premium hands, so a bet from them almost always means a big hand.',
        rarelyBluffs: true,
      }
    case 'station':
      return {
        note: "The player betting is normally a calling station — they usually just call and almost never bet without a real hand, so this bet is unusually strong for them.",
        rarelyBluffs: true,
      }
    case 'tag':
      return {
        note: 'The player betting is a TAG (tight and aggressive) — mostly strong hands, but they will occasionally bluff, so respect the bet without fearing every one.',
        rarelyBluffs: false,
      }
    default:
      return { note: '', rarelyBluffs: false }
  }
}

// ── Advising the hero ─────────────────────────────────────────────────────────

// Preflop strength tier from the RFI chart (same ladder the bots use): a hand
// that opens from a tighter seat is stronger. 3 premium … 0 junk.
function preflopTier(token) {
  const opens = (pos) => getAction(pos, token) === 'raise'
  if (opens('UTG')) return 3
  if (opens('CO')) return 2
  if (opens('BTN')) return 1
  return 0
}

// Preflop advice. The ACTION comes from the RFI / BB-defense charts; the wording
// is written here so no chart jargon ("3-bet", "polar", "out of position") leaks.
function advisePreflop({ token, position, facingRaise, isBB, canCheck, raiserPos, opponent }) {
  const hand = handPhrase(token)
  const oppNote = opponent ? ` ${bettorRead(opponent.archId).note}` : ''

  // Big blind, unraised: you've already posted — take the free flop.
  if (isBB && !facingRaise && canCheck) {
    return {
      action: 'Check',
      reason: `You're in the big blind — a bet you were forced to post before the cards. Nobody raised, so you can see the first three shared cards (the "flop") for free. Just check.`,
      approx: false,
    }
  }

  if (!facingRaise) {
    // Open-raise-or-fold, straight from the RFI opening chart.
    const rfi = getAction(position, token) // 'raise' | 'fold'
    return rfi === 'raise'
      ? {
          action: 'Raise',
          reason: `Your two cards, ${hand}, are strong enough to play from your seat (${position}). Come in with a raise — betting first takes the lead and can win the blinds right away.`,
          approx: false,
        }
      : {
          action: 'Fold',
          reason: `${hand} is too weak to play from ${position}. Folding weak hands and waiting for stronger ones is most of what good poker is — let this one go.`,
          approx: false,
        }
  }

  // Facing a raise. The BB-defense chart is the one existing dataset that answers
  // "continue vs a raise?" (call / re-raise / fold), so we reuse it for the ACTION
  // whenever we know the raiser's seat. Exact when hero is the big blind; a
  // reasonable guide otherwise.
  if (raiserPos && BBDEF_POSITIONS.includes(raiserPos)) {
    const act = getBBDefAction(raiserPos, token) // '3bet' | 'call' | 'fold'
    let reason
    if (act === '3bet')
      reason = `${hand} is strong enough to re-raise — that is, raise on top of their raise (poker players call this a "3-bet"). Put in the re-raise for value.${oppNote}`
    else if (act === 'call')
      reason = `${hand} is good enough to call and see the flop, but not strong enough to re-raise. Just call.${oppNote}`
    else
      reason = `${hand} isn't strong enough to keep going against a raise — fold and wait for a better hand.${oppNote}`
    return { action: VERB[act] ?? VERB.fold, reason, approx: !isBB }
  }

  // Fallback when the raiser's seat is unknown (e.g. a limped pot that got raised).
  const tier = preflopTier(token)
  if (tier >= 2)
    return {
      action: 'Call',
      reason: `${hand} is a strong hand — good enough to continue against a raise, usually by calling. Save re-raising for your very best holdings.${oppNote}`,
      approx: true,
    }
  return {
    action: 'Fold',
    reason: `${hand} is too weak to keep going against a raise — save your chips for a better spot.${oppNote}`,
    approx: true,
  }
}

// Describe hero's draw in plain words, for reasons that mention it.
function drawPhrase(a) {
  if (a.flushDraw && a.straightDraw)
    return 'a flush draw and a straight draw (two ways to make a big hand)'
  if (a.flushDraw) return 'a flush draw — four cards toward a flush, needing one more of that suit'
  if (a.straightDraw)
    return 'an open-ended straight draw — four in a row, so a card on either end makes the straight'
  return 'a draw'
}

// River made-hand tier from the exact evaluator (no draws left on the river).
function riverTier(rank) {
  if (rank >= 3) return 'strong' // two pair or better
  if (rank === 2) return 'pair'
  return 'weak'
}

// River: all five cards are out, so there are no draws — it comes down to your
// made hand and, when facing a bet, who is doing the betting.
function adviseRiver({ hole, board, facingBet, toCall, pot, opponent }) {
  const made = evaluateHand(hole, board)
  const tier = riverTier(made.rank)
  const descr = made.descr
  const read = opponent ? bettorRead(opponent.archId) : null

  if (facingBet) {
    const betFrac = toCall / Math.max(1, pot - toCall)
    const big = betFrac > 0.55
    if (tier === 'strong')
      return {
        action: 'Raise',
        reason: `You have ${descr} — a strong hand, and this is the last card, so nothing can beat you by improving. Raise, or at least call, to get paid.`,
        sizing: coachSizing(board, 'value'),
        approx: true,
      }
    if (tier === 'pair') {
      // The classic bluff-catch spot — and exactly where the opponent matters.
      if (read?.rarelyBluffs)
        return {
          action: 'Fold',
          reason: `You have just one pair (${descr}). It can only beat a bluff now. ${read.note} With almost no bluffs to catch, calling loses more often than it wins. Fold.`,
          approx: true,
        }
      if (big)
        return {
          action: 'Fold',
          reason: `You have one pair (${descr}). Against a bet this big it can really only beat a bluff, and most hands betting this much have you beaten. Lean fold.`,
          approx: true,
        }
      return {
        action: 'Call',
        reason: `You have one pair (${descr}) — too weak to raise, but it can still beat a bluff, so you call to catch one (this is called "bluff-catching"). The bet is small, so the price is right; don't pay off a big one.${read ? ` ${read.note}` : ''}`,
        approx: true,
      }
    }
    return {
      action: 'Fold',
      reason: `You have only ${descr} and there are no more cards to come, so nothing can improve. Fold.`,
      approx: true,
    }
  }

  if (tier === 'strong')
    return { action: 'Bet', reason: `You have ${descr} — a strong hand. Bet the river so weaker hands pay you off (betting a strong hand to get called is called betting "for value").`, sizing: coachSizing(board, 'value'), approx: true }
  if (tier === 'pair')
    return { action: 'Check', reason: `One pair (${descr}) on the river is usually a check, not a bet: worse hands fold and only better hands call, so betting tends to lose money. Check and hope to win at showdown.`, approx: true }
  return { action: 'Check', reason: `You have only ${descr}. Check and give up the pot — there's no hand worth betting here.`, approx: true }
}

// Flop or turn: reuse the postflop heuristics for the ACTION; write the lesson.
function advisePostflop({ hole, board, facingBet, toCall, pot, opponent, checkedToHero }) {
  if (board.length >= 5) return adviseRiver({ hole, board, facingBet, toCall, pot, opponent })

  const flop = board.slice(0, 3)
  const tex = classifyTexture(flop) // wet/dry (board-reader)
  const a = analyzeHand(hole, board) // value/draw/marginal/air bucket (postflop-trainer)
  const street = board.length === 3 ? 'flop' : 'turn'
  const made = a.madeDescr

  if (facingBet) {
    // betFrac = bet ÷ pot-before-your-call (view.pot already includes the bet).
    const betFrac = toCall / Math.max(1, pot - toCall)
    const req = Math.round(requiredEquityFromFrac(betFrac))
    const dec = facingDecision({
      bucket: a.bucket,
      strongValue: a.strongValue,
      outs: a.outs,
      betFrac,
      street,
      wet: tex.wet,
    })
    const read = opponent ? bettorRead(opponent.archId) : null

    if (a.bucket === 'value') {
      if (a.strongValue) {
        const caution = read?.rarelyBluffs && opponent?.archId === 'nit'
          ? ` One caution: a Nit betting big can hold an even bigger hand, so if they raise you back, believe them.`
          : ''
        return { action: 'Raise', reason: `You have ${made} — a big hand (two pairs or better). Raise to build the pot while you're ahead.${caution}`, sizing: coachSizing(board, 'value'), approx: false }
      }
      return { action: 'Call', reason: `You have a solid one pair (${made}). It's good enough to call with, but raising would mostly scare off the weaker hands you beat — so just call and keep the pot under control.`, approx: false }
    }

    if (a.bucket === 'draw') {
      const eq = Math.round(drawEquity(a.outs, street))
      if (dec.action === 'call')
        return {
          action: 'Call',
          reason: `You don't have a made hand yet, but you have ${drawPhrase(a)}. About ${eq} times in 100 you'll complete it by the river — more than the roughly ${req}% you'd need to make calling worthwhile, so the price is right. Call.${read && opponent?.archId === 'station' ? ' And if you hit, this caller will likely pay you off.' : ''}`,
          approx: false,
        }
      return {
        action: 'Fold',
        reason: `You have ${drawPhrase(a)}, but you'll only complete it about ${eq} times in 100 — less than the roughly ${req}% this bet asks you to pay. Not worth it. Fold.`,
        approx: false,
      }
    }

    if (a.bucket === 'marginal') {
      // Weak pair facing a bet — the bluff-catch spot where the opponent decides it.
      if (read?.rarelyBluffs)
        return {
          action: 'Fold',
          reason: `You have a weak pair (${made}). Normally you might call to catch a bluff (called "bluff-catching"). ${read.note} There aren't enough bluffs here to make calling pay — folding is the safer play.`,
          approx: false,
        }
      if (dec.action === 'call')
        return {
          action: 'Call',
          reason: `You have a weak pair (${made}) — too weak to raise, but it can beat a bluff, so you call to catch one (called "bluff-catching"). The bet is small, so calling once is fine; don't pay off a big one.${read ? ` ${read.note}` : ''}`,
          approx: false,
        }
      return {
        action: 'Fold',
        reason: `You have a weak pair (${made}) and the bet is big. A bet this size is usually a real hand, and your pair is too thin to call it off. Fold.${read ? ` ${read.note}` : ''}`,
        approx: false,
      }
    }

    // air
    return { action: 'Fold', reason: `You have no pair and no draw — nothing to continue with. Fold and save your chips.`, approx: false }
  }

  // No bet facing hero: bet or check? Reuse the c-bet policy for the ACTION.
  const fav = favorFlop(flop)
  const dec = cbetDecision({ bucket: a.bucket, wet: tex.wet, favor: fav.favor })
  // When it's checked around to hero, name what that means before the advice.
  const lead =
    checkedToHero && dec.action === 'cbet'
      ? `It's checked to you — usually a sign nobody has much. `
      : ''

  if (a.bucket === 'value')
    return { action: 'Bet', reason: `${lead}You have ${made} — a strong hand. Bet it to build the pot and get paid by weaker hands (betting a strong hand for chips is called betting "for value").`, sizing: coachSizing(board, 'value'), approx: true }
  if (a.bucket === 'draw')
    return { action: 'Bet', reason: `${lead}You have ${drawPhrase(a)}. Betting can win the pot right now, and if you get called you still might complete your draw — a bet that can win two ways like this is called a "semi-bluff".`, sizing: coachSizing(board, 'bluff'), approx: true }
  if (a.bucket === 'marginal')
    return tex.wet
      ? { action: 'Check', reason: `You have a weak pair (${made}) on a "wet" board — one where lots of straights and flushes are possible. Betting would only build a big pot against the hands that beat you. Check and try to reach showdown cheaply.`, approx: true }
      : { action: 'Bet', reason: `${lead}You have a weak pair (${made}) on a "dry" board — few draws are out there. A bet often wins it right now and pushes out hands with two high cards that could otherwise catch up.`, sizing: coachSizing(board, 'value'), approx: true }
  // air
  return fav.favor !== 'caller' && !tex.wet
    ? { action: 'Bet', reason: `${lead}You have nothing yet, but this board is unlikely to have helped anyone. A bet often takes it down — a well-timed bluff on a board that's good for it.`, sizing: coachSizing(board, 'bluff'), approx: true }
    : { action: 'Check', reason: `You have nothing, and this board likely helped the other players more than you. Don't bluff into it — check and give up the pot.`, approx: true }
}

/**
 * The coach's suggestion for the hero's current decision.
 * @param {object} p
 * @param {{archId:string}} [p.opponent] - the player whose bet/raise hero faces
 * @param {boolean} [p.checkedToHero] - postflop, no bet, and it checked to hero
 * @returns {{action:string, reason:string, approx:boolean}}
 */
export function adviseHero({ hole, board, position, street, currentBet, bb, pot, toCall, isBB, raiserPos, opponent, checkedToHero }) {
  if (street === 'preflop') {
    const token = handToken(hole[0], hole[1])
    const facingRaise = currentBet > bb // someone put in more than the big blind
    return advisePreflop({ token, position, facingRaise, isBB, canCheck: toCall === 0, raiserPos, opponent })
  }
  return advisePostflop({ hole, board, facingBet: toCall > 0, toCall, pot, opponent, checkedToHero })
}

// ── Explaining the result ─────────────────────────────────────────────────────

// Beginner-friendly restatements of the evaluator's own result. These reformat the
// strings the /engine evaluator returns — they add NO new hand judgement (the rank,
// category, and winner all come straight from evaluateHand / compareHands).
const RANK_HIGH = { A: 'ace', K: 'king', Q: 'queen', J: 'jack', T: 'ten', 9: 'nine', 8: 'eight', 7: 'seven', 6: 'six', 5: 'five', 4: 'four', 3: 'three', 2: 'two' }
const RANK_PLURAL = { A: 'aces', K: 'kings', Q: 'queens', J: 'jacks', T: 'tens', 9: 'nines', 8: 'eights', 7: 'sevens', 6: 'sixes', 5: 'fives', 4: 'fours', 3: 'threes', 2: 'twos' }
const highWord = (r) => RANK_HIGH[r] ?? String(r)
const pluralWord = (r) => RANK_PLURAL[r] ?? `${r}s`

// Plain-English hand-type phrase for a hand-ranking comparison, keyed by the
// evaluator's `name` (its rank category). Used to say WHY one type beats another.
const CAT_PHRASE = {
  'High Card': 'a no-pair (high-card) hand',
  Pair: 'a pair',
  'Two Pair': 'two pair',
  'Three of a Kind': 'three of a kind',
  Straight: 'a straight',
  Flush: 'a flush',
  'Full House': 'a full house',
  'Four of a Kind': 'four of a kind',
  'Straight Flush': 'a straight flush',
}

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const listNames = (names) =>
  names.length <= 1
    ? names[0] ?? ''
    : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`

/**
 * Translate one evaluated hand into a short, plain phrase a beginner can read,
 * e.g. "a pair of sixes", "two pair, aces and kings", "king-high". Built ONLY from
 * the evaluator's own `name` (category) and `descr` (ranks); no re-evaluation.
 * @param {import('../../engine/evaluator.js').HandResult} res
 * @returns {string}
 */
function plainMadeHand(res) {
  const d = res.descr || ''
  if (d === 'Royal Flush') return 'a royal flush — the best possible hand'
  const one = (d.match(/,\s*([2-9TJQKA])/) || [])[1] // first named rank in the descr
  switch (res.name) {
    case 'Straight Flush':
      return `a straight flush, ${highWord(one)}-high`
    case 'Four of a Kind':
      return `four of a kind, ${pluralWord(one)}`
    case 'Full House': {
      const m = d.match(/,\s*([2-9TJQKA])'s over ([2-9TJQKA])'s/) || []
      return `a full house, ${pluralWord(m[1])} full of ${pluralWord(m[2])}`
    }
    case 'Flush':
      return `a flush, ${highWord(one)}-high`
    case 'Straight':
      return `a straight, ${highWord(one)}-high`
    case 'Three of a Kind':
      return `three of a kind, ${pluralWord(one)}`
    case 'Two Pair': {
      const m = d.match(/,\s*([2-9TJQKA])'s\s*&\s*([2-9TJQKA])'s/) || []
      return `two pair, ${pluralWord(m[1])} and ${pluralWord(m[2])}`
    }
    case 'Pair':
      return `a pair of ${pluralWord(one)}`
    case 'High Card': {
      const h = (d.match(/^([2-9TJQKA])/) || [])[1]
      return `${highWord(h)}-high (no pair)`
    }
    default:
      return d.toLowerCase()
  }
}

// One plain sentence on WHY the winning hand beats the best losing hand — always
// grounded in poker's fixed hand-ranking order (higher type wins; same type →
// higher cards win). `win`/`lose` are evaluator results.
function beatReason(win, lose) {
  if (win.rank !== lose.rank)
    return `${CAT_PHRASE[win.name] ?? 'the higher hand'} always ranks above ${CAT_PHRASE[lose.name] ?? 'the lower hand'} in poker's hand-ranking order.`
  return `when two hands are the same type, the higher cards (the "kicker") decide it.`
}

// The verdict line for a showdown: names the winner's hand, the best beaten hand,
// and the ranking rule that separates them. Handles split pots and full chops.
// `rows` is sorted best → worst; each row carries its evaluator result in `res`.
function showdownVerdict(rows) {
  const top = rows[0]
  const tiedTop = rows.filter((r) => compareHands(top.res, r.res) === 0)
  const loser = rows.find((r) => compareHands(top.res, r.res) === 1)
  const topMade = plainMadeHand(top.res)
  if (!loser) {
    return `Every hand here ties exactly (${topMade}), so the players split the pot evenly.`
  }
  const loseMade = plainMadeHand(loser.res)
  const because = beatReason(top.res, loser.res)
  if (tiedTop.length > 1) {
    return `${listNames(tiedTop.map((r) => r.name))} tie with ${topMade} and split the pot — and that beats ${loseMade} because ${because}`
  }
  return `${cap(topMade)} beats ${loseMade} because ${because}`
}

/**
 * A plain-English recap at showdown: who won with what, a full ranked breakdown of
 * every hand shown (best → worst, for wins AND losses) with a one-line "why", plus
 * a general teaching takeaway from the outcome.
 * @returns {{ summary:string, lesson:string, showdown?:{rows:Array, verdict:string} }}
 */
export function recapResult({ view, heroSeat, nameBySeat }) {
  const nameOf = (i) => (i === heroSeat ? 'You' : nameBySeat[i] ?? `Seat ${i}`)
  const winners = view.payouts.filter((p) => p.amount > 0)
  const contenders = view.players.filter((p) => p.status !== 'folded')
  const showdown = contenders.length > 1 && view.board.length === 5
  const hero = view.players[heroSeat]
  const heroFolded = hero.status === 'folded'
  const heroWon = winners.some((w) => w.index === heroSeat)

  // Every hand that reached showdown, evaluated once by the shared engine, sorted
  // best → worst so the beginner sees the hierarchy for this exact board.
  let rows = []
  if (showdown) {
    view.players.forEach((p, i) => {
      if (p.status === 'folded' || !p.holeCards || p.holeCards.length !== 2) return
      rows.push({
        name: nameOf(i),
        isHero: i === heroSeat,
        isWinner: winners.some((w) => w.index === i),
        hole: p.holeCards,
        res: evaluateHand(p.holeCards, view.board),
      })
    })
    // Stronger hand first (compareHands returns 1 when its first arg wins).
    rows.sort((a, b) => compareHands(b.res, a.res))
  }

  // Who won, with what — in beginner terms drawn from the evaluator's own result.
  const summary = winners
    .map((w) => {
      const p = view.players[w.index]
      const verb = w.index === heroSeat ? 'win' : 'wins'
      const why =
        showdown && p.status !== 'folded' && p.holeCards.length === 2
          ? ` with ${plainMadeHand(evaluateHand(p.holeCards, view.board))}`
          : ' — everyone else folded'
      return `${nameOf(w.index)} ${verb} ${w.amount}${why}.`
    })
    .join(' ')

  // One line on the key decision — a general teaching takeaway from the outcome.
  let lesson
  if (heroFolded) {
    lesson = `Lesson: you folded. Letting go when you're likely behind is exactly how you save chips for stronger spots — folds like this are wins, not losses.`
  } else if (heroWon && showdown) {
    lesson = `Lesson: you stayed in with the winning hand at showdown (the end, where cards are turned face-up and the best hand takes the pot). That's the payoff for playing solid holdings.`
  } else if (heroWon) {
    lesson = `Lesson: everyone folded to you, so you won without showing your cards. Winning a pot uncontested like this is a clean result — your betting got them to give up.`
  } else if (showdown) {
    lesson = `Lesson: you saw it through to showdown but were beaten. Losses like this are worth studying — the breakdown above shows exactly which hand topped yours and why. Betting less on the earlier rounds is what keeps a beat like this small.`
  } else {
    lesson = `Lesson: the hand ended without a showdown. Next time, notice which round the big money went in — that's usually where the hand was really won or lost.`
  }

  const result = { summary, lesson }
  if (showdown && rows.length > 1) {
    result.showdown = {
      rows: rows.map((r) => ({
        name: r.name,
        isHero: r.isHero,
        isWinner: r.isWinner,
        hole: r.hole,
        made: plainMadeHand(r.res),
      })),
      verdict: showdownVerdict(rows),
    }
  }
  return result
}
