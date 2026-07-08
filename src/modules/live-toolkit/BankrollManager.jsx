// Bankroll manager (CLAUDE.md §4 Module 7, part 2).
//
// Set/track the current bankroll, then see which cash stakes it's safely rolled for
// using the conservative standard documented in ./stakes.js (buy-in = 100bb; 20
// buy-ins minimum, 30+ comfortable). Shows a headline recommendation, a per-stake
// guide with clear status badges, and a plain warning about playing above the roll.
//
// Bankroll is MANUALLY managed — it is the single source of truth and is NOT auto-
// updated from logged sessions. As a convenience, a button can pre-fill the editor
// with (current roll + lifetime session net); nothing is saved until you press Save,
// so sessions can never silently move your roll or double-count.

import { useState } from 'react'
import { getBankroll, setBankroll, getSessions } from '../../store'
import {
  evaluateAll,
  recommendedStake,
  statusMeta,
  MIN_BUYINS,
  COMFORTABLE_BUYINS,
  STAKES,
} from './stakes.js'
import { computeSessionStats } from './stats.js'
import { money, signedMoney, profitColor } from './format.js'

const BADGE_TONE = {
  good: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  bad: 'bg-rose-100 text-rose-700',
}

const ROW_TONE = {
  comfortable: 'bg-emerald-50',
  minimum: 'bg-amber-50',
  under: 'bg-white',
}

export default function BankrollManager() {
  const [bankroll, setRoll] = useState(() => getBankroll())
  const [draft, setDraft] = useState(() => String(getBankroll() || ''))

  const sessionNet = computeSessionStats(getSessions()).totalProfit
  const rows = evaluateAll(bankroll)
  const rec = recommendedStake(bankroll)

  const save = () => {
    const n = Number(draft)
    const next = setBankroll(Number.isFinite(n) && n > 0 ? n : 0)
    setRoll(next)
    setDraft(String(next || ''))
  }

  // Convenience: pre-fill (not save) the editor with roll + lifetime session net.
  const applyNet = () => setDraft(String(Math.max(0, Math.round(bankroll + sessionNet))))

  return (
    <div className="flex flex-col gap-6">
      {/* Set bankroll */}
      <div className="rounded-2xl bg-white/95 p-5 shadow-lg">
        <div className="text-sm font-semibold text-gray-800">Current bankroll</div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Amount ($)
            </span>
            <div className="flex items-center">
              <span className="mr-1 text-lg font-bold text-gray-500">$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="5000"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </label>
          <button
            onClick={save}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-emerald-500"
          >
            Save
          </button>
        </div>

        {getSessions().length > 0 && (
          <button
            onClick={applyNet}
            className="mt-3 text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            Use logged session net ({signedMoney(sessionNet)}) → {money(bankroll + sessionNet)}
          </button>
        )}
        <p className="mt-2 text-[11px] text-gray-400">
          Your bankroll is set manually and isn't changed automatically by logged sessions. The
          link above only fills the box — press Save to commit.
        </p>
      </div>

      {/* Headline recommendation */}
      <div className="rounded-2xl bg-emerald-950/40 p-5 text-center shadow-lg">
        <div className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Rolled for
        </div>
        {bankroll <= 0 ? (
          <p className="mt-2 text-emerald-100">Set your bankroll above to see which stakes fit.</p>
        ) : rec ? (
          <>
            <div className="mt-1 text-3xl font-bold text-white">{rec.stake.label}</div>
            <div className={`mt-1 text-sm font-semibold ${rec.status === 'comfortable' ? 'text-emerald-200' : 'text-amber-200'}`}>
              {rec.status === 'comfortable'
                ? `Comfortably rolled — ${rec.buyIns.toFixed(0)} buy-ins`
                : `Minimum roll — ${rec.buyIns.toFixed(0)} buy-ins (consider staying a touch below)`}
            </div>
            <p className="mt-2 text-xs text-emerald-300">
              Standard used: buy-in = 100 big blinds · {MIN_BUYINS} buy-ins minimum ·{' '}
              {COMFORTABLE_BUYINS}+ comfortable.
            </p>
          </>
        ) : (
          <>
            <div className="mt-1 text-xl font-bold text-white">
              Under-rolled for {STAKES[0].label}
            </div>
            <p className="mt-1 text-sm text-amber-200">
              You want at least {money(STAKES[0].buyIn * MIN_BUYINS)} ({MIN_BUYINS} buy-ins) to sit
              at {STAKES[0].label}. Build the roll or play smaller/home games first.
            </p>
          </>
        )}
      </div>

      {/* Per-stake guide */}
      <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
        <div className="mb-2 px-1 text-sm font-semibold text-gray-800">Stakes guide</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-2 py-1 font-semibold">Stake</th>
                <th className="px-2 py-1 font-semibold">Buy-in</th>
                <th className="px-2 py-1 font-semibold">Min roll</th>
                <th className="px-2 py-1 font-semibold">Comfortable</th>
                <th className="px-2 py-1 text-right font-semibold">Your status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ stake, buyIns, status }) => {
                const meta = statusMeta(status)
                return (
                  <tr key={stake.id} className={`border-t border-gray-100 ${ROW_TONE[status]}`}>
                    <td className="px-2 py-2 font-semibold text-gray-800">{stake.label}</td>
                    <td className="px-2 py-2 tabular-nums text-gray-600">{money(stake.buyIn)}</td>
                    <td className="px-2 py-2 tabular-nums text-gray-600">
                      {money(stake.buyIn * MIN_BUYINS)}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-gray-600">
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
        {bankroll > 0 && rec && rec.stake.id !== STAKES[STAKES.length - 1].id && (
          <p className="mt-3 px-1 text-xs text-gray-500">
            ⚠️ Anything marked <span className="font-semibold text-rose-600">Under-rolled</span> is
            above your roll — the variance can bust you. Move up only once a stake shows Rolled.
          </p>
        )}
      </div>

      {/* Net context */}
      {getSessions().length > 0 && (
        <p className="text-center text-xs text-emerald-300">
          Lifetime logged result:{' '}
          <span className={`font-bold ${profitColor(sessionNet)}`}>{signedMoney(sessionNet)}</span>{' '}
          across your sessions.
        </p>
      )}
    </div>
  )
}
