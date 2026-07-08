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
import { recordAttempt } from '../../store'
import SimSetup from './SimSetup.jsx'
import SimTable from './SimTable.jsx'
import SimControls from './SimControls.jsx'
import { evaluateHand } from '../../engine/evaluator.js'

const HERO = 0
const BOT_STEP_MS = 900 // pause between bot actions so the human can follow
const LABEL = { nit: 'Nit', station: 'Station', tag: 'TAG' }

export default function Simulator() {
  const [phase, setPhase] = useState('setup')
  const [cfg, setCfg] = useState(null)
  const [state, setState] = useState(null)
  const [buttonIndex, setButtonIndex] = useState(0)
  const [lastBySeat, setLastBySeat] = useState({}) // seat -> { text, street }
  const [seatStacks, setSeatStacks] = useState(null) // carried between hands
  const [session, setSession] = useState({ hands: 0, heroNet: 0 })

  const botsRef = useRef({ fnBySeat: {}, nameBySeat: {} })
  const handStartRef = useRef(null) // stacks at the start of the current hand
  const recordedRef = useRef(false)
  const timerRef = useRef(null)

  const view = state ? viewState(state) : null
  const complete = view?.complete

  // ── Session / hand lifecycle ──────────────────────────────────────────────
  function startSession(config) {
    // Resolve each opponent's archetype (turning 'random' into a concrete one).
    const fnBySeat = {}
    const nameBySeat = {}
    config.archetypes.forEach((arch, i) => {
      const seat = i + 1
      const pick = arch === 'random' ? BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] : arch
      fnBySeat[seat] = resolveBot(pick)
      nameBySeat[seat] = LABEL[pick] ?? pick
    })
    botsRef.current = { fnBySeat, nameBySeat }

    const n = config.opponents + 1
    const stacks = Array.from({ length: n }, () => config.stack)
    const btn = 0
    setCfg(config)
    setSeatStacks(stacks)
    setButtonIndex(btn)
    setSession({ hands: 0, heroNet: 0 })
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
    setLastBySeat({})
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
  function commitAction(action, seat) {
    setLastBySeat((m) => ({ ...m, [seat]: { text: describeAction(action), street: state.street } }))
    setState((s) => applyAction(s, action))
  }

  function heroAct(action) {
    clearTimeout(timerRef.current)
    commitAction(action, HERO)
  }

  // ── Auto-step the bots ────────────────────────────────────────────────────
  useEffect(() => {
    if (!state || state.complete) return
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

  return (
    <div className="flex min-h-screen flex-col items-center bg-emerald-800 p-4">
      <div className="w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-emerald-200">
            <span className="rounded bg-amber-400/90 px-2 py-0.5 text-xs font-bold text-emerald-950">
              PRACTICE
            </span>{' '}
            Blinds {cfg.sb}/{cfg.bb} · {view.street}
          </div>
          <div className="text-sm text-emerald-100">
            Session: <span className="font-bold">{session.hands}</span> hands · net{' '}
            <span className={session.heroNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
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
        />

        <div className="mt-4">
          {complete ? (
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
            <div className="rounded-2xl bg-emerald-950/50 p-4 text-center text-sm text-emerald-200">
              Waiting on the bots…
            </div>
          )}
        </div>
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
    <div className="rounded-2xl bg-emerald-950/70 p-4 text-center shadow-lg">
      <div className="mb-2 space-y-0.5">
        {winners.map((w) => (
          <div key={w.index} className="text-base font-bold text-yellow-200">
            {line(w)}
          </div>
        ))}
      </div>
      <div className={`mb-3 text-sm font-semibold ${heroDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
        This hand: {heroDelta >= 0 ? '+' : ''}
        {heroDelta}
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={onNext}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-500"
        >
          Next hand
        </button>
        <button
          onClick={onEnd}
          className="rounded-xl bg-emerald-800 px-6 py-2.5 text-sm font-bold text-emerald-100 shadow hover:bg-emerald-700"
        >
          End session
        </button>
      </div>
    </div>
  )
}
