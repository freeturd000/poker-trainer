// Hero action controls — renders ONLY the legal actions for the spot (from the
// engine's getLegalActions) and a bet/raise sizing widget that respects the
// engine's min/max, with quick ⅓ / ½ / ¾ / pot / all-in shortcuts.

import { useEffect, useState } from 'react'
import Term from '../../components/Term.jsx'

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

export default function SimControls({ legal, pot, currentBet, onAct, presetAmount = null }) {
  const fold = legal.find((a) => a.type === 'fold')
  const check = legal.find((a) => a.type === 'check')
  const call = legal.find((a) => a.type === 'call')
  const bet = legal.find((a) => a.type === 'bet')
  const raise = legal.find((a) => a.type === 'raise')
  const aggr = raise || bet // at most one of these is offered at a time
  const isRaise = Boolean(raise)

  // Start at the coach's recommended amount when one is offered, else the minimum.
  const [to, setTo] = useState(aggr ? (presetAmount ?? aggr.min) : 0)
  // Reset the slider whenever the offered sizing bounds — or the coach's suggested
  // amount — change (a new street/spot). The user can still drag freely afterward:
  // this only sets the STARTING value, exactly like the old min default.
  useEffect(() => {
    if (aggr) setTo(presetAmount ?? aggr.min)
  }, [aggr?.type, aggr?.min, aggr?.max, presetAmount])

  // Fraction-of-pot sizing → a legal TO-amount. For a raise the fraction is added
  // on top of the current bet; for an open bet it's a fraction of the pot.
  const sizeFor = (frac) => {
    const base = isRaise ? currentBet + Math.round(pot * frac) : Math.round(pot * frac)
    return clamp(base, aggr.min, aggr.max)
  }

  const FRACTIONS = [
    ['⅓', 1 / 3],
    ['½', 1 / 2],
    ['¾', 3 / 4],
    ['Pot', 1],
  ]

  return (
    <div className="rounded-2xl bg-panel/60 p-4 shadow-lg">
      <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-onfelt-3">
        Your action
      </div>

      {/* Bet / raise sizing */}
      {aggr && (
        <div className="mb-3 rounded-xl bg-panel/60 p-3">
          <div className="mb-2 flex items-center justify-between text-sm text-onfelt-2">
            <span>{isRaise ? 'Raise to' : 'Bet'}</span>
            <span className="text-lg font-bold tabular-nums text-onfelt">{to}</span>
          </div>
          <input
            type="range"
            min={aggr.min}
            max={aggr.max}
            step={1}
            value={to}
            onChange={(e) => setTo(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FRACTIONS.map(([label, frac]) => (
              <button
                key={label}
                onClick={() => setTo(sizeFor(frac))}
                className="rounded-md bg-felt px-2.5 py-1 text-xs font-semibold text-onfelt-2 hover:bg-felt-rail"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setTo(aggr.max)}
              className="rounded-md bg-felt px-2.5 py-1 text-xs font-semibold text-onfelt-2 hover:bg-felt-rail"
            >
              All-in
            </button>
            <div className="ml-auto self-center text-[11px] text-onfelt-4">
              min {aggr.min} · max {aggr.max}
            </div>
          </div>
        </div>
      )}

      {/* Primary action buttons — only the legal ones are shown */}
      <div className="flex flex-wrap justify-center gap-2">
        {fold && (
          <Btn onClick={() => onAct({ type: 'fold' })} tone="rose">
            Fold
          </Btn>
        )}
        {check && (
          <Btn onClick={() => onAct({ type: 'check' })} tone="sky">
            Check
          </Btn>
        )}
        {call && (
          <Btn onClick={() => onAct({ type: 'call', amount: call.amount })} tone="sky">
            Call {call.amount}
          </Btn>
        )}
        {aggr && (
          <Btn onClick={() => onAct({ type: aggr.type, amount: to })} tone="amber">
            {isRaise ? `Raise to ${to}` : `Bet ${to}`}
          </Btn>
        )}
      </div>

      {/* Subtle glossary legend — define each offered action without hijacking the
          buttons themselves (tapping a button must still act). */}
      <p className="mt-2 text-center text-[11px] text-onfelt-3">
        New here? Tap to define:{' '}
        {[
          fold && { id: 'fold', label: 'Fold' },
          check && { id: 'check', label: 'Check' },
          call && { id: 'call', label: 'Call' },
          bet && { id: 'bet', label: 'Bet' },
          raise && { id: 'raise', label: 'Raise' },
        ]
          .filter(Boolean)
          .map((a, i) => (
            <span key={a.id}>
              {i > 0 && ' · '}
              <Term id={a.id}>{a.label}</Term>
            </span>
          ))}
      </p>
    </div>
  )
}

const TONES = {
  rose: 'bg-danger hover:bg-danger-solid',
  sky: 'bg-info hover:bg-info',
  amber: 'bg-gold hover:bg-gold text-felt-deep',
}

function Btn({ children, onClick, tone }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-bold text-onfelt shadow transition ${TONES[tone]}`}
    >
      {children}
    </button>
  )
}
