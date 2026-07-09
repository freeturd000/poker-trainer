// Learn visual — the Rule of 2 and 4 demonstrator (Phase 2).
//
// Set the out count (stepper or a common-draw preset) and toggle one vs two cards
// to come; the estimate updates live as outs × multiplier. The multiplier comes
// from the Odds Trainer's own `ruleOf24Multiplier` (imported, not re-derived) so
// the convention matches the trainer exactly.

import { useState } from 'react'
import { ruleOf24Multiplier } from '../odds-trainer/drills.js'

// Common draws → their standard out counts, mirroring /src/data/draws.js.
const PRESETS = [
  { label: 'Flush', outs: 9 },
  { label: 'OESD', outs: 8 },
  { label: 'Gutshot', outs: 4 },
  { label: 'Overcards', outs: 6 },
  { label: 'Combo', outs: 15 },
]

export default function RuleOf24Demo() {
  const [outs, setOuts] = useState(9)
  const [cardsToCome, setCardsToCome] = useState(2) // 2 = flop (×4), 1 = turn (×2)

  const multiplier = ruleOf24Multiplier(cardsToCome) // ← identical to the Odds Trainer
  const estimate = outs * multiplier

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      {/* Outs stepper */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Outs</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOuts((o) => Math.max(1, o - 1))}
            aria-label="Fewer outs"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-inset text-lg font-bold text-accent-text transition hover:bg-accent-soft"
          >
            −
          </button>
          <div className="min-w-[2.5rem] text-center font-mono text-xl font-bold text-ink-heading">{outs}</div>
          <button
            onClick={() => setOuts((o) => Math.min(20, o + 1))}
            aria-label="More outs"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-inset text-lg font-bold text-accent-text transition hover:bg-accent-soft"
          >
            +
          </button>
        </div>
      </div>

      {/* Common-draw presets */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setOuts(p.outs)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              outs === p.outs ? 'bg-accent text-onfelt' : 'bg-surface-inset text-accent-text hover:bg-accent-soft'
            }`}
          >
            {p.label} ({p.outs})
          </button>
        ))}
      </div>

      {/* Cards-to-come toggle */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Cards to come</div>
        <div className="mt-1.5 flex gap-1.5">
          <button
            onClick={() => setCardsToCome(2)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition ${
              cardsToCome === 2 ? 'bg-accent text-onfelt' : 'bg-surface-inset text-accent-text hover:bg-accent-soft'
            }`}
          >
            Two (flop → river) ×4
          </button>
          <button
            onClick={() => setCardsToCome(1)}
            className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold transition ${
              cardsToCome === 1 ? 'bg-accent text-onfelt' : 'bg-surface-inset text-accent-text hover:bg-accent-soft'
            }`}
          >
            One (turn → river) ×2
          </button>
        </div>
      </div>

      {/* Live estimate */}
      <div className="mt-4 rounded-lg border border-line bg-surface-inset p-4 text-center">
        <div className="font-mono text-lg text-accent-text">
          {outs} × {multiplier} ={' '}
          <span className="text-2xl font-bold text-accent-text">≈ {estimate}%</span>
        </div>
        <div className="mt-1 text-xs text-accent-text">estimated chance to hit your draw</div>
      </div>
    </div>
  )
}
