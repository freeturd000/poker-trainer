// Session tracker (CLAUDE.md §4 Module 7, part 1).
//
// Log live sessions (date, location, stakes, buy-in, cash-out, hours), see a running
// list, and get lifetime stats (net P/L, hours, $/hr, biggest win/loss, win rate).
// Add / edit / delete entries. All persistence goes through the shared /store; this
// component owns only form + list UI state. Amounts are dollars; profit is derived.

import { useState } from 'react'
import { getSessions, addSession, updateSession, deleteSession } from '../../store'
import { computeSessionStats, sessionProfit } from './stats.js'
import { money, signedMoney, profitColor } from './format.js'

// Today's local date as YYYY-MM-DD, for the date input default.
function today() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const emptyForm = () => ({
  date: today(),
  location: '',
  stakes: '',
  buyIn: '',
  cashOut: '',
  hours: '',
})

// Coerce the form's string fields into a clean numeric record, or return an error.
function validate(form) {
  if (!form.date) return { error: 'Pick a date.' }
  const buyIn = Number(form.buyIn)
  const cashOut = Number(form.cashOut)
  const hours = Number(form.hours)
  if (!Number.isFinite(buyIn) || buyIn < 0) return { error: 'Buy-in must be $0 or more.' }
  if (!Number.isFinite(cashOut) || cashOut < 0) return { error: 'Cash-out must be $0 or more.' }
  if (!Number.isFinite(hours) || hours <= 0) return { error: 'Hours must be greater than 0.' }
  return {
    fields: {
      date: form.date,
      location: form.location.trim(),
      stakes: form.stakes.trim(),
      buyIn,
      cashOut,
      hours,
    },
  }
}

export default function SessionTracker() {
  const [sessions, setSessions] = useState(() => getSessions())
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(null)

  const stats = computeSessionStats(sessions)
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId(null)
    setError(null)
  }

  const submit = () => {
    const { error: err, fields } = validate(form)
    if (err) {
      setError(err)
      return
    }
    if (editingId) updateSession(editingId, fields)
    else addSession(fields)
    setSessions(getSessions())
    resetForm()
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setError(null)
    setConfirmingDelete(null)
    setForm({
      date: s.date,
      location: s.location ?? '',
      stakes: s.stakes ?? '',
      buyIn: String(s.buyIn),
      cashOut: String(s.cashOut),
      hours: String(s.hours),
    })
  }

  const remove = (id) => {
    deleteSession(id)
    setSessions(getSessions())
    setConfirmingDelete(null)
    if (editingId === id) resetForm()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Lifetime summary */}
      <div className="pt-card-dark p-5">
        <div className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Lifetime
        </div>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-200">
            No sessions logged yet — add your first one below to start tracking your win rate.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="Net P/L" value={signedMoney(stats.totalProfit)} tone={profitColor(stats.totalProfit)} />
            <Metric label="Hours" value={stats.totalHours.toFixed(1)} />
            <Metric
              label="$ / hour"
              value={`${stats.hourlyRate >= 0 ? '' : '−'}${money(stats.hourlyRate)}`}
              tone={profitColor(stats.hourlyRate)}
            />
            <Metric label="Biggest win" value={signedMoney(stats.biggestWin)} tone={profitColor(stats.biggestWin)} />
            <Metric label="Biggest loss" value={signedMoney(stats.biggestLoss)} tone={profitColor(stats.biggestLoss)} />
            <Metric
              label="Win rate"
              value={`${stats.winRate.toFixed(0)}%`}
              sub={`${stats.winningSessions}/${stats.count}`}
            />
          </div>
        )}
      </div>

      {/* Add / edit form */}
      <div className="pt-card p-5">
        <div className="text-sm font-semibold text-gray-800">
          {editingId ? 'Edit session' : 'Log a session'}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Date">
            <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
          </Field>
          <Field label="Location">
            <input
              type="text"
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. Bellagio"
              className={inputCls}
            />
          </Field>
          <Field label="Stakes">
            <input
              type="text"
              value={form.stakes}
              onChange={set('stakes')}
              placeholder="e.g. $1/$2"
              className={inputCls}
            />
          </Field>
          <Field label="Buy-in ($)">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.buyIn}
              onChange={set('buyIn')}
              placeholder="200"
              className={inputCls}
            />
          </Field>
          <Field label="Cash-out ($)">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={form.cashOut}
              onChange={set('cashOut')}
              placeholder="350"
              className={inputCls}
            />
          </Field>
          <Field label="Hours">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={form.hours}
              onChange={set('hours')}
              placeholder="4"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Live profit preview */}
        <ProfitPreview form={form} />

        {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={submit}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-emerald-500"
          >
            {editingId ? 'Save changes' : 'Add session'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-xl bg-gray-200 px-6 py-2.5 font-semibold text-gray-700 shadow hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="pt-card p-4">
          <div className="mb-1 px-1 text-sm font-semibold text-gray-800">
            Sessions ({sessions.length})
          </div>
          <ul className="divide-y divide-gray-100">
            {sessions.map((s) => {
              const p = sessionProfit(s)
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <span>{s.date}</span>
                      {s.stakes && <span className="text-gray-400">·</span>}
                      {s.stakes && <span className="text-gray-600">{s.stakes}</span>}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {s.location ? `${s.location} · ` : ''}
                      {money(s.buyIn)} → {money(s.cashOut)} · {Number(s.hours)}h
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`w-20 text-right text-sm font-bold tabular-nums ${profitColor(p)}`}>
                      {signedMoney(p)}
                    </span>
                    {confirmingDelete === s.id ? (
                      <>
                        <button
                          onClick={() => remove(s.id)}
                          className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-400"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(null)}
                          className="rounded-lg bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-300"
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(s)}
                          className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(s.id)}
                          className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-200"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500'

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
    </label>
  )
}

function Metric({ label, value, sub, tone = 'text-white' }) {
  return (
    <div>
      <div className={`text-xl font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-emerald-300">{label}</div>
      {sub && <div className="text-[11px] text-emerald-400">{sub}</div>}
    </div>
  )
}

// Shows the session's profit as you type, so the number is unambiguous before saving.
function ProfitPreview({ form }) {
  const buyIn = Number(form.buyIn)
  const cashOut = Number(form.cashOut)
  if (!Number.isFinite(buyIn) || !Number.isFinite(cashOut) || (form.buyIn === '' && form.cashOut === '')) {
    return null
  }
  const p = cashOut - buyIn
  return (
    <p className="mt-3 text-sm text-gray-600">
      Session result: <span className={`font-bold ${profitColor(p)}`}>{signedMoney(p)}</span>
    </p>
  )
}
