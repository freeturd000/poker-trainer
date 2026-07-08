// Top-bar navigation across the home dashboard and the trainers built so far.
// The Dashboard (CLAUDE.md §5) is the landing view; the nav bar is always present
// so any trainer is one tap from home and vice-versa.

import { useState } from 'react'
import Dashboard from './dashboard/Dashboard.jsx'
import RangeTrainer from './modules/range-trainer/RangeTrainer.jsx'
import OddsTrainer from './modules/odds-trainer/OddsTrainer.jsx'
import BoardReader from './modules/board-reader/BoardReader.jsx'
import PostflopTrainer from './modules/postflop-trainer/PostflopTrainer.jsx'
import Simulator from './modules/simulator/Simulator.jsx'
import ConceptDeck from './modules/concept-deck/ConceptDeck.jsx'

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'range', label: 'Range Trainer' },
  { id: 'odds', label: 'Odds Trainer' },
  { id: 'board', label: 'Board Reader' },
  { id: 'postflop', label: 'Postflop Trainer' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'concept', label: 'Concept Deck' },
]

export default function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="bg-emerald-800">
      <nav className="flex justify-center gap-2 bg-emerald-950 px-4 py-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              view === v.id
                ? 'bg-white text-emerald-900'
                : 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700'
            }`}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {view === 'dashboard' && <Dashboard onNavigate={setView} />}
      {view === 'range' && <RangeTrainer />}
      {view === 'odds' && <OddsTrainer />}
      {view === 'board' && <BoardReader />}
      {view === 'postflop' && <PostflopTrainer />}
      {view === 'simulator' && <Simulator />}
      {view === 'concept' && <ConceptDeck />}
    </div>
  )
}
