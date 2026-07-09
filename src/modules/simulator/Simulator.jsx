// Local Play Simulator — the interactive table (CLAUDE.md §4, Module 5).
//
// Puts a human in seat 0 against the rule-based bots, driving the existing
// headless engine through its public API (startHand / getLegalActions /
// applyAction / viewState). The human acts via on-screen controls; bots are
// stepped automatically with a short delay between actions so the hand is easy to
// follow, through to showdown and a visible pot award. Records a light
// hands-played / hands-won count to the shared store for the dashboard.
//
// Owns no poker rules of its own — every decision and legality check comes from
// the engine and bots. State machine: 'setup' → 'table' (loop of hands).

import { useEffect, useRef, useState } from 'react'
import { startHand, getLegalActions, applyAction, viewState } from './handEngine.js'
import { resolveBot, BOT_NAMES } from './bots.js'
import { botActionFor, describeAction } from './botDriver.js'
import { recordAttempt, recordSimHand, getSimHands, clearSimHands } from '../../store'
import SimSetup from './SimSetup.jsx'
import SimTable from './SimTable.jsx'
import SimControls from './SimControls.jsx'
import CoachPanel from './CoachPanel.jsx'
import HandHistoryPanel from './HandHistoryPanel.jsx'
import { adviseHero, explainBotAction, recapResult } from './coach.js'
import { beginHand, recordAction, buildRecord, describeHand } from './handHistory.js'
import { evaluateHand } from '../../engine/evaluator.js'

const HERO = 0
const BOT_STEP_MS = 900 // pause between bot actions so the human can follow
const LABEL = { nit: 'Nit', station: 'Station', tag: 'TAG' }

// Board size after each street is dealt → the street's name. Used by step-through
// mode to reveal the board one street at a time and to label the "deal" button.
const STREET_BY_BOARD = { 3: 'flop', 4: 'turn', 5: 'river' }

// Given how many board cards are currently shown and how many the engine has
// actually dealt, return how many to show after the next single "deal" step —
// i.e. the next street boundary (3/4/5), so an all-in runout still reveals the
// flop, turn, and river as separate steps.
function nextRevealLen(shown, dealt) {
  for (const m of [3, 4, 5]) if (m > shown && m <= dealt) return m
  return dealt
}

/**
 * COACH HOOK — the single, cleanly-typed description of *why* the table is paused
 * in step-through mode. A later "coach mode" can read this at each pause to
 * comment on the spot ("the game just paused after action X"); nothing consumes
 * the `kind: 'deal' | 'bot-turn' | 'hero-turn'` field beyond button labels today.
 * Returns null in auto-play (no discrete pauses) and at hand end (the result
 * panel takes over).
 */
function pausePointFor({ stepMode, complete, pendingReveal, toAct, nextStreet, lastActed }) {
  if (!stepMode || complete) return null
  if (pendingReveal) return { kind: 'deal', nextStreet, lastActed }
  if (toAct === HERO) return { kind: 'hero-turn', lastActed }
  return { kind: 'bot-turn', seat: toAct, lastActed }
}

export default function Simulator() {
  const [phase, setPhase] = useState('setup')
  const [cfg, setCfg] = useState(null)
  const [state, setState] = useState(null)
  const [buttonIndex, setButtonIndex] = useState(0)
  const [lastBySeat, setLastBySeat] = useState({}) // seat -> { text, street }
  const [lastActed, setLastActed] = useState(null) // { seat, text, street } most recent action
  const [shownBoardLen, setShownBoardLen] = useState(0) // board cards revealed to the UI (step-through)
  const [seatStacks, setSeatStacks] = useState(null) // carried between hands
  const [session, setSession] = useState({ hands: 0, heroNet: 0 })
  const [history, setHistory] = useState(() => getSimHands()) // finished hand records, newest first

  const botsRef = useRef({ fnBySeat: {}, nameBySeat: {}, archBySeat: {} })
  const handStartRef = useRef(null) // stacks at the start of the current hand
  const recordedRef = useRef(false)
  const timerRef = useRef(null)
  const builderRef = useRef(null) // in-progress hand-history record builder
  const handNoRef = useRef(0) // 1-based hand counter within the session

  const view = state ? viewState(state) : null
  const complete = view?.complete

  // ── Session / hand lifecycle ──────────────────────────────────────────────
  function startSession(config) {
    // Resolve each opponent's archetype (turning 'random' into a concrete one).
    const fnBySeat = {}
    const nameBySeat = {}
    const archBySeat = {} // seat -> bot id ('nit'|'station'|'tag'), for coach reads
    config.archetypes.forEach((arch, i) => {
      const seat = i + 1
      const pick = arch === 'random' ? BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] : arch
      fnBySeat[seat] = resolveBot(pick)
      nameBySeat[seat] = LABEL[pick] ?? pick
      archBySeat[seat] = pick
    })
    botsRef.current = { fnBySeat, nameBySeat, archBySeat }

    const n = config.opponents + 1
    const stacks = Array.from({ length: n }, () => config.stack)
    const btn = 0
    setCfg(config)
    setSeatStacks(stacks)
    setButtonIndex(btn)
    setSession({ hands: 0, heroNet: 0 })
    handNoRef.current = 0
    setPhase('table')
    dealHand(config, stacks, btn)
  }

  function dealHand(config, stacksIn, btn) {
    clearTimeout(timerRef.current)
    // Auto-rebuy any seat that can't post the big blind (keeps a session alive).
    const stacks = stacksIn.map((s) => (s < config.bb ? config.stack : s))
    const hand = startHand({
      players: stacks.map((s) => ({ stack: s })),
      buttonIndex: btn,
      blinds: { sb: config.sb, bb: config.bb },
    })
    handStartRef.current = stacks
    recordedRef.current = false
    // Start a fresh hand-history record from the opening snapshot.
    handNoRef.current += 1
    builderRef.current = beginHand({
      view: viewState(hand),
      blinds: { sb: config.sb, bb: config.bb },
      buttonSeat: btn,
      heroSeat: HERO,
      nameBySeat: botsRef.current.nameBySeat,
      handNo: handNoRef.current,
    })
    setLastBySeat({})
    setLastActed(null)
    setShownBoardLen(0)
    setState(hand)
  }

  function nextHand() {
    const n = cfg.opponents + 1
    const btn = (buttonIndex + 1) % n
    setButtonIndex(btn)
    dealHand(cfg, seatStacks, btn)
  }

  function endSession() {
    clearTimeout(timerRef.current)
    setState(null)
    setPhase('setup')
  }

  // ── Apply an action (hero or bot) + record it in the per-seat feed ─────────
  // In step-through mode we deliberately do NOT bump `shownBoardLen` here even
  // though `applyAction` may have dealt the next street: the board is revealed by
  // a separate `dealNextStreet` step so each event is its own click.
  function commitAction(action, seat) {
    const text = describeAction(action)
    const street = state.street
    const next = applyAction(state, action)
    // Log the action into the hand-history record (street it was taken on).
    if (builderRef.current) {
      recordAction(builderRef.current, { seat, street, type: action.type, amount: action.amount })
    }
    setLastBySeat((m) => ({ ...m, [seat]: { text, street } }))
    setLastActed({ seat, text, street, type: action.type })
    setState(next)
    if (cfg.mode !== 'step') setShownBoardLen(next.board.length)
  }

  function heroAct(action) {
    clearTimeout(timerRef.current)
    commitAction(action, HERO)
  }

  // ── Step-through advance: take the single next bot action ──────────────────
  function stepBot() {
    if (!state || state.complete) return
    const seat = state.toActIndex
    if (seat === HERO) return
    let action
    try {
      action = botActionFor(state, botsRef.current.fnBySeat[seat], cfg.bb)
    } catch (e) {
      console.error('bot decision failed', e)
      return
    }
    commitAction(action, seat)
  }

  // ── Step-through advance: reveal the next dealt street (flop/turn/river) ────
  function dealNextStreet() {
    const dealt = state.board.length
    setShownBoardLen((cur) => nextRevealLen(cur, dealt))
    setLastActed(null) // a fresh street: clear the "just acted" highlight
  }

  // ── Auto-step the bots (auto-play mode only) ───────────────────────────────
  useEffect(() => {
    if (!state || state.complete || cfg?.mode === 'step') return
    const seat = state.toActIndex
    if (seat === HERO) return // wait for the human

    timerRef.current = setTimeout(() => {
      let action
      try {
        action = botActionFor(state, botsRef.current.fnBySeat[seat], cfg.bb)
      } catch (e) {
        console.error('bot decision failed', e)
        return
      }
      commitAction(action, seat)
    }, BOT_STEP_MS)

    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // ── Record a finished hand once (hands played / won + session net) ─────────
  useEffect(() => {
    if (!state || !state.complete || recordedRef.current) return
    recordedRef.current = true
    const v = viewState(state)
    const heroPay = v.payouts.find((p) => p.index === HERO)
    const heroWon = Boolean(heroPay && heroPay.amount > 0)
    recordAttempt('simulator', { correct: heroWon })

    const heroEnd = v.players[HERO].stack
    const heroStart = handStartRef.current[HERO]
    setSession((s) => ({ hands: s.hands + 1, heroNet: s.heroNet + (heroEnd - heroStart) }))
    setSeatStacks(v.players.map((p) => p.stack))

    // Finalize + persist the structured hand-history record (full board revealed).
    if (builderRef.current) {
      try {
        const record = buildRecord({
          builder: builderRef.current,
          view: v,
          board: v.board,
          final: true,
          ts: Date.now(),
        })
        setHistory(recordSimHand(record))
      } catch (e) {
        console.error('hand-history record failed', e) // never break the table
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Clean up any pending timer on unmount.
  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (phase === 'setup' || !view) {
    return <SimSetup onStart={startSession} session={session} />
  }

  // Resolve action bubbles to the current street only (older ones fade out).
  const bubbles = {}
  for (const [seat, e] of Object.entries(lastBySeat)) {
    if (e.street === view.street) bubbles[seat] = e.text
  }

  const heroLegal =
    !complete && view.toAct === HERO ? getLegalActions(state).actions : null

  const labelForSeat = (seat) =>
    seat === HERO ? 'You' : botsRef.current.nameBySeat[seat] ?? `Seat ${seat}`

  // Step-through state: how much of the board to reveal, and whether the next
  // click is a "deal the street" step vs an action step.
  const stepMode = cfg.mode === 'step'
  const visibleBoardLen = stepMode ? shownBoardLen : view.board.length
  const pendingReveal = stepMode && shownBoardLen < view.board.length
  const nextStreet = STREET_BY_BOARD[nextRevealLen(shownBoardLen, view.board.length)]
  const justActed = stepMode && lastActed ? { seat: lastActed.seat, text: lastActed.text } : null
  // The single pause-point descriptor; drives the step panel today and is the
  // surface a future coach mode reads. Null in auto-play and at hand end.
  const pausePoint = pausePointFor({ stepMode, complete, pendingReveal, toAct: view.toAct, nextStreet, lastActed })
  const stepHint = lastActed ? `${labelForSeat(lastActed.seat)} ${lastActed.text.toLowerCase()}` : null

  // ── Coach mode (optional): plain-English guidance at each decision point ─────
  // Hooks off the same signals as the pause points: hero's turn → a suggestion,
  // an opponent's action → a read on it, hand over → a recap. All text comes from
  // ./coach.js, which reuses the range/postflop/board-reader analysis modules.
  const coachOn = Boolean(cfg.coach)
  const coachContent = coachOn ? coachContentFor() : null

  function coachContentFor() {
    try {
      if (complete) {
        return { kind: 'result', ...recapResult({ view, heroSeat: HERO, nameBySeat: botsRef.current.nameBySeat }) }
      }
      if (heroLegal) {
        const hero = view.players[HERO]
        const toCall = Math.max(0, view.currentBet - hero.streetCommitted)
        // The current aggressor (a non-hero seat matching the high bet), used to
        // pick the right BB-defense line preflop.
        const raiser = view.players.find(
          (p) => p.seat !== HERO && p.streetCommitted === view.currentBet && view.currentBet > cfg.bb,
        )
        const advice = adviseHero({
          hole: hero.holeCards,
          board: view.board,
          position: hero.position,
          street: view.street,
          currentBet: view.currentBet,
          bb: cfg.bb,
          pot: view.pot,
          toCall,
          isBB: hero.position === 'BB',
          raiserPos: raiser?.position,
        })
        return { kind: 'advice', ...advice }
      }
      if (lastActed && lastActed.seat !== HERO) {
        const text = explainBotAction(botsRef.current.archBySeat[lastActed.seat], { type: lastActed.type })
        return text ? { kind: 'bot', text } : null
      }
    } catch (e) {
      console.error('coach content failed', e) // never let coaching break the table
    }
    return null
  }

  // ── Hand history (always recording; the panel itself is collapsed by default) ─
  // The current hand is rebuilt live from the same builder, capped to the visible
  // board so step-through isn't spoiled. Past hands come from the persisted store.
  const liveHand =
    builderRef.current && !complete
      ? safeDescribe(builderRef.current, view, view.board.slice(0, visibleBoardLen))
      : null
  const pastHands = history
    .map((r) => {
      try {
        return describeHand(r)
      } catch {
        return null // ignore any record we can't format (e.g. older schema)
      }
    })
    .filter(Boolean)

  function safeDescribe(builder, snapshot, board) {
    try {
      return describeHand(buildRecord({ builder, view: snapshot, board, final: false }))
    } catch (e) {
      console.error('hand-history live view failed', e)
      return null
    }
  }

  function clearHistory() {
    clearSimHands()
    setHistory([])
  }

  return (
    <div className="pt-screen overflow-x-hidden">
      <div className="w-full max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-onfelt-2">
            <span className="rounded bg-gold/90 px-2 py-0.5 text-xs font-bold text-felt-deep">
              PRACTICE
            </span>{' '}
            Blinds {cfg.sb}/{cfg.bb} · {view.street}
          </div>
          <div className="text-sm text-onfelt-2">
            Session: <span className="font-bold">{session.hands}</span> hands · net{' '}
            <span className={session.heroNet >= 0 ? 'text-onfelt-3' : 'text-danger'}>
              {session.heroNet >= 0 ? '+' : ''}
              {session.heroNet}
            </span>
          </div>
        </div>

        <SimTable
          view={view}
          heroSeat={HERO}
          buttonIndex={buttonIndex}
          lastBySeat={bubbles}
          botNames={botsRef.current.nameBySeat}
          visibleBoardLen={visibleBoardLen}
          justActed={justActed}
          stepMode={stepMode}
        />

        <div className="mt-4">
          {coachOn && <CoachPanel content={coachContent} />}
          {pausePoint?.kind === 'deal' ? (
            <StepPanel label={`Deal the ${nextStreet}`} hint={stepHint} onNext={dealNextStreet} onEnd={endSession} />
          ) : pausePoint?.kind === 'bot-turn' ? (
            <StepPanel
              label={`Next — ${labelForSeat(pausePoint.seat)} to act`}
              hint={stepHint}
              onNext={stepBot}
              onEnd={endSession}
            />
          ) : complete ? (
            <ResultPanel
              view={view}
              nameBySeat={botsRef.current.nameBySeat}
              heroDelta={view.players[HERO].stack - (handStartRef.current?.[HERO] ?? 0)}
              onNext={nextHand}
              onEnd={endSession}
            />
          ) : heroLegal ? (
            <SimControls
              legal={heroLegal}
              pot={view.pot}
              currentBet={view.currentBet}
              onAct={heroAct}
            />
          ) : (
            <div className="rounded-2xl bg-panel/50 p-4 text-center text-sm text-onfelt-2">
              Waiting on the bots…
            </div>
          )}
        </div>

        <HandHistoryPanel current={liveHand} past={pastHands} onClear={clearHistory} />
      </div>
    </div>
  )
}

// Step-through pause panel: shows the most recent action and advances exactly one
// event (a single bot action, or dealing the next street) per click.
function StepPanel({ label, hint, onNext, onEnd }) {
  return (
    <div className="rounded-2xl bg-panel/70 p-4 text-center shadow-lg">
      {hint && (
        <div className="mb-2 text-sm text-onfelt-2">
          Last: <span className="font-semibold text-onfelt">{hint}</span>
        </div>
      )}
      <div className="flex justify-center gap-3">
        <button
          onClick={onNext}
          className="rounded-xl bg-info px-6 py-2.5 text-sm font-bold text-onfelt shadow hover:bg-info"
        >
          {label}
        </button>
        <button
          onClick={onEnd}
          className="rounded-xl bg-felt px-5 py-2.5 text-sm font-bold text-onfelt-2 shadow hover:bg-felt-rail"
        >
          End session
        </button>
      </div>
    </div>
  )
}

// Showdown / hand-over panel: who won, why, and what next.
function ResultPanel({ view, nameBySeat, heroDelta, onNext, onEnd }) {
  const contenders = view.players.filter((p) => p.status !== 'folded')
  const showdown = contenders.length > 1 && view.board.length === 5
  const winners = view.payouts.filter((p) => p.amount > 0)

  const line = (pay) => {
    const who = pay.index === HERO ? 'You' : nameBySeat[pay.index] ?? `Seat ${pay.index}`
    const verb = pay.index === HERO ? 'win' : 'wins'
    const p = view.players[pay.index]
    const why =
      showdown && p.status !== 'folded' && p.holeCards.length === 2
        ? ` with ${evaluateHand(p.holeCards, view.board).descr}`
        : ' (uncontested)'
    return `${who} ${verb} ${pay.amount}${why}`
  }

  return (
    <div className="rounded-2xl bg-panel/70 p-4 text-center shadow-lg">
      <div className="mb-2 space-y-0.5">
        {winners.map((w) => (
          <div key={w.index} className="text-base font-bold text-gold-text">
            {line(w)}
          </div>
        ))}
      </div>
      <div className={`mb-3 text-sm font-semibold ${heroDelta >= 0 ? 'text-onfelt-3' : 'text-danger'}`}>
        This hand: {heroDelta >= 0 ? '+' : ''}
        {heroDelta}
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={onNext}
          className="rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-onfelt shadow hover:bg-accent-hover"
        >
          Next hand
        </button>
        <button
          onClick={onEnd}
          className="rounded-xl bg-felt px-6 py-2.5 text-sm font-bold text-onfelt-2 shadow hover:bg-felt-rail"
        >
          End session
        </button>
      </div>
    </div>
  )
}
