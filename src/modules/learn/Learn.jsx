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
import GlossaryPage from './GlossaryPage.jsx'
import PhaseArticleBody from './PhaseArticleBody.jsx'

export default function Learn({ onNavigate }) {
  // Local sub-route: null = the phase index, otherwise the open phase id. Kept
  // here (not in App) so the whole Learn section stays one self-contained tab.
  const [openId, setOpenId] = useState(null)
  // Separate flag for the Glossary reference page — it's not one of the numbered
  // phases, so it routes on its own rather than through openId/getPhase.
  const [showGlossary, setShowGlossary] = useState(false)
  const phase = openId ? getPhase(openId) : null

  if (phase) {
    return <PhaseArticle phase={phase} onBack={() => setOpenId(null)} onNavigate={onNavigate} />
  }
  if (showGlossary) {
    return <GlossaryPage onBack={() => setShowGlossary(false)} />
  }
  return <LearnHome onOpen={setOpenId} onOpenGlossary={() => setShowGlossary(true)} />
}

// ── Learn home: the phase index ──────────────────────────────────────────────
function LearnHome({ onOpen, onOpenGlossary }) {
  return (
    <div className="pt-screen">
      <div className="pt-rail">
        <header className="mb-6 text-center">
          <h1 className="pt-title">Learn</h1>
          <p className="mt-1 text-sm text-onfelt-2">
            A guided path from complete beginner to a confident $1/$2 table — seven phases, in order.
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

        {/* Glossary — a reference, not a numbered phase. Pinned below the path and
            visually distinguished (book icon + "Reference" label) so it never reads
            as "Phase 8". Tap it any time to look up a term. */}
        <div className="mt-4 border-t border-line-felt/40 pt-4">
          <button
            onClick={onOpenGlossary}
            className="flex w-full items-center gap-4 pt-card p-4 text-left transition hover:bg-surface-raised sm:p-5"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-inset text-xl text-accent-text"
              aria-hidden="true"
            >
              📖
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">Reference</span>
              <span className="block text-base font-bold text-ink-heading sm:text-lg">Glossary</span>
              <span className="block text-sm text-ink-muted">
                Every poker term in the app, in plain English. Look one up any time.
              </span>
            </span>
            <span className="shrink-0 text-xl text-accent-text" aria-hidden="true">›</span>
          </button>
        </div>

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
          <PhaseArticleBody phase={phase} onNavigate={onNavigate} showTrainers />
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
