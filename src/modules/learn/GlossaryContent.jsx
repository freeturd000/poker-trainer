// GlossaryContent — the searchable, categorized glossary list, WITHOUT page chrome.
//
// This is the shared body used by both the full Learn → Glossary page
// (GlossaryPage.jsx, which wraps it in a screen + header + back button) and the
// slide-out reference drawer (components/ReferenceDrawer.jsx). Extracting it here
// means the term grouping, search, and layout live in exactly one place.
//
// DISPLAY ONLY: definitions are read from the source-of-truth map in
// components/glossary.js — never restated here. We add only a thin presentation
// layer (category + display label per key). Every GLOSSARY key is rendered; any
// key not placed in a category below lands in a "More terms" catch-all, so new
// entries in glossary.js appear automatically.

import { useMemo, useState } from 'react'
import { GLOSSARY } from '../../components/glossary.js'

// Ordered categories: each lists the glossary keys it holds and a friendly display
// label for that key. Labels are just formatting of the term token — the
// definition itself is never duplicated here.
const CATEGORIES = [
  {
    title: 'The table & positions',
    blurb: 'Where you sit and the forced bets that start a hand.',
    terms: [
      ['position', 'Position'],
      ['UTG', 'UTG'],
      ['HJ', 'HJ'],
      ['CO', 'CO'],
      ['BTN', 'BTN'],
      ['SB', 'SB'],
      ['BB', 'BB'],
      ['button', 'The button'],
      ['blinds', 'Blinds'],
    ],
  },
  {
    title: 'Actions — what you can do',
    blurb: 'The moves you make on your turn.',
    terms: [
      ['fold', 'Fold'],
      ['check', 'Check'],
      ['call', 'Call'],
      ['bet', 'Bet'],
      ['raise', 'Raise'],
      ['3bet', '3-bet'],
      ['limp', 'Limp'],
      ['all-in', 'All-in'],
    ],
  },
  {
    title: 'The cards & the rounds',
    blurb: 'How a hand unfolds, street by street.',
    terms: [
      ['preflop', 'Preflop'],
      ['flop', 'Flop'],
      ['turn', 'Turn'],
      ['river', 'River'],
      ['postflop', 'Postflop'],
      ['board', 'The board'],
      ['pot', 'The pot'],
      ['showdown', 'Showdown'],
    ],
  },
  {
    title: 'The math',
    blurb: 'The numbers behind a good call or fold.',
    terms: [
      ['equity', 'Equity'],
      ['outs', 'Outs'],
      ['potodds', 'Pot odds'],
      ['breakeven', 'Break-even'],
      ['range', 'Range'],
      ['draw', 'Draw'],
      ['variance', 'Variance'],
    ],
  },
  {
    title: 'Boards & hands',
    blurb: 'Reading the texture and betting your hand.',
    terms: [
      ['wet', 'Wet board'],
      ['dry', 'Dry board'],
      ['paired', 'Paired board'],
      ['monotone', 'Monotone board'],
      ['two-tone', 'Two-tone board'],
      ['made hand', 'Made hand'],
      ['cbet', 'C-bet'],
      ['value', 'Value bet'],
      ['bluff', 'Bluff'],
    ],
  },
  {
    title: 'Live play, bankroll & mindset',
    blurb: 'The stuff that matters once you sit at a real table.',
    terms: [
      ['buy-in', 'Buy-in'],
      ['bb', 'Big blind (bb)'],
      ['bankroll', 'Bankroll'],
      ['straddle', 'Straddle'],
      ['tilt', 'Tilt'],
    ],
  },
  {
    title: 'Player types',
    blurb: 'Shorthand for the opponents you’ll meet.',
    terms: [
      ['nit', 'Nit'],
      ['station', 'Calling station'],
      ['tag', 'TAG'],
    ],
  },
]

// Build the render model once: attach each key's definition, and sweep up any
// glossary key not placed above into a "More terms" catch-all so nothing is lost.
function buildSections() {
  const placed = new Set()
  const sections = CATEGORIES.map((cat) => ({
    title: cat.title,
    blurb: cat.blurb,
    entries: cat.terms
      .filter(([key]) => {
        const has = key in GLOSSARY
        if (has) placed.add(key)
        return has
      })
      .map(([key, label]) => ({ key, label, def: GLOSSARY[key] })),
  })).filter((s) => s.entries.length > 0)

  const leftover = Object.keys(GLOSSARY).filter((k) => !placed.has(k))
  if (leftover.length > 0) {
    sections.push({
      title: 'More terms',
      blurb: 'Other terms from across the app.',
      entries: leftover.map((key) => ({ key, label: key, def: GLOSSARY[key] })),
    })
  }
  return sections
}

// Total number of terms rendered — exported so a page header can show the count
// without rebuilding the model.
export const GLOSSARY_TERM_COUNT = Object.keys(GLOSSARY).length

/**
 * The searchable term list. Chrome-less so it drops into a page or the drawer.
 * @param {object} props
 * @param {boolean} [props.compact] - single-column, tighter cards for the drawer
 */
export default function GlossaryContent({ compact = false }) {
  const [query, setQuery] = useState('')
  const sections = useMemo(buildSections, [])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? sections
        .map((s) => ({
          ...s,
          entries: s.entries.filter(
            (e) => e.label.toLowerCase().includes(q) || e.def.toLowerCase().includes(q),
          ),
        }))
        .filter((s) => s.entries.length > 0)
    : sections

  const total = GLOSSARY_TERM_COUNT
  const shown = filtered.reduce((n, s) => n + s.entries.length, 0)

  return (
    <div>
      <div className="mb-5">
        <label htmlFor={`glossary-search${compact ? '-drawer' : ''}`} className="sr-only">
          Search terms
        </label>
        <input
          id={`glossary-search${compact ? '-drawer' : ''}`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a term or its meaning…"
          className="w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {q && (
          <p className="mt-2 text-xs text-ink-muted">
            {shown === 0 ? 'No terms match — try a different word.' : `Showing ${shown} of ${total} terms.`}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {filtered.map((section) => (
          <section key={section.title} className="pt-card p-4 sm:p-6">
            <div className="mb-3 border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink-heading sm:text-lg">{section.title}</h2>
              <p className="mt-0.5 text-xs text-ink-muted">{section.blurb}</p>
            </div>
            <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
              {section.entries.map((e) => (
                <div key={e.key} className="min-w-0">
                  <dt className="text-sm font-bold text-ink-heading">{e.label}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-ink-body">{stripLabel(e.def)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  )
}

// Most definitions in glossary.js lead with the term and an em-dash ("Outs — the
// cards…"). Since we already render a bold label above the definition, drop that
// leading "Term — " so the two don't read as a stutter. Purely cosmetic trimming
// of the shared string; the source data is untouched and still the single source
// of truth. Anything without the pattern is shown verbatim.
function stripLabel(def) {
  const i = def.indexOf(' — ')
  // Only strip when the em-dash is early (it's the "Term — " lead, not a mid-
  // sentence dash) so we never cut real content.
  if (i > 0 && i <= 24) return def.slice(i + 3)
  return def
}
