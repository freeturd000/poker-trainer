// Top-bar navigation across the home dashboard and the trainers built so far.
// The Dashboard (CLAUDE.md §5) is the landing view; the nav bar is always present
// so any trainer is one tap from home and vice-versa. A light/dark theme toggle
// lives at the right of the bar (defaults to dark, persisted via the store).

import { useState } from 'react'
import Dashboard from './dashboard/Dashboard.jsx'
import Learn from './modules/learn/Learn.jsx'
import RangeTrainer from './modules/range-trainer/RangeTrainer.jsx'
import OddsTrainer from './modules/odds-trainer/OddsTrainer.jsx'
import BoardReader from './modules/board-reader/BoardReader.jsx'
import PostflopTrainer from './modules/postflop-trainer/PostflopTrainer.jsx'
import Simulator from './modules/simulator/Simulator.jsx'
import ConceptDeck from './modules/concept-deck/ConceptDeck.jsx'
import LiveToolkit from './modules/live-toolkit/LiveToolkit.jsx'
import ReferenceDrawer from './components/ReferenceDrawer.jsx'
import { getTheme, setTheme } from './store/theme.js'

// Views where you're mid-session and may want to look something up without leaving:
// the drills and the simulator. The reference drawer button shows only on these.
const REFERENCE_VIEWS = new Set(['range', 'odds', 'board', 'postflop', 'simulator'])

// Concise tab labels keep the 8-item bar scannable and let it fit a phone width.
// Dashboard leads (home), then the trainers in build order, then the tools.
const VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'learn', label: 'Learn' },
  { id: 'range', label: 'Range' },
  { id: 'odds', label: 'Odds' },
  { id: 'board', label: 'Board' },
  { id: 'postflop', label: 'Postflop' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'concept', label: 'Concept' },
  { id: 'live', label: 'Live' },
]

// Small sun/moon control: flips the theme, persists it, and re-applies the
// `data-theme` attribute (all handled by the store's setTheme).
function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      onClick={onToggle}
      className="shrink-0 rounded-lg p-1.5 text-lg leading-none text-onfelt-2 transition hover:bg-panel/60 hover:text-onfelt"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

export default function App() {
  const [view, setView] = useState('dashboard')
  const [theme, setThemeState] = useState(() => getTheme())
  // Reference drawer visibility. Lives here (above the views) so it floats over any
  // trainer/sim without that trainer knowing or resetting. Toggling it never
  // re-renders or resets the active drill.
  const [refOpen, setRefOpen] = useState(false)

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <div className="min-h-screen bg-felt">
      {/* Sticky top bar: brand doubles as a home shortcut; the tab row scrolls
          horizontally on a phone and wraps/centers from `sm` up. */}
      <header className="sticky top-0 z-20 border-b border-line-felt/60 bg-felt-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 sm:px-4">
          <button
            onClick={() => setView('dashboard')}
            className="flex shrink-0 items-center gap-1.5 pr-1 text-sm font-bold text-onfelt"
            aria-label="Poker Trainer home"
          >
            <span className="text-lg leading-none text-onfelt-4">♠</span>
            <span className="hidden sm:inline">Poker Trainer</span>
          </button>
          <nav className="pt-no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto sm:flex-wrap sm:justify-end">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? 'page' : undefined}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  view === v.id
                    ? 'bg-onfelt text-felt-deep shadow'
                    : 'text-onfelt-2 hover:bg-panel/60'
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
          {/* Unobtrusive reference affordance — only while training or in the sim,
              tucked in the top bar (never over the action controls). Opens the
              slide-out Learn/glossary drawer over the current view. */}
          {REFERENCE_VIEWS.has(view) && (
            <button
              onClick={() => setRefOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-onfelt-2 transition hover:bg-panel/60 hover:text-onfelt"
              aria-label="Open Learn reference"
              title="Learn & reference"
            >
              <span className="text-base leading-none" aria-hidden="true">📖</span>
              <span className="hidden sm:inline">Learn</span>
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {view === 'dashboard' && <Dashboard onNavigate={setView} />}
      {view === 'learn' && <Learn onNavigate={setView} />}
      {view === 'range' && <RangeTrainer />}
      {view === 'odds' && <OddsTrainer />}
      {view === 'board' && <BoardReader />}
      {view === 'postflop' && <PostflopTrainer />}
      {view === 'simulator' && <Simulator />}
      {view === 'concept' && <ConceptDeck />}
      {view === 'live' && <LiveToolkit />}

      {/* Slide-out Learn/reference drawer. Rendered once at the app root so it can
          float over any view; kept mounted for its open/close transition. */}
      <ReferenceDrawer open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  )
}
