// Module 7 — Live Play Toolkit (CLAUDE.md §4).
//
// The "Vegas bridge": everything that only matters in person. Three tabs —
// Session tracker, Bankroll manager, and a static Etiquette/mechanics reference.
// This file is just the tab shell + page frame; each tab is its own self-contained
// component reading/writing the shared /store (module id 'live-toolkit'). It's a
// reference/tracker, not a graded drill — see the dashboard note on zero readiness.

import { useState } from 'react'
import SessionTracker from './SessionTracker.jsx'
import BankrollManager from './BankrollManager.jsx'
import EtiquetteReference from './EtiquetteReference.jsx'

const TABS = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'bankroll', label: 'Bankroll' },
  { id: 'etiquette', label: 'Etiquette' },
]

export default function LiveToolkit() {
  const [tab, setTab] = useState('sessions')

  return (
    <div className="flex min-h-screen flex-col items-center bg-emerald-800 p-6">
      <div className="w-full max-w-2xl">
        <header className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-white">Live Play Toolkit</h1>
          <p className="mt-1 text-sm text-emerald-200">
            Track sessions, manage your roll, and brush up on live etiquette
          </p>
        </header>

        <div className="mb-6 flex justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold shadow transition ${
                tab === t.id
                  ? 'bg-white text-emerald-900'
                  : 'bg-emerald-700 text-emerald-50 hover:bg-emerald-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'sessions' && <SessionTracker />}
        {tab === 'bankroll' && <BankrollManager />}
        {tab === 'etiquette' && <EtiquetteReference />}
      </div>
    </div>
  )
}
