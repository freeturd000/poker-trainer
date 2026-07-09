// Learn visual — live pot-odds calculator (Phase 2).
//
// The user sets the pot (before the bet) and the bet with +/- steppers or quick
// bet-size presets; the panel live-displays the amount to call and the break-even
// equity needed. The equity comes from the Odds Trainer's OWN `requiredEquity`
// formula (imported, not re-derived) so this matches the trainer exactly. When the
// bet is a recognisable fraction of the pot, the matching shortcut chip lights up.

import { useState } from 'react'
import { requiredEquity } from '../odds-trainer/drills.js'

// The common bet-size shortcuts. `pct` is the exact break-even from the formula
// f/(1+2f) — shown so the user connects the fraction to the number to memorise.
const SHORTCUTS = [
  { label: '⅓', frac: 1 / 3, pct: 20 },
  { label: '½', frac: 1 / 2, pct: 25 },
  { label: '⅔', frac: 2 / 3, pct: 29 },
  { label: '¾', frac: 3 / 4, pct: 30 },
  { label: 'Pot', frac: 1, pct: 33 },
]

// A bet counts as "a ⅓-pot bet" (etc.) when it's within this fraction of the mark.
const MATCH_TOL = 0.04

function Stepper({ label, value, onChange, step, min }) {
  const set = (v) => onChange(Math.max(min, v))
  return (
    <div className="flex-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={() => set(value - step)}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-lg font-bold text-accent-text transition hover:bg-accent-soft"
        >
          −
        </button>
        <div className="min-w-[3.5rem] flex-1 text-center font-mono text-xl font-bold text-ink-heading">
          ${value}
        </div>
        <button
          onClick={() => set(value + step)}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-lg font-bold text-accent-text transition hover:bg-accent-soft"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function PotOddsCalc() {
  const [pot, setPot] = useState(50)
  const [bet, setBet] = useState(50)

  const call = bet // the bet is what you must call
  const potNow = pot + bet // pot after villain's bet
  const required = requiredEquity(pot, bet) // ← identical to the Odds Trainer
  const frac = pot > 0 ? bet / pot : 0

  // Which shortcut (if any) the current bet matches, for highlighting.
  const activeIdx = SHORTCUTS.findIndex((s) => Math.abs(frac - s.frac) <= MATCH_TOL)

  const setFraction = (f) => setBet(Math.max(1, Math.round(pot * f)))

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      {/* Steppers */}
      <div className="flex gap-4">
        <Stepper label="Pot (before bet)" value={pot} onChange={setPot} step={5} min={5} />
        <Stepper label="Opponent bets" value={bet} onChange={setBet} step={5} min={1} />
      </div>

      {/* Quick bet-size presets */}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Quick bet size (of pot)</div>
        <div className="mt-1.5 flex gap-1.5">
          {SHORTCUTS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setFraction(s.frac)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                i === activeIdx ? 'bg-accent text-onfelt' : 'bg-surface-inset text-accent-text hover:bg-accent-soft'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live result */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-surface p-3 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">To call</div>
          <div className="mt-0.5 font-mono text-2xl font-bold text-ink-heading">${call}</div>
          <div className="mt-0.5 text-xs text-ink-muted">to win the ${potNow} pot</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-inset p-3 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent-text">Equity needed</div>
          <div className="mt-0.5 font-mono text-2xl font-bold text-accent-text">{required.toFixed(1)}%</div>
          <div className="mt-0.5 text-xs text-accent-text">
            {call} ÷ ({call} + {potNow})
          </div>
        </div>
      </div>

      {/* Shortcut readout */}
      <p className="mt-3 text-center text-sm text-ink-body">
        {activeIdx >= 0 ? (
          <>
            That’s a <b className="font-semibold text-accent-text">{SHORTCUTS[activeIdx].label}-pot bet</b> — the
            shortcut says <b className="font-semibold text-accent-text">~{SHORTCUTS[activeIdx].pct}%</b>, and the exact
            figure is {required.toFixed(1)}%.
          </>
        ) : (
          <>Bigger bets relative to the pot demand more equity. Try a quick bet size above to see a shortcut light up.</>
        )}
      </p>
    </div>
  )
}
