// ReferenceDrawer — a slide-out Learn/reference panel that opens OVER the current
// trainer or simulator without navigating away from it.
//
// Why this exists: while drilling or playing a sim hand you often want to look up a
// term or re-read a phase, but leaving the view would reset the drill. This drawer
// floats above the view instead. It holds only its own little nav state (which tab,
// which phase) — it never touches the trainer's state, the engine, ranges, the
// store, or grading. Closing it leaves the drill exactly as it was.
//
// It reuses the SAME content the Learn section renders: GlossaryContent for the
// searchable glossary, PhaseArticleBody for each phase article. Nothing is
// duplicated — same data (phases.js / glossary.js), same components.
//
// Layout: full-screen dismissible sheet on mobile, right-side drawer on desktop.
// Closes on the ✕ button, on Escape, and on tapping the dimmed backdrop.

import { useEffect, useState } from 'react'
import { PHASES } from '../modules/learn/phases.js'
import GlossaryContent from '../modules/learn/GlossaryContent.jsx'
import PhaseArticleBody from '../modules/learn/PhaseArticleBody.jsx'

export default function ReferenceDrawer({ open, onClose }) {
  // 'glossary' | 'phases' — which section of the drawer is showing. openPhaseId is
  // the phase being read within the Phases tab (null = the phase list). This state
  // is intentionally local and separate from anything in the trainer underneath.
  const [tab, setTab] = useState('glossary')
  const [openPhaseId, setOpenPhaseId] = useState(null)

  // Escape closes — only wired while open, so it never swallows Escape for the
  // trainer when the drawer is shut.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const phase = openPhaseId ? PHASES.find((p) => p.id === openPhaseId) : null

  return (
    // Kept mounted (not conditionally removed) so the slide transition plays. When
    // closed it is fully transparent AND pointer-events-none, so it never blocks a
    // tap meant for the trainer beneath it.
    <div
      className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={open ? undefined : true}
    >
      {/* Dimmed backdrop — tap to dismiss. */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* The panel: full-width sheet on mobile, fixed-width drawer on desktop. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Learn reference"
        className={`absolute inset-y-0 right-0 flex w-full max-w-full flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header: title + tabs + close. Sticky within the panel so the controls
            stay reachable while the content scrolls. */}
        <div className="shrink-0 border-b border-line bg-surface px-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink-heading">
              <span aria-hidden="true">📖</span> Learn &amp; reference
            </h2>
            <button
              onClick={onClose}
              className="-mr-1 rounded-lg p-1.5 text-xl leading-none text-ink-muted transition hover:bg-surface-sunken hover:text-ink-body"
              aria-label="Close reference"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex gap-1" role="tablist" aria-label="Reference sections">
            <TabButton active={tab === 'glossary'} onClick={() => setTab('glossary')}>
              Glossary
            </TabButton>
            <TabButton active={tab === 'phases'} onClick={() => setTab('phases')}>
              Learn phases
            </TabButton>
          </div>
        </div>

        {/* Scrollable content. -webkit-overflow-scrolling for momentum on iOS. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {tab === 'glossary' && <GlossaryContent compact />}

          {tab === 'phases' &&
            (phase ? (
              <div>
                <button
                  onClick={() => setOpenPhaseId(null)}
                  className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-text hover:underline"
                >
                  <span aria-hidden="true">‹</span> All phases
                </button>
                <PhaseArticleBody phase={phase} showTrainers={false} compact />
              </div>
            ) : (
              <PhaseList onOpen={setOpenPhaseId} />
            ))}
        </div>
      </aside>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'border-b-2 border-accent text-ink-heading'
          : 'border-b-2 border-transparent text-ink-muted hover:text-ink-body'
      }`}
    >
      {children}
    </button>
  )
}

// The phase index inside the drawer — same PHASES data as the Learn home, in a
// compact tappable list sized for the narrow drawer.
function PhaseList({ onOpen }) {
  return (
    <ol className="space-y-2">
      {PHASES.map((p) => (
        <li key={p.id}>
          <button
            onClick={() => onOpen(p.id)}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-raised p-3 text-left transition hover:bg-surface-sunken"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold tabular-nums text-onfelt">
              {p.number}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink-heading">{p.title}</span>
              <span className="block text-xs text-ink-muted">{p.description}</span>
            </span>
            <span className="shrink-0 text-lg text-accent-text" aria-hidden="true">
              ›
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
