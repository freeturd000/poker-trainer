// Learn section — the theory/explainer side of the app (CLAUDE.md "Learn" addition).
//
// A guided, six-phase reading path that mirrors the build/skill order: ranges →
// math → board reading → postflop → reps → live play. The Learn home is an index
// of the phases; tapping one opens its article. This is the SHELL only — each
// article renders its section outline with a "coming soon" placeholder until the
// real prose is dropped into phases.js later, one phase at a time.
//
// Self-contained: owns a tiny bit of local view state to route home ↔ article, and
// takes `onNavigate` so an article can hand off to the matching trainer. Reads no
// engine/store logic — it's static content.

import { useState } from 'react'
import { PHASES, getPhase } from './phases.js'
import PositionDiagram from './PositionDiagram.jsx'
import RangeGridVisual from './RangeGridVisual.jsx'
import HandRankings from './HandRankings.jsx'
import OutsVisual from './OutsVisual.jsx'
import RuleOf24Demo from './RuleOf24Demo.jsx'
import PotOddsCalc from './PotOddsCalc.jsx'
import TextureClassifierVisual from './TextureClassifierVisual.jsx'
import RangeFavorVisual from './RangeFavorVisual.jsx'

// Registry of inline visuals a phase section can render. phases.js references these
// by string name (keeping that file plain data), and the article renderer looks the
// component up here and drops it in after the section's prose.
const VISUALS = {
  PositionDiagram,
  RangeGridVisual,
  HandRankings,
  OutsVisual,
  RuleOf24Demo,
  PotOddsCalc,
  TextureClassifierVisual,
  RangeFavorVisual,
}

export default function Learn({ onNavigate }) {
  // Local sub-route: null = the phase index, otherwise the open phase id. Kept
  // here (not in App) so the whole Learn section stays one self-contained tab.
  const [openId, setOpenId] = useState(null)
  const phase = openId ? getPhase(openId) : null

  if (phase) {
    return <PhaseArticle phase={phase} onBack={() => setOpenId(null)} onNavigate={onNavigate} />
  }
  return <LearnHome onOpen={setOpenId} />
}

// ── Learn home: the phase index ──────────────────────────────────────────────
function LearnHome({ onOpen }) {
  return (
    <div className="pt-screen">
      <div className="pt-rail">
        <header className="mb-6 text-center">
          <h1 className="pt-title">Learn</h1>
          <p className="mt-1 text-sm text-onfelt-2">
            A guided path from complete beginner to a confident $1/$2 table — six phases, in order.
          </p>
        </header>

        <ol className="grid grid-cols-1 gap-3">
          {PHASES.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onOpen(p.id)}
                className="flex w-full items-center gap-4 pt-card p-4 text-left transition hover:bg-surface-raised sm:p-5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold tabular-nums text-onfelt">
                  {p.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-ink-heading sm:text-lg">{p.title}</span>
                  <span className="block text-sm text-ink-muted">{p.description}</span>
                </span>
                <span className="shrink-0 text-xl text-accent-text" aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ol>

        <p className="mt-6 text-center text-xs text-onfelt-4">
          Read a phase, then drill it in the matching trainer. Study and reps together.
        </p>
      </div>
    </div>
  )
}

// ── Phase article: a readable explainer page ─────────────────────────────────
// Narrow reading column, generous line height, clear section headings. Sections
// with no prose yet render a "coming soon" note so the outline is visible.
function PhaseArticle({ phase, onBack, onNavigate }) {
  return (
    <div className="pt-screen">
      {/* max-w-prose (not the wider pt-rail) keeps line length comfortable to read
          on desktop; on a phone it's simply full-width. */}
      <div className="w-full max-w-prose">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-onfelt-2 hover:text-onfelt"
        >
          <span aria-hidden="true">‹</span> All phases
        </button>

        <article className="pt-card p-5 sm:p-8">
          <header className="mb-6 border-b border-line pb-5">
            <div className="pt-eyebrow text-accent-text">Phase {phase.number}</div>
            <h1 className="mt-1 text-2xl font-bold text-ink-heading sm:text-3xl">{phase.title}</h1>
            <p className="mt-2 text-base leading-relaxed text-ink-body">{phase.description}</p>
            {phase.trainers?.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Practice this
                </span>
                {phase.trainers.map((t) => (
                  <button
                    key={t.view}
                    onClick={() => onNavigate(t.view)}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-onfelt shadow transition hover:bg-accent-hover"
                  >
                    {t.label} →
                  </button>
                ))}
              </div>
            )}
          </header>

          <div className="space-y-8">
            {phase.sections.map((s, i) => {
              const Visual = s.visual ? VISUALS[s.visual] : null
              return (
                <section key={i}>
                  <h2 className="text-lg font-bold text-ink-heading">{s.heading}</h2>
                  {s.body.length > 0
                    ? s.body.map((para, j) => (
                        <p key={j} className="mt-3 text-base leading-relaxed text-ink-body">
                          {para}
                        </p>
                      ))
                    : !Visual && <p className="mt-2 text-sm italic text-ink-muted">Content coming soon.</p>}
                  {Visual && <Visual />}
                </section>
              )
            })}
          </div>
        </article>

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-sm font-semibold text-onfelt-2 hover:text-onfelt"
          >
            ‹ Back to all phases
          </button>
        </div>
      </div>
    </div>
  )
}
