// Learn visual — the live bankroll calculator (Phase 6).
//
// Lets the reader enter a bankroll and see which cash stakes it's safely rolled
// for. Every number here comes from the Live Toolkit's real bankroll logic
// (evaluateStake / recommendedStake / statusMeta and the MIN_BUYINS /
// COMFORTABLE_BUYINS / STAKES constants in ../live-toolkit/stakes.js), so this
// matches the Bankroll Manager by construction — nothing is reimplemented. Local
// state only: it never touches the stored bankroll, so playing with the slider
// here can't change the toolkit's saved roll.

import { useState } from 'react'
import {
  evaluateStake,
  recommendedStake,
  statusMeta,
  MIN_BUYINS,
  COMFORTABLE_BUYINS,
  STAKES,
} from '../../modules/live-toolkit/stakes.js'
import { money } from '../../modules/live-toolkit/format.js'

// Beginner-relevant lower stakes (the ones Phase 6 frames a first live session
// around). These ids are a subset of the toolkit's STAKES — numbers still come
// from evaluateStake, so they stay identical to the Bankroll Manager.
const SHOWN_IDS = ['1-2', '1-3', '2-5']
const SHOWN_STAKES = STAKES.filter((s) => SHOWN_IDS.includes(s.id))

const STEP = 500

// Same tone → token mapping the Bankroll Manager uses, so badges read identically.
const BADGE_TONE = {
  good: 'bg-accent-soft text-accent-text',
  warn: 'bg-gold-soft text-gold-ink',
  bad: 'bg-danger-soft text-danger-text',
}

// Headline block chrome by recommended-stake status.
const HEADLINE_TONE = {
  comfortable: 'bg-accent-soft text-accent-text',
  minimum: 'bg-gold-soft text-gold-ink',
  under: 'bg-danger-soft text-danger-text',
}

export default function BankrollCalcVisual() {
  const [draft, setDraft] = useState('5000')
  const bankroll = Math.max(0, Number(draft) || 0)

  const rec = recommendedStake(bankroll)
  const step = (delta) => setDraft(String(Math.max(0, (Number(draft) || 0) + delta)))

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      <div className="text-sm font-bold text-ink-heading">Bankroll calculator</div>
      <p className="mt-0.5 text-xs text-ink-muted">
        A craft rule for playing within your means — not an income plan.
      </p>

      {/* Enter / adjust the roll */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={() => step(-STEP)}
          aria-label="Decrease bankroll"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-inset text-xl font-bold text-ink-body transition hover:bg-surface-raised"
        >
          −
        </button>
        <div className="flex items-center rounded-lg border border-line-strong bg-surface px-3 py-2">
          <span className="mr-1 text-lg font-bold text-ink-muted">$</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step={STEP}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="5000"
            className="w-28 bg-transparent text-lg font-bold text-ink tabular-nums focus:outline-none"
          />
        </div>
        <button
          onClick={() => step(STEP)}
          aria-label="Increase bankroll"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-inset text-xl font-bold text-ink-body transition hover:bg-surface-raised"
        >
          +
        </button>
      </div>

      {/* Headline recommendation */}
      <div className={`mt-4 rounded-lg p-3 text-center text-sm font-semibold ${bankroll > 0 && rec ? HEADLINE_TONE[rec.status] : bankroll > 0 ? HEADLINE_TONE.under : 'bg-surface-inset text-ink-body'}`}>
        {bankroll <= 0 ? (
          <span>Enter a bankroll to see which stakes fit.</span>
        ) : rec ? (
          <span>
            With {money(bankroll)} you’re{' '}
            {rec.status === 'comfortable'
              ? `comfortably rolled for ${rec.stake.label}`
              : `at the minimum for ${rec.stake.label}`}{' '}
            — {rec.buyIns.toFixed(0)} buy-ins
            {rec.status === 'minimum' ? ' (the edge; consider staying a touch below)' : ''}.
          </span>
        ) : (
          <span>
            With {money(bankroll)} you’re under-rolled for even {STAKES[0].label}. You want at least{' '}
            {money(STAKES[0].buyIn * MIN_BUYINS)} ({MIN_BUYINS} buy-ins) to sit — build the roll or play
            smaller/home games first.
          </span>
        )}
      </div>

      {/* Per-stake guide (numbers from evaluateStake) */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="px-2 py-1 font-semibold">Stake</th>
              <th className="px-2 py-1 font-semibold">Min roll</th>
              <th className="px-2 py-1 font-semibold">Comfortable</th>
              <th className="px-2 py-1 text-right font-semibold">Your status</th>
            </tr>
          </thead>
          <tbody>
            {SHOWN_STAKES.map((stake) => {
              const { buyIns, status } = evaluateStake(bankroll, stake)
              const meta = statusMeta(status)
              return (
                <tr key={stake.id} className="border-t border-line">
                  <td className="px-2 py-2 font-semibold text-ink-heading">{stake.label}</td>
                  <td className="px-2 py-2 tabular-nums text-ink-body">{money(stake.buyIn * MIN_BUYINS)}</td>
                  <td className="px-2 py-2 tabular-nums text-ink-body">
                    {money(stake.buyIn * COMFORTABLE_BUYINS)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONE[meta.tone]}`}>
                      {meta.label}
                      {bankroll > 0 && status !== 'under' ? ` · ${buyIns.toFixed(0)}bi` : ''}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ink-muted">
        Standard used: buy-in = {money(STAKES[0].buyIn)} (100 big blinds) at {STAKES[0].label} · {MIN_BUYINS} buy-ins
        minimum · {COMFORTABLE_BUYINS}+ comfortable. Anything marked{' '}
        <span className="font-semibold text-danger">Under-rolled</span> is above your roll — the variance can bust you,
        so move up only once a stake shows Rolled. Same math as the Live Toolkit’s Bankroll Manager.
      </p>
    </div>
  )
}
