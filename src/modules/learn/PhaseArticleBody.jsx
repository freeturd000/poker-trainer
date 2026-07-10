// PhaseArticleBody — the shared renderer for a single Learn phase's article body.
//
// This owns the VISUALS registry and the header + section/prose/visual layout that
// used to live inline in Learn.jsx. Both surfaces render THROUGH this one component
// so the phase content is never duplicated:
//   • the full-page Learn article (Learn.jsx wraps this in page chrome), and
//   • the slide-out reference drawer (components/ReferenceDrawer.jsx), which passes
//     compact so it reads well in the narrow drawer width.
//
// Content is read straight from phases.js via the `phase` prop — this file adds no
// prose of its own. It renders the inner content only (no <article> card, no back
// nav); the caller supplies whatever surrounding chrome it needs.

import HandFlowVisual from './HandFlowVisual.jsx'
import PositionDiagram from './PositionDiagram.jsx'
import RangeGridVisual from './RangeGridVisual.jsx'
import HandRankings from './HandRankings.jsx'
import OutsVisual from './OutsVisual.jsx'
import RuleOf24Demo from './RuleOf24Demo.jsx'
import PotOddsCalc from './PotOddsCalc.jsx'
import TextureClassifierVisual from './TextureClassifierVisual.jsx'
import RangeFavorVisual from './RangeFavorVisual.jsx'
import HandBucketVisual from './HandBucketVisual.jsx'
import CbetHelperVisual from './CbetHelperVisual.jsx'
import BankrollCalcVisual from './BankrollCalcVisual.jsx'

// Registry of inline visuals a phase section can render. phases.js references these
// by string name (keeping that file plain data), and the renderer looks the
// component up here and drops it in after the section's prose.
const VISUALS = {
  HandFlowVisual,
  PositionDiagram,
  RangeGridVisual,
  HandRankings,
  OutsVisual,
  RuleOf24Demo,
  PotOddsCalc,
  TextureClassifierVisual,
  RangeFavorVisual,
  HandBucketVisual,
  CbetHelperVisual,
  BankrollCalcVisual,
}

/**
 * @param {object} props
 * @param {object} props.phase                 - a phase object from phases.js
 * @param {(view: string) => void} [props.onNavigate] - hand off to a trainer
 * @param {boolean} [props.showTrainers]        - show the "Practice this" buttons (needs onNavigate)
 * @param {boolean} [props.compact]             - tighten type/spacing for the narrow drawer
 */
export default function PhaseArticleBody({ phase, onNavigate, showTrainers = true, compact = false }) {
  return (
    <>
      <header className={`border-b border-line pb-5 ${compact ? 'mb-5' : 'mb-6'}`}>
        <div className="pt-eyebrow text-accent-text">Phase {phase.number}</div>
        <h1 className={`mt-1 font-bold text-ink-heading ${compact ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
          {phase.title}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-ink-body">{phase.description}</p>
        {showTrainers && onNavigate && phase.trainers?.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Practice this</span>
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
              {/* In the narrow drawer, let a wide visual scroll horizontally inside
                  its own box rather than blowing out the drawer width. */}
              {Visual && (compact ? <div className="overflow-x-auto">{<Visual />}</div> : <Visual />)}
            </section>
          )
        })}
      </div>
    </>
  )
}
