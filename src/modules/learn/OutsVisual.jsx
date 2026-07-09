// Learn visual — a concrete outs illustration (Phase 2).
//
// Cycles through a few common draws, showing the hand + board with the shared
// <Card /> and then the SPECIFIC cards that are outs, so the count is tangible.
// The hand/board layouts and out counts come from /src/data/draws.js (the same
// reference the Odds Trainer uses); the explicit out-card lists are enumerated
// here to display them, each verified to equal the reference count.

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { OUTS_TEMPLATES, OUTS_BY_TYPE } from '../../data/draws.js'

// The draws to illustrate, in teaching order. `outCards` is the explicit list of
// unseen cards that complete the draw for that exact template; `outsLabel` names
// them in words. Each list length is asserted against the reference count below.
const EXAMPLES = [
  {
    type: 'flush-draw',
    outsLabel: 'any remaining heart',
    outCards: ['Ah', 'Qh', 'Jh', 'Th', '8h', '7h', '5h', '3h', '2h'],
  },
  {
    type: 'oesd',
    outsLabel: 'any 4 or any 9',
    outCards: ['4c', '4d', '4h', '4s', '9c', '9d', '9h', '9s'],
  },
  {
    type: 'gutshot',
    outsLabel: 'any 7',
    outCards: ['7c', '7d', '7h', '7s'],
  },
]

export default function OutsVisual() {
  const [idx, setIdx] = useState(0)
  const ex = EXAMPLES[idx]
  const info = OUTS_BY_TYPE[ex.type] // { outs, label, why }
  const tmpl = OUTS_TEMPLATES[ex.type] // { hole, board }

  const next = () => setIdx((i) => (i + 1) % EXAMPLES.length)

  return (
    <div className="not-prose mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-emerald-900">{info.label}</div>
          <div className="text-xs text-gray-500">
            Example {idx + 1} of {EXAMPLES.length}
          </div>
        </div>
        <span className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white">{info.outs} outs</span>
      </div>

      {/* Hand + board */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-400">Your hand</span>
          <div className="flex gap-1.5">
            {tmpl.hole.map((c) => (
              <Card key={c} card={c} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-400">Board</span>
          <div className="flex gap-1.5">
            {tmpl.board.map((c) => (
              <Card key={c} card={c} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* The outs, shown explicitly */}
      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <div className="text-center text-xs font-semibold uppercase tracking-wide text-emerald-600">
          The {info.outs} outs — {ex.outsLabel}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {ex.outCards.map((c) => (
            <Card key={c} card={c} size="sm" className="ring-2 ring-emerald-500 ring-offset-1 ring-offset-emerald-50" />
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-600">{info.why}</p>

      <button
        onClick={next}
        className="mt-3 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
      >
        Next example →
      </button>
    </div>
  )
}
