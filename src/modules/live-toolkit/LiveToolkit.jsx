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
    <div className="pt-screen">
      <div className="pt-rail">
        <header className="mb-4 text-center">
          <h1 className="pt-title">Live Play Toolkit</h1>
          <p className="mt-1 text-sm text-onfelt-2">
            Track sessions, manage your roll, and brush up on live etiquette
          </p>
        </header>

        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pt-toggle ${tab === t.id ? 'pt-toggle-on' : 'pt-toggle-off'}`}
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
