// Module 1 — Preflop Range Trainer (6-max cash). CLAUDE.md §4.
//
// Two modes:
//   'rfi'   — deal a seat + hand -> user picks Raise/Fold -> grade vs the RFI chart.
//   'bbdef' — deal a raiser's seat + hand -> user picks 3-Bet/Call/Fold -> grade vs
//             the BB-defense chart (hero is always the big blind facing one raise).
// Both grade instantly, show the correct action + a "why" on a miss, and wire into
// the shared store for progress + leak tracking (leaks tagged per spot per mode).

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { getProgress, recordAttempt, recordLeak, resetProgress, clearLeaks } from '../../store'
import { getAction, whyText, getBBDefAction, bbDefWhyText, POSITIONS } from './ranges.js'
import { nextSpot, leakTag, parseLeakTag, bbDefLeakTag, parseBBDefLeakTag } from './spot.js'

const MODULE_ID = 'range-trainer'
const SESSION_LENGTHS = [10, 25, 50, 100]

// Trainer modes for the setup screen. 'rfi' is the default (unchanged behavior).
const MODE_OPTIONS = [
  { id: 'rfi', label: 'RFI (opening)', blurb: 'RFI (raise-first-in) openings' },
  { id: 'bbdef', label: 'BB Defense (facing a raise)', blurb: 'Big-blind defense vs a single raise' },
]

// Action buttons per mode. `tone` maps to a static Tailwind class set below.
const ACTIONS = {
  rfi: [
    { id: 'raise', label: 'Raise', tone: 'emerald' },
    { id: 'fold', label: 'Fold', tone: 'rose' },
  ],
  bbdef: [
    { id: '3bet', label: '3-Bet', tone: 'emerald' },
    { id: 'call', label: 'Call', tone: 'sky' },
    { id: 'fold', label: 'Fold', tone: 'rose' },
  ],
}

// Static class strings per tone so Tailwind's scanner keeps them.
const TONE_CLASS = {
  emerald: 'bg-emerald-500 hover:bg-emerald-400',
  sky: 'bg-sky-500 hover:bg-sky-400',
  rose: 'bg-rose-500 hover:bg-rose-400',
}

// Human labels for a graded action (used in the result banner).
const ACTION_LABEL = { raise: 'Raise', fold: 'Fold', '3bet': '3-Bet', call: 'Call' }

// Mode-dispatch helpers — pure, no state.
const gradeAction = (mode, position, token) =>
  mode === 'bbdef' ? getBBDefAction(position, token) : getAction(position, token)
const gradeWhy = (mode, position, token, correct) =>
  mode === 'bbdef' ? bbDefWhyText(position, token, correct) : whyText(position, token, correct)
const gradeTag = (mode, position, token) =>
  mode === 'bbdef' ? bbDefLeakTag(position, token) : leakTag(position, token)

// Seat options for the setup screen. `null` = All (random) — the default. Both
// modes drill the same five seats (in RFI it's hero's seat; in BB-def it's the
// raiser hero is facing).
const SEAT_OPTIONS = [{ label: 'All (random)', value: null }, ...POSITIONS.map((p) => ({ label: p, value: p }))]

const emptyStats = () => ({ answered: 0, correct: 0 })

export default function RangeTrainer() {
  const [phase, setPhase] = useState('setup') // 'setup' | 'playing' | 'summary'
  const [mode, setMode] = useState('rfi') // 'rfi' | 'bbdef'
  const [length, setLength] = useState(25)
  const [seat, setSeat] = useState(null) // null = All (random); else a POSITIONS value
  const [spot, setSpot] = useState(null)
  const [selection, setSelection] = useState(null) // 'raise' | 'fold' | null
  const [result, setResult] = useState(null) // { correct, correctAction, why }
  const [stats, setStats] = useState(emptyStats)
  const [sessionLeaks, setSessionLeaks] = useState({}) // tag -> { token, position, count }
  const [lifetime, setLifetime] = useState(() => getProgress(MODULE_ID).accuracy)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const start = (len) => {
    setLength(len)
    setStats(emptyStats())
    setSessionLeaks({})
    setSelection(null)
    setResult(null)
    setSpot(nextSpot(seat, mode))
    setPhase('playing')
  }

  const answer = (choice) => {
    if (selection) return // already graded this spot
    const correctAction = gradeAction(mode, spot.position, spot.token)
    const isCorrect = choice === correctAction

    const progress = recordAttempt(MODULE_ID, { correct: isCorrect })
    setLifetime(progress.accuracy)
    setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }))

    if (!isCorrect) {
      const tag = gradeTag(mode, spot.position, spot.token)
      recordLeak(tag, { position: spot.position, token: spot.token, correct: correctAction })
      setSessionLeaks((m) => ({
        ...m,
        [tag]: {
          token: spot.token,
          position: spot.position,
          count: (m[tag]?.count ?? 0) + 1,
        },
      }))
    }

    setSelection(choice)
    setResult({ correct: isCorrect, correctAction, why: gradeWhy(mode, spot.position, spot.token, correctAction) })
  }

  const next = () => {
    if (stats.answered >= length) {
      setPhase('summary')
      return
    }
    setSelection(null)
    setResult(null)
    setSpot(nextSpot(seat, mode))
  }

  // Clear only the range-trainer's stored progress and its own leaks (leaks whose
  // tags parse as a range-trainer spot); other modules' data is left intact.
  const confirmReset = () => {
    resetProgress(MODULE_ID)
    clearLeaks((leak) => parseLeakTag(leak.tag) !== null || parseBBDefLeakTag(leak.tag) !== null)
    setLifetime(getProgress(MODULE_ID).accuracy)
    setConfirmingReset(false)
  }

  const sessionAcc = stats.answered ? (100 * stats.correct) / stats.answered : 0
  const worstLeaks = Object.values(sessionLeaks).sort((a, b) => b.count - a.count).slice(0, 5)

  // ---------- setup ----------
  if (phase === 'setup') {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Preflop Range Trainer</h1>
        <p className="text-emerald-100">
          6-max cash · {MODE_OPTIONS.find((m) => m.id === mode).blurb}
        </p>

        <p className="mt-6 text-sm text-emerald-200">Choose a mode:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setMode(opt.id)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow transition ${
                  active
                    ? 'bg-white text-emerald-900'
                    : 'bg-emerald-700 text-emerald-50 hover:bg-emerald-600'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-sm text-emerald-200">
          {mode === 'bbdef' ? 'Choose a raiser to defend against:' : 'Choose a seat to drill:'}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {SEAT_OPTIONS.map((opt) => {
            const active = seat === opt.value
            return (
              <button
                key={opt.label}
                onClick={() => setSeat(opt.value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow transition ${
                  active
                    ? 'bg-white text-emerald-900'
                    : 'bg-emerald-700 text-emerald-50 hover:bg-emerald-600'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-sm text-emerald-200">Choose a session length:</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {SESSION_LENGTHS.map((len) => (
            <button
              key={len}
              onClick={() => start(len)}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
            >
              {len} hands
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="text-xs text-emerald-300">Lifetime accuracy: {lifetime.toFixed(1)}%</p>
          {!confirmingReset ? (
            <button
              onClick={() => setConfirmingReset(true)}
              className="text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-200"
            >
              Reset lifetime stats
            </button>
          ) : (
            <div className="mt-1 flex flex-col items-center gap-2 rounded-lg bg-emerald-950/40 px-4 py-3">
              <p className="max-w-xs text-center text-xs text-emerald-100">
                This clears all saved progress and leaks for the range trainer — are you sure?
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
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Session complete</h1>
        <div className="mt-4 rounded-xl bg-white/95 p-5 text-center shadow-lg">
          <div className="text-4xl font-bold text-emerald-700">{sessionAcc.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">
            {stats.correct}/{stats.answered} correct · lifetime {lifetime.toFixed(1)}%
          </div>
        </div>

        <div className="mt-4 w-full max-w-sm rounded-xl bg-white/95 p-4 shadow-lg">
          <div className="text-sm font-semibold text-gray-800">Worst spots this session</div>
          {worstLeaks.length === 0 ? (
            <div className="mt-1 text-sm text-emerald-700">No misses — clean session! 🎉</div>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {worstLeaks.map((l) => (
                <li key={`${l.position}_${l.token}`} className="flex justify-between">
                  <span>
                    {l.position} · {l.token}
                  </span>
                  <span className="tabular-nums text-red-600">×{l.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => setPhase('setup')}
          className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
        >
          New session
        </button>
      </Shell>
    )
  }

  // ---------- playing ----------
  const handNo = Math.min(stats.answered + (selection ? 0 : 1), length)
  return (
    <Shell>
      <div className="flex w-full max-w-md items-center justify-between text-sm text-emerald-100">
        <span>
          Hand {handNo} / {length}
        </span>
        <span>
          Session {sessionAcc.toFixed(0)}% · Lifetime {lifetime.toFixed(0)}%
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <span className="text-emerald-200 text-sm uppercase tracking-wide">
          {mode === 'bbdef' ? 'You are in the BB vs an open from' : 'You are in'}
        </span>
        <span className="rounded-lg bg-emerald-950/40 px-4 py-1 text-2xl font-bold text-white">
          {spot.position}
        </span>
        <span className="text-xs text-emerald-300">
          {mode === 'bbdef'
            ? seat
              ? `defending vs ${seat} · fixed this session`
              : 'all raisers · random'
            : seat
              ? `drilling ${seat} · fixed seat this session`
              : 'all seats · random'}
        </span>
      </div>

      <div className="mt-6 flex gap-3">
        <Card card={spot.cards[0]} size="lg" />
        <Card card={spot.cards[1]} size="lg" />
      </div>

      {!selection ? (
        <div className="mt-8 flex gap-4">
          {ACTIONS[mode].map((a) => (
            <button
              key={a.id}
              onClick={() => answer(a.id)}
              className={`rounded-xl px-8 py-3 text-lg font-bold text-white shadow ${TONE_CLASS[a.tone]}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3">
          <div
            className={`w-full rounded-xl p-4 text-center shadow-lg ${
              result.correct ? 'bg-emerald-50' : 'bg-rose-50'
            }`}
          >
            <div
              className={`text-lg font-bold ${
                result.correct ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {result.correct ? 'Correct' : 'Incorrect'} — {spot.token} is a{' '}
              {ACTION_LABEL[result.correctAction].toUpperCase()}
            </div>
            {!result.correct && <div className="mt-1 text-sm text-gray-700">{result.why}</div>}
          </div>
          <button
            onClick={next}
            className="rounded-xl bg-white px-8 py-3 font-semibold text-emerald-900 shadow hover:bg-emerald-50"
          >
            {stats.answered >= length ? 'See summary' : 'Next hand'}
          </button>
        </div>
      )}
    </Shell>
  )
}

// Shared page frame for the trainer's three phases.
function Shell({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-800 p-6">
      {children}
    </div>
  )
}
