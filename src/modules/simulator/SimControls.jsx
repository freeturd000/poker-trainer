// Hero action controls — renders ONLY the legal actions for the spot (from the
// engine's getLegalActions) and a bet/raise sizing widget that respects the
// engine's min/max, with quick ⅓ / ½ / ¾ / pot / all-in shortcuts.

import { useEffect, useState } from 'react'

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

export default function SimControls({ legal, pot, currentBet, onAct }) {
  const fold = legal.find((a) => a.type === 'fold')
  const check = legal.find((a) => a.type === 'check')
  const call = legal.find((a) => a.type === 'call')
  const bet = legal.find((a) => a.type === 'bet')
  const raise = legal.find((a) => a.type === 'raise')
  const aggr = raise || bet // at most one of these is offered at a time
  const isRaise = Boolean(raise)

  const [to, setTo] = useState(aggr ? aggr.min : 0)
  // Reset the slider whenever the offered sizing bounds change (new street/spot).
  useEffect(() => {
    if (aggr) setTo(aggr.min)
  }, [aggr?.type, aggr?.min, aggr?.max])

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
    <div className="rounded-2xl bg-emerald-950/60 p-4 shadow-lg">
      <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-emerald-300">
        Your action
      </div>

      {/* Bet / raise sizing */}
      {aggr && (
        <div className="mb-3 rounded-xl bg-emerald-900/60 p-3">
          <div className="mb-2 flex items-center justify-between text-sm text-emerald-100">
            <span>{isRaise ? 'Raise to' : 'Bet'}</span>
            <span className="text-lg font-bold tabular-nums text-white">{to}</span>
          </div>
          <input
            type="range"
            min={aggr.min}
            max={aggr.max}
            step={1}
            value={to}
            onChange={(e) => setTo(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FRACTIONS.map(([label, frac]) => (
              <button
                key={label}
                onClick={() => setTo(sizeFor(frac))}
                className="rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-700"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setTo(aggr.max)}
              className="rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-700"
            >
              All-in
            </button>
            <div className="ml-auto self-center text-[11px] text-emerald-400">
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
    </div>
  )
}

const TONES = {
  rose: 'bg-rose-600 hover:bg-rose-500',
  sky: 'bg-sky-600 hover:bg-sky-500',
  amber: 'bg-amber-500 hover:bg-amber-400 text-emerald-950',
}

function Btn({ children, onClick, tone }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition ${TONES[tone]}`}
    >
      {children}
    </button>
  )
}
