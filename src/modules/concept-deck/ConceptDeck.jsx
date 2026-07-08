// Module 6 — Spaced-Repetition Concept Deck (CLAUDE.md §4).
//
// An Anki-style flashcard reviewer: show a card front → reveal the back → rate recall
// (Again / Hard / Good / Easy). Each rating re-schedules the card via the SM-2 logic
// in ./scheduler.js and persists it through ../../store (module id 'concept-deck').
// The session queue (./session.js) serves due + a capped number of new cards, missed
// and overdue first. Layout mirrors the other trainers' setup → playing → summary flow.
//
// Grading here is SELF-RATED (there's no objective "correct" for recall), so the
// dashboard tile carries ZERO readiness weight — see Dashboard.jsx. We still feed the
// shared progress store (correct = you recalled it, i.e. any rating but "Again") so the
// tile shows a meaningful recall % / review count / streak and the nightly-streak
// counter fires like every other module.

import { useMemo, useState } from 'react'
import deck from '../../data/concept-cards.json'
import {
  getProgress,
  recordAttempt,
  resetProgress,
  getSchedule,
  saveCardState,
  resetConceptDeck,
} from '../../store'
import { schedule as reschedule, previewInterval } from './scheduler.js'
import { buildQueue, countQueue, DEFAULT_NEW_PER_SESSION } from './session.js'

const MODULE_ID = 'concept-deck'
const CARDS = deck.cards
const NEW_PER_SESSION = DEFAULT_NEW_PER_SESSION

// Rating buttons, worst → best. `again` re-queues within the session (relearning).
const RATING_BUTTONS = [
  { key: 'again', label: 'Again', hint: 'Forgot it', className: 'bg-rose-500 hover:bg-rose-400' },
  { key: 'hard', label: 'Hard', hint: 'Barely', className: 'bg-amber-500 hover:bg-amber-400' },
  { key: 'good', label: 'Good', hint: 'Recalled', className: 'bg-emerald-500 hover:bg-emerald-400' },
  { key: 'easy', label: 'Easy', hint: 'Instant', className: 'bg-sky-500 hover:bg-sky-400' },
]

const emptyStats = () => ({ reviewed: 0, recalled: 0, byRating: { again: 0, hard: 0, good: 0, easy: 0 } })

export default function ConceptDeck() {
  const [phase, setPhase] = useState('setup') // 'setup' | 'reviewing' | 'summary'
  const [queue, setQueue] = useState([]) // remaining QueueItems this session
  const [current, setCurrent] = useState(null) // the card being shown
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState(emptyStats)
  const [lifetime, setLifetime] = useState(() => getProgress(MODULE_ID))
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [refresh, setRefresh] = useState(0) // bump to recompute setup counts after a reset

  // Due/new counts for the setup screen. Recomputed whenever we return to setup
  // (keyed off phase) or after a reset (keyed off refresh) so the numbers stay live.
  const counts = useMemo(
    () => (phase === 'setup' ? countQueue(CARDS, getSchedule(), Date.now()) : null),
    [phase, refresh],
  )

  const start = () => {
    const items = buildQueue(CARDS, getSchedule(), Date.now(), { newPerSession: NEW_PER_SESSION })
    setStats(emptyStats())
    if (items.length === 0) {
      // Nothing due and no new cards — go straight to a "caught up" summary.
      setQueue([])
      setCurrent(null)
      setPhase('summary')
      return
    }
    const [first, ...rest] = items
    setQueue(rest)
    setCurrent(first)
    setRevealed(false)
    setPhase('reviewing')
  }

  const rate = (rating) => {
    if (!current) return
    const now = Date.now()
    const nextState = reschedule(current.state, rating, now)
    saveCardState(current.card.id, nextState)

    // Feed shared progress: "correct" = recalled (any rating except Again).
    const recalled = rating !== 'again'
    setLifetime(recordAttempt(MODULE_ID, { correct: recalled }))
    setStats((s) => ({
      reviewed: s.reviewed + 1,
      recalled: s.recalled + (recalled ? 1 : 0),
      byRating: { ...s.byRating, [rating]: s.byRating[rating] + 1 },
    }))

    // On "Again", re-queue this card near the back so it comes round again this sitting.
    let nextQueue = queue
    if (rating === 'again') {
      nextQueue = [...queue, { card: current.card, state: nextState, isNew: false }]
    }

    if (nextQueue.length === 0) {
      setQueue([])
      setCurrent(null)
      setPhase('summary')
      return
    }
    const [next, ...rest] = nextQueue
    setQueue(rest)
    setCurrent(next)
    setRevealed(false)
  }

  const confirmReset = () => {
    resetProgress(MODULE_ID)
    resetConceptDeck()
    setLifetime(getProgress(MODULE_ID))
    setConfirmingReset(false)
    setRefresh((n) => n + 1)
  }

  // ---------- setup ----------
  if (phase === 'setup') {
    const nothingToDo = counts.due === 0 && counts.fresh === 0
    const newThisSession = Math.min(counts.fresh, NEW_PER_SESSION)
    const sessionSize = counts.due + newThisSession
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Concept Deck</h1>
        <p className="text-emerald-100">Spaced-repetition review of the core poker concepts</p>

        <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-3">
          <CountTile value={counts.due} label="Due now" tone="text-white" />
          <CountTile value={counts.fresh} label="New cards left" tone="text-emerald-200" />
        </div>

        {nothingToDo ? (
          <p className="mt-6 max-w-xs text-center text-sm text-emerald-200">
            You're all caught up — no cards due and none left to learn. Come back later as reviews
            come due. 🎉
          </p>
        ) : (
          <>
            <button
              onClick={start}
              className="mt-6 rounded-xl bg-white px-8 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
            >
              Start review · {sessionSize} card{sessionSize === 1 ? '' : 's'}
            </button>
            <p className="mt-2 text-xs text-emerald-300">
              {counts.due} due + up to {NEW_PER_SESSION} new per session
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col items-center gap-1">
          <p className="text-xs text-emerald-300">
            Lifetime recall: {lifetime.accuracy.toFixed(1)}% · {lifetime.attempts} reviews
          </p>
          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-200"
            >
              Reset deck progress
            </button>
          ) : (
            <div className="mt-1 flex flex-col items-center gap-2 rounded-lg bg-emerald-950/40 px-4 py-3">
              <p className="max-w-xs text-center text-xs text-emerald-100">
                This clears every card's schedule and this deck's stats — all cards become new
                again. Sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmReset}
                  className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-rose-400"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow hover:bg-emerald-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Shell>
    )
  }

  // ---------- summary ----------
  if (phase === 'summary') {
    const recallPct = stats.reviewed ? (100 * stats.recalled) / stats.reviewed : 0
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Review complete</h1>
        {stats.reviewed === 0 ? (
          <div className="mt-4 max-w-xs rounded-xl bg-white/95 p-5 text-center text-sm text-emerald-800 shadow-lg">
            Nothing was due — you're caught up. New reviews unlock as cards come due over the next
            days. 🎉
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-xl bg-white/95 p-5 text-center shadow-lg">
              <div className="text-4xl font-bold text-emerald-700">{recallPct.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">
                recalled {stats.recalled}/{stats.reviewed} · lifetime {lifetime.accuracy.toFixed(1)}%
              </div>
            </div>

            <div className="mt-4 w-full max-w-sm rounded-xl bg-white/95 p-4 shadow-lg">
              <div className="text-sm font-semibold text-gray-800">Ratings this session</div>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {RATING_BUTTONS.map((b) => (
                  <li key={b.key} className="flex justify-between">
                    <span>{b.label}</span>
                    <span className="tabular-nums text-gray-600">{stats.byRating[b.key]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <button
          onClick={() => setPhase('setup')}
          className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
        >
          Done
        </button>
      </Shell>
    )
  }

  // ---------- reviewing ----------
  const remaining = queue.length + 1 // cards left including the one on screen
  return (
    <Shell>
      <div className="flex w-full max-w-md items-center justify-between text-sm text-emerald-100">
        <span>{remaining} left this session</span>
        <span>
          {current.isNew ? 'New card' : 'Review'} · {current.card.category}
        </span>
      </div>

      <div className="mt-4 flex min-h-[14rem] w-full max-w-md flex-col items-center justify-center rounded-2xl bg-white/95 p-6 text-center shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
          {current.card.category}
        </div>
        <div className="mt-3 text-lg font-bold text-gray-900">{current.card.front}</div>
        {revealed && (
          <>
            <div className="my-4 h-px w-2/3 bg-gray-200" />
            <div className="text-sm leading-relaxed text-gray-700">{current.card.back}</div>
          </>
        )}
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-6 rounded-xl bg-white px-8 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
        >
          Show answer
        </button>
      ) : (
        <div className="mt-6 w-full max-w-md">
          <p className="mb-2 text-center text-xs text-emerald-300">How well did you recall it?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATING_BUTTONS.map((b) => (
              <button
                key={b.key}
                onClick={() => rate(b.key)}
                className={`flex flex-col items-center rounded-xl px-2 py-3 font-bold text-white shadow transition ${b.className}`}
              >
                <span>{b.label}</span>
                <span className="mt-0.5 text-[10px] font-medium opacity-90">
                  {previewInterval(current.state, b.key)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Shell>
  )
}

function CountTile({ value, label, tone }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-emerald-950/40 p-4 text-center shadow-lg">
      <span className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</span>
      <span className="mt-1 text-xs uppercase tracking-wide text-emerald-300">{label}</span>
    </div>
  )
}

// Shared page frame (matches the other trainers).
function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-800 p-6">
      {children}
    </div>
  )
}
