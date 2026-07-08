// Structured hand-history records for the simulator (CLAUDE.md §4 Module 5).
//
// Pure logic — no React, no storage, no engine mutation. It CONSUMES the engine's
// read-only viewState snapshots and the shared evaluator, and turns the action
// stream the table already sees into a clean, serializable record of a hand:
// blinds posted, hole cards, actions grouped by street, each street's board cards,
// and the result. The record is what gets persisted (store/simHistory.js) and what
// a future analyzer (Module 8) will read, so its shape is documented below.
//
// Three entry points:
//   beginHand()   — start a record from the opening snapshot (players, blinds).
//   recordAction()— append one applied action (who / street / type / amount).
//   buildRecord() — assemble the finished (or in-progress) record from the current
//                   snapshot, applying the table's reveal rule (bots' cards show
//                   only at a real showdown) and computing results via the evaluator.
//   describeHand()— format a record into plain-English display lines for the panel.
//
// ⚠️ APPROX: none of the POKER facts are approximated — winners, amounts, and hand
// classes come straight from the engine payouts and the exact evaluator. The only
// judgement calls are presentational (how lines are worded and grouped).

import { evaluateHand } from '../../engine/evaluator.js'

export const HISTORY_SCHEMA_VERSION = 1

// Streets in order; the board grows to these sizes as each is dealt.
const STREET_ORDER = ['preflop', 'flop', 'turn', 'river']
const STREET_LABEL = { preflop: 'Preflop', flop: 'Flop', turn: 'Turn', river: 'River' }

// Community cards dealt AT each street (preflop none; flop 3; turn +1; river +1).
function boardForStreet(board, street) {
  switch (street) {
    case 'flop':
      return board.slice(0, 3)
    case 'turn':
      return board.slice(3, 4)
    case 'river':
      return board.slice(4, 5)
    default:
      return [] // preflop
  }
}

/**
 * @typedef {Object} SimHandRecord   // serializable; persisted + analyzer-ready
 * @property {number} schema
 * @property {number|null} ts        // epoch ms when finished (null while in progress)
 * @property {number} handNo         // 1-based within the session
 * @property {{sb:number,bb:number}} blinds
 * @property {number} buttonSeat
 * @property {number} heroSeat
 * @property {SimPlayer[]} players   // seat order
 * @property {SimPost[]} posts       // blinds posted
 * @property {SimStreet[]} streets   // only streets that were reached
 * @property {SimResult|null} result // null while in progress
 *
 * @typedef {Object} SimPlayer  { seat, name, position, isHero, startStack,
 *                                holeCards:string[]|null, handDescr:string|null,
 *                                folded:boolean }
 * @typedef {Object} SimPost    { seat, name, position, kind:'sb'|'bb', amount }
 * @typedef {Object} SimStreet  { street, cards:string[], actions:SimAction[] }
 * @typedef {Object} SimAction  { seat, name, position, isHero, type, amount:number|null }
 * @typedef {Object} SimResult  { board:string[], winners:SimWinner[],
 *                                pots:{amount:number,eligible:number[]}[], heroNet:number }
 * @typedef {Object} SimWinner  { seat, name, amount, hand:string|null, uncontested:boolean }
 */

const nameForSeat = (seat, heroSeat, nameBySeat) =>
  seat === heroSeat ? 'You' : nameBySeat[seat] ?? `Seat ${seat}`

/**
 * Start a record from the opening snapshot (right after startHand).
 * @param {object} p
 * @param {object} p.view       - viewState of the freshly-dealt hand
 * @param {{sb:number,bb:number}} p.blinds
 * @param {number} p.buttonSeat
 * @param {number} p.heroSeat
 * @param {Object<number,string>} p.nameBySeat - seat -> bot display name
 * @param {number} p.handNo
 * @returns {object} a mutable builder (feed to recordAction / buildRecord)
 */
export function beginHand({ view, blinds, buttonSeat, heroSeat, nameBySeat, handNo }) {
  const playersMeta = view.players.map((vp) => ({
    seat: vp.seat,
    name: nameForSeat(vp.seat, heroSeat, nameBySeat),
    position: vp.position,
    isHero: vp.seat === heroSeat,
    startStack: vp.stack,
    hole: vp.holeCards.slice(), // full dealt cards; reveal is applied in buildRecord
  }))

  // Blinds posted = whoever has chips committed on the opening snapshot.
  const posts = view.players
    .filter((vp) => vp.committed > 0)
    .map((vp) => ({
      seat: vp.seat,
      name: nameForSeat(vp.seat, heroSeat, nameBySeat),
      position: vp.position,
      kind: vp.position === 'SB' ? 'sb' : vp.position === 'BB' ? 'bb' : 'blind',
      amount: vp.committed,
    }))

  return { handNo, blinds, buttonSeat, heroSeat, playersMeta, posts, actions: [] }
}

/**
 * Append one applied action to the builder.
 * @param {object} builder
 * @param {{seat:number, street:string, type:string, amount?:number}} a
 */
export function recordAction(builder, { seat, street, type, amount }) {
  builder.actions.push({ seat, street, type, amount: amount ?? null })
}

const contenders = (view) => view.players.filter((p) => p.status !== 'folded')

/**
 * Assemble the record from a snapshot. `final: true` reveals showdown hands and
 * fills the result; `final: false` produces the in-progress view (bots hidden, no
 * result), for the live panel. Pass the board you want reflected — the caller
 * slices it to the visible length while a hand is in progress so step-through
 * isn't spoiled, and passes the full board once the hand is over.
 * @returns {SimHandRecord}
 */
export function buildRecord({ builder, view, board, final = false, ts = null }) {
  const { heroSeat } = builder
  const metaBySeat = Object.fromEntries(builder.playersMeta.map((m) => [m.seat, m]))
  const showdown = final && contenders(view).length > 1 && board.length === 5

  const players = builder.playersMeta.map((m) => {
    const vp = view.players[m.seat]
    const folded = vp.status === 'folded'
    // Reveal rule mirrors the table: hero always; a bot only at a real showdown.
    const revealed = m.isHero || (showdown && !folded)
    const holeCards = revealed ? m.hole.slice() : null
    const handDescr =
      revealed && board.length === 5 && holeCards ? evaluateHand(holeCards, board).descr : null
    return {
      seat: m.seat,
      name: m.name,
      position: m.position,
      isHero: m.isHero,
      startStack: m.startStack,
      holeCards,
      handDescr,
      folded,
    }
  })

  const streets = STREET_ORDER.flatMap((street) => {
    const cards = boardForStreet(board, street)
    const acts = builder.actions
      .filter((a) => a.street === street)
      .map((a) => {
        const m = metaBySeat[a.seat]
        return {
          seat: a.seat,
          name: m?.name ?? `Seat ${a.seat}`,
          position: m?.position ?? '',
          isHero: a.seat === heroSeat,
          type: a.type,
          amount: a.amount,
        }
      })
    // Include a street only once it's been reached (has board cards or actions);
    // preflop always shows (blinds + opening action).
    if (street !== 'preflop' && cards.length === 0 && acts.length === 0) return []
    return [{ street, cards, actions: acts }]
  })

  let result = null
  if (final) {
    const winners = view.payouts
      .filter((p) => p.amount > 0)
      .map((w) => {
        const pl = players.find((p) => p.seat === w.index)
        return {
          seat: w.index,
          name: metaBySeat[w.index]?.name ?? `Seat ${w.index}`,
          amount: w.amount,
          hand: pl?.handDescr ?? null, // set only when the hand was shown at showdown
          uncontested: !showdown,
        }
      })
    result = {
      board: board.slice(),
      winners,
      pots: view.pots.map((p) => ({ amount: p.amount, eligible: p.eligible.slice() })),
      heroNet: view.players[heroSeat].stack - metaBySeat[heroSeat].startStack,
    }
  }

  return {
    schema: HISTORY_SCHEMA_VERSION,
    ts,
    handNo: builder.handNo,
    blinds: builder.blinds,
    buttonSeat: builder.buttonSeat,
    heroSeat,
    players,
    posts: builder.posts,
    streets,
    result,
  }
}

// ── Plain-English formatting for the panel ────────────────────────────────────

// Second-person for the hero ("You … call"), third-person for bots ("TAG calls").
function actionPhrase(type, amount, isHero) {
  const verbs = {
    fold: isHero ? 'fold' : 'folds',
    check: isHero ? 'check' : 'checks',
    call: isHero ? 'call' : 'calls',
    bet: isHero ? 'bet' : 'bets',
    raise: isHero ? 'raise to' : 'raises to',
  }
  const verb = verbs[type] ?? type
  const showAmount = amount != null && type !== 'fold' && type !== 'check'
  return showAmount ? `${verb} ${amount}` : verb
}

const actor = (a) => `${a.name} (${a.position})`

/**
 * Format a record into display-ready pieces. Card arrays are left raw so the panel
 * can render them as coloured tokens; everything else is finished text.
 * @param {SimHandRecord} record
 */
export function describeHand(record) {
  const hero = record.players.find((p) => p.isHero)
  const btn = record.players.find((p) => p.seat === record.buttonSeat)

  const streets = record.streets.map((s) => ({
    label: STREET_LABEL[s.street],
    cards: s.cards,
    line: s.actions.map((a) => `${actor(a)} ${actionPhrase(a.type, a.amount, a.isHero)}`).join(', '),
  }))

  // Non-hero hands shown at showdown (informative for review).
  const reveals = record.players
    .filter((p) => !p.isHero && p.holeCards)
    .map((p) => ({ name: p.name, position: p.position, cards: p.holeCards, hand: p.handDescr }))

  let resultLines = []
  if (record.result) {
    resultLines = record.result.winners.map((w) => {
      const verb = w.seat === record.heroSeat ? 'win' : 'wins'
      const why = w.hand ? ` with ${w.hand}` : w.uncontested ? ' (uncontested)' : ''
      return `${w.name} ${verb} ${w.amount}${why}`
    })
  }

  return {
    handNo: record.handNo,
    ts: record.ts,
    live: !record.result,
    blinds: record.blinds,
    buttonLabel: btn ? `${btn.name} (${btn.position})` : '',
    heroCards: hero?.holeCards ?? null,
    postsLine: record.posts
      .map((p) => `${p.name} (${p.position}) posts ${p.kind.toUpperCase()} ${p.amount}`)
      .join(', '),
    streets,
    reveals,
    resultLines,
    net: record.result ? record.result.heroNet : null,
  }
}
