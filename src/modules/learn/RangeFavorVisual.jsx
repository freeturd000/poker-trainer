// Learn visual — "whose range does the board favor?" (Phase 3).
//
// Shows an archetypal raiser-vs-caller flop and calls the Board Reader's real
// favorFlop() heuristic to say whether it favors the preflop raiser, the caller,
// or neither. The verdict and the one-line reason are the heuristic's own output —
// not reimplemented here — so this matches the Range Interaction drill exactly.
// Framed explicitly as a rule of thumb, mirroring the trainer's wording.

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { favorFlop, SCENARIOS } from '../../modules/board-reader/rangeInteraction.js'

// Clear-cut example flops for each verdict — the kind the drill actually serves
// (see isArchetypal in rangeInteraction.js). favor/why are computed live from
// favorFlop below; these are only the boards to illustrate.
const EXAMPLES = [
  { flop: ['As', 'Kd', '4c'], note: 'High, broadway, disconnected' },
  { flop: ['Ks', 'Qd', '7c'], note: 'Two big cards' },
  { flop: ['7s', '6d', '5c'], note: 'Low and connected' },
  { flop: ['9s', '8d', '7c'], note: 'Low and connected' },
  { flop: ['Qd', '9c', '4s'], note: 'In between — no clear lean' },
]

// Preflop framing (in-position raiser vs BB caller), reused from the trainer.
const SCENARIO = SCENARIOS[0] // "BTN raised, BB called."

const FAVOR = {
  raiser: { label: 'Favors the raiser', cls: 'bg-accent-soft text-accent-text' },
  caller: { label: 'Favors the caller', cls: 'bg-gold-soft text-gold-ink' },
  neutral: { label: 'Neutral — favors neither', cls: 'bg-surface-inset text-ink-body' },
}

export default function RangeFavorVisual() {
  const [idx, setIdx] = useState(0)
  const ex = EXAMPLES[idx]
  const f = favorFlop(ex.flop)
  const verdict = FAVOR[f.favor]

  const next = () => setIdx((i) => (i + 1) % EXAMPLES.length)

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-heading">Whose range does it favor?</div>
          <div className="truncate text-xs text-ink-muted">{SCENARIO.text}</div>
        </div>
        <span className="rounded-full border border-line px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
          Rule of thumb
        </span>
      </div>

      {/* The flop */}
      <div className="mt-4 flex justify-center gap-2">
        {ex.flop.map((c) => (
          <Card key={c} card={c} size="md" />
        ))}
      </div>

      {/* The heuristic's verdict */}
      <div className="mt-4 flex justify-center">
        <span className={`rounded-lg px-4 py-2 text-sm font-bold ${verdict.cls}`}>{verdict.label}</span>
      </div>

      {/* The heuristic's own one-line reason */}
      <p className="mt-4 text-sm leading-relaxed text-ink-body">{f.why}</p>

      <button
        onClick={next}
        className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-onfelt transition hover:bg-accent-hover"
      >
        Next example →
      </button>

      <p className="mt-3 text-center text-xs text-ink-muted">
        A heuristic tuned for the raiser-vs-caller spot — the same one the Range Interaction drill uses. Real spots
        have shades of grey.
      </p>
    </div>
  )
}
