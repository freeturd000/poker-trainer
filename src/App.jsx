// Simple top-bar switch between the two trainers built so far. The real dashboard
// (CLAUDE.md §5) comes later — this is just basic nav so both modules are reachable.

import { useState } from 'react'
import RangeTrainer from './modules/range-trainer/RangeTrainer.jsx'
import OddsTrainer from './modules/odds-trainer/OddsTrainer.jsx'

const TABS = [
  { id: 'range', label: 'Range Trainer', Component: RangeTrainer },
  { id: 'odds', label: 'Odds Trainer', Component: OddsTrainer },
]

export default function App() {
  const [tab, setTab] = useState('range')
  const Active = TABS.find((t) => t.id === tab).Component

  return (
    <div className="bg-emerald-800">
      <nav className="flex justify-center gap-2 bg-emerald-950 px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-white text-emerald-900'
                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <Active />
    </div>
  )
}
