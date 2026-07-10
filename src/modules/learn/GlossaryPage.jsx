// Learn → Glossary — the full-page browsable reference of every poker term.
//
// This is the page CHROME only: the screen, header, and back-to-Learn nav. The
// actual searchable, categorized term list lives in GlossaryContent.jsx, which is
// shared with the slide-out reference drawer so the two can never drift. All
// definitions come from the source-of-truth map in components/glossary.js.

import GlossaryContent, { GLOSSARY_TERM_COUNT } from './GlossaryContent.jsx'

export default function GlossaryPage({ onBack }) {
  return (
    <div className="pt-screen">
      <div className="pt-rail">
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-onfelt-2 hover:text-onfelt"
        >
          <span aria-hidden="true">‹</span> Back to Learn
        </button>

        <header className="mb-5 text-center">
          <div className="pt-eyebrow text-accent-text">Reference</div>
          <h1 className="pt-title mt-1">Glossary</h1>
          <p className="mt-1 text-sm text-onfelt-2">
            Every poker term in the app, in plain English — {GLOSSARY_TERM_COUNT} terms. Tap the search box to jump
            to one fast.
          </p>
        </header>

        <GlossaryContent />

        <div className="mt-8 text-center">
          <button onClick={onBack} className="text-sm font-semibold text-onfelt-2 hover:text-onfelt">
            ‹ Back to Learn
          </button>
        </div>
      </div>
    </div>
  )
}
