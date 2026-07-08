// Dashboard v1 — the app's home screen (CLAUDE.md §5).
//
// Ties the built modules together and makes progress visible: one tile per
// trainer (lifetime accuracy / attempts / best streak), a "Top leaks" list with
// one-tap drilling, a rough readiness signal, and a nightly streak counter. Reads
// only from the shared /store — it owns no trainer logic of its own.

import { useState } from 'react'
import {
  getProgress,
  getLeaks,
  recordActiveDays,
  getDayStreak,
  getSchedule,
  getSessions,
  getBankroll,
} from '../store'
import conceptDeck from '../data/concept-cards.json'
import { countQueue } from '../modules/concept-deck/session.js'
import { computeSessionStats } from '../modules/live-toolkit/stats.js'
import { recommendedStake } from '../modules/live-toolkit/stakes.js'

// The modules that exist today. `view` is the App nav id used to launch each one.
// `kind: 'reference'` marks a non-drill module (no accuracy/attempts) — the tile
// renders a custom summary for it instead of the drill stats.
const MODULES = [
  { id: 'range-trainer', view: 'range', name: 'Range Trainer', blurb: '6-max cash · preflop RFI openings' },
  { id: 'odds-trainer', view: 'odds', name: 'Odds Trainer', blurb: 'Pot odds, outs & call/fold verdicts' },
  { id: 'board-reader', view: 'board', name: 'Board Reader', blurb: 'Texture, what beats you & range reads' },
  { id: 'postflop-trainer', view: 'postflop', name: 'Postflop Trainer', blurb: 'C-bets, facing bets & sizing (heuristic lines)' },
  { id: 'simulator', view: 'simulator', name: 'Simulator', blurb: 'Play full hands vs bots · hands played & win rate' },
  { id: 'concept-deck', view: 'concept', name: 'Concept Deck', blurb: 'Spaced-repetition review · cards due nightly' },
  { id: 'live-toolkit', view: 'live', name: 'Live Toolkit', blurb: 'Session tracker, bankroll & live etiquette', kind: 'reference' },
]

// ⚠️ READINESS FORMULA — FLAG FOR REVIEW (CLAUDE.md §5).
// A ROUGH composite progress signal (0–100), NOT a guarantee you're ready for real
// stakes. Each module contributes  accuracy% × confidence, where
//   confidence = min(attempts / CONFIDENCE_TARGET, 1)   // ramps 0→1 over early reps
// so a high accuracy over a tiny sample stays honestly LOW until volume backs it up
// (5 hands at 100% ≈ confidence 0.1 → barely moves the needle). The overall score is
// a weighted average of those contributions, weighting the Range Trainer higher
// because preflop ranges are the single highest-ROI fundamental (CLAUDE.md §4 M1).
// Weights sum to 1, so the result stays on a clean 0–100 scale. (Re-weighted when
// the Postflop Trainer landed: range .40 / odds .25 / board .15 / postflop .20 —
// preflop still leads; postflop gets .20 because it's where real edges live, but
// it's an advanced skill so it sits below the preflop foundation. Was .5/.3/.2.)
//
// The Concept Deck (Module 6) is DELIBERATELY absent from READINESS_WEIGHTS, so it
// contributes 0 (weight defaults to `?? 0`) and the reviewed formula is untouched.
// Rationale: its grading is SELF-RATED recall, not objective correctness, so folding
// it into the readiness number would let self-scoring inflate it. It still shows a
// tile (recall %, reviews, cards due) — it just doesn't move readiness.
//
// The Live Toolkit (Module 7) is likewise absent from READINESS_WEIGHTS → zero
// weight, formula untouched. It's a tracker/reference (session log, bankroll,
// etiquette), not a drill with a right answer, so it has no accuracy to contribute
// and doesn't feed the nightly streak either.
const CONFIDENCE_TARGET = 50
const READINESS_WEIGHTS = {
  'range-trainer': 0.4,
  'odds-trainer': 0.25,
  'board-reader': 0.15,
  'postflop-trainer': 0.2,
}

function readinessContribution(p) {
  const confidence = Math.min(p.attempts / CONFIDENCE_TARGET, 1)
  return p.accuracy * confidence // 0..100
}

function computeReadiness(progress) {
  let score = 0
  for (const m of MODULES) {
    score += (READINESS_WEIGHTS[m.id] ?? 0) * readinessContribution(progress[m.id])
  }
  return score
}

// Qualitative band for the readiness number — keeps it honest at the low end.
function readinessBand(score) {
  if (score < 20) return { label: 'Just getting started', color: 'text-emerald-300' }
  if (score < 40) return { label: 'Building fundamentals', color: 'text-emerald-200' }
  if (score < 65) return { label: 'Getting there', color: 'text-emerald-100' }
  if (score < 85) return { label: 'Looking solid', color: 'text-white' }
  return { label: 'Table-ready — keep sharp', color: 'text-white' }
}

// Turn a raw leak-log entry into something readable + routable. Module is inferred
// from the tag namespace (odds_ → Odds Trainer, board_ → Board Reader, postflop_ →
// Postflop Trainer, else Range Trainer); the human label prefers the leak's stored
// meta and falls back to the tag.
function describeLeak(leak) {
  if (leak.tag.startsWith('odds_')) {
    return { module: 'Odds Trainer', view: 'odds', text: leak.meta?.label ?? 'Odds spot' }
  }
  if (leak.tag.startsWith('board_')) {
    return { module: 'Board Reader', view: 'board', text: leak.meta?.label ?? 'Board spot' }
  }
  if (leak.tag.startsWith('postflop_')) {
    return { module: 'Postflop Trainer', view: 'postflop', text: leak.meta?.label ?? 'Postflop spot' }
  }
  const pos = leak.meta?.position
  const token = leak.meta?.token
  return { module: 'Range Trainer', view: 'range', text: pos && token ? `${pos} · ${token}` : leak.tag }
}

export default function Dashboard({ onNavigate }) {
  // One read on mount. Recording active days from each module's lastPlayed here
  // (the landing view users return to) is what feeds the nightly streak, without
  // touching the trainers or the existing progress logic. Idempotent, so a dev
  // StrictMode double-invoke is harmless.
  const [data] = useState(() => {
    const progress = Object.fromEntries(MODULES.map((m) => [m.id, getProgress(m.id)]))
    recordActiveDays(...MODULES.map((m) => progress[m.id].lastPlayed).filter(Boolean))
    const sessions = getSessions()
    const bankroll = getBankroll()
    return {
      progress,
      leaks: getLeaks().slice(0, 5),
      streak: getDayStreak(Date.now()),
      readiness: computeReadiness(progress),
      conceptDue: countQueue(conceptDeck.cards, getSchedule(), Date.now()).due,
      live: {
        sessions: sessions.length,
        net: computeSessionStats(sessions).totalProfit,
        bankroll,
        stake: recommendedStake(bankroll)?.stake.label ?? null,
      },
    }
  })

  const band = readinessBand(data.readiness)

  return (
    <div className="pt-screen">
      <div className="pt-rail">
        <header className="mb-6 text-center">
          <h1 className="pt-title">Poker Trainer</h1>
          <p className="mt-1 text-sm text-emerald-200">Your nightly drill dashboard</p>
        </header>

        {/* Readiness + streak */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="pt-card-dark p-5 sm:col-span-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
                Table readiness
              </span>
              <span className={`text-3xl font-bold tabular-nums ${band.color}`}>
                {Math.round(data.readiness)}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-emerald-900">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${Math.min(data.readiness, 100)}%` }}
              />
            </div>
            <div className={`mt-2 text-sm font-semibold ${band.color}`}>{band.label}</div>
            <p className="mt-1 text-xs text-emerald-400">
              A rough progress signal (range + odds accuracy, weighted by volume) — not a real-money guarantee.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center pt-card-dark p-5 text-center">
            <span className="text-4xl">{data.streak > 0 ? '🔥' : '🌙'}</span>
            <span className="mt-1 text-3xl font-bold tabular-nums text-white">{data.streak}</span>
            <span className="text-xs uppercase tracking-wide text-emerald-300">
              day{data.streak === 1 ? '' : 's'} streak
            </span>
            <span className="mt-1 text-[11px] text-emerald-400">
              {data.streak > 0 ? 'Drill tonight to keep it alive' : 'Play today to start one'}
            </span>
          </div>
        </div>

        {/* Learn entry point — theory to pair with the drills. Not a drill itself
            (no accuracy/attempts), so it sits apart from the module tiles and
            doesn't feed readiness. */}
        <button
          onClick={() => onNavigate('learn')}
          className="mb-6 flex w-full items-center gap-4 pt-card-dark p-5 text-left transition hover:bg-emerald-950/60"
        >
          <span className="text-3xl" aria-hidden="true">📖</span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold text-white">Learn</span>
            <span className="block text-sm text-emerald-200">
              The guided six-phase path — read the theory behind each trainer.
            </span>
          </span>
          <span className="shrink-0 text-xl text-emerald-400" aria-hidden="true">›</span>
        </button>

        {/* Module tiles */}
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">Modules</h2>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODULES.map((m) => (
            <ModuleTile
              key={m.id}
              module={m}
              progress={data.progress[m.id]}
              onNavigate={onNavigate}
              badge={m.id === 'concept-deck' && data.conceptDue > 0 ? `${data.conceptDue} due` : null}
              summary={m.id === 'live-toolkit' ? data.live : null}
            />
          ))}
        </div>

        {/* Top leaks */}
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-300">Top leaks</h2>
        <div className="pt-card p-4">
          {data.leaks.length === 0 ? (
            <p className="py-4 text-center text-sm text-emerald-700">
              No leaks logged yet — play a session and your weakest spots will surface here. 🎯
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.leaks.map((leak) => {
                const d = describeLeak(leak)
                return (
                  <li key={leak.tag} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-gray-800">{d.text}</div>
                      <div className="text-xs text-gray-500">
                        {d.module} · missed ×{leak.count}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate(d.view)}
                      className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-500"
                    >
                      Drill this
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function ModuleTile({ module, progress, onNavigate, badge = null, summary = null }) {
  const started = progress.attempts > 0

  return (
    <button
      onClick={() => onNavigate(module.view)}
      className="flex flex-col pt-card p-5 text-left transition hover:bg-white"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-bold text-emerald-900">{module.name}</div>
        {badge && (
          <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">{module.blurb}</div>

      {module.kind === 'reference' ? (
        <ReferenceTileBody summary={summary} />
      ) : started ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat value={`${progress.accuracy.toFixed(0)}%`} label="Accuracy" />
          <Stat value={progress.attempts} label="Attempts" />
          <Stat value={progress.bestStreak} label="Best streak" />
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-4 text-center">
          <div className="text-sm font-semibold text-emerald-700">Not started</div>
          <div className="text-xs text-emerald-600">Drill now →</div>
        </div>
      )}
    </button>
  )
}

// Custom body for the Live Toolkit tile (a tracker, not a drill): show a small
// session/bankroll summary, or a call-to-open when nothing's logged yet.
function ReferenceTileBody({ summary }) {
  const s = summary ?? { sessions: 0, net: 0, bankroll: 0, stake: null }
  if (s.sessions === 0 && !s.bankroll) {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-4 text-center">
        <div className="text-sm font-semibold text-emerald-700">Not set up</div>
        <div className="text-xs text-emerald-600">Log a session or set your roll →</div>
      </div>
    )
  }
  const netStr = `${s.net > 0 ? '+' : s.net < 0 ? '−' : ''}$${Math.abs(Math.round(s.net)).toLocaleString('en-US')}`
  const netTone = s.net > 0 ? 'text-emerald-700' : s.net < 0 ? 'text-rose-600' : 'text-emerald-800'
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
      <Stat value={s.sessions} label="Sessions" />
      <StatTone value={netStr} tone={netTone} label="Net P/L" />
      <Stat value={s.stake ?? '—'} label="Rolled for" />
    </div>
  )
}

function Stat({ value, label }) {
  return <StatTone value={value} label={label} tone="text-emerald-800" />
}

function StatTone({ value, label, tone }) {
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  )
}
