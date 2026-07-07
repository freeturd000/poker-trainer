import { useState } from 'react'
import Card from './components/Card.jsx'
import { createDeck, shuffle, deal } from './engine/deck.js'
import { getProgress, recordAttempt, getLeaks, recordLeak, getLeakWeight, remove } from './store'

// ⚠️ TEMPORARY DEMO — throwaway harness to visually confirm the card model,
// deck utilities, <Card /> renderer, and the /store layer work. Delete this
// whole file's body when the real dashboard (Section 5) is built.

const DEMO_MODULE = 'demo'
const DEMO_LEAKS = ['UTG_open_72o', 'BTN_vs_3bet_overfold', 'SB_limp']

function dealFive() {
  const { cards } = deal(shuffle(createDeck()), 5)
  return cards
}

export default function App() {
  const [hand, setHand] = useState(dealFive)

  // --- temporary store-persistence panel state ---
  const [progress, setProgress] = useState(() => getProgress(DEMO_MODULE))
  const [leaks, setLeaks] = useState(() => getLeaks())

  const refresh = () => {
    setProgress(getProgress(DEMO_MODULE))
    setLeaks(getLeaks())
  }

  const hit = (correct) => {
    recordAttempt(DEMO_MODULE, { correct })
    if (!correct) {
      const tag = DEMO_LEAKS[Math.floor(Math.random() * DEMO_LEAKS.length)]
      recordLeak(tag, { note: 'demo miss' })
    }
    refresh()
  }

  const resetDemo = () => {
    remove(`progress:${DEMO_MODULE}`)
    remove('leaks')
    refresh()
  }

  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-white text-2xl font-semibold">Card renderer demo (temporary)</h1>
        <div className="flex gap-3">
          {hand.map((c) => (
            <Card key={c} card={c} size="lg" />
          ))}
          <Card faceDown size="lg" />
        </div>
        <button
          onClick={() => setHand(dealFive)}
          className="rounded-lg bg-white px-4 py-2 font-medium text-green-900 shadow hover:bg-gray-100"
        >
          Deal 5 new
        </button>
      </div>

      {/* ⚠️ TEMPORARY store-persistence panel — reload the page to confirm the
          numbers below survive (they are read from localStorage on mount). */}
      <div className="w-full max-w-md rounded-xl bg-white/95 p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-green-900">Store persistence check (temporary)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Record some attempts, then <strong>reload the page</strong> — these should persist.
        </p>

        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
          <div className="font-medium">Progress · module “{DEMO_MODULE}”</div>
          <div>
            attempts {progress.attempts} · correct {progress.correct} · accuracy{' '}
            {progress.accuracy.toFixed(0)}%
          </div>
          <div>
            streak {progress.streak} · best {progress.bestStreak} · last{' '}
            {progress.lastPlayed ? new Date(progress.lastPlayed).toLocaleTimeString() : '—'}
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
          <div className="font-medium">Leaks (worst first)</div>
          {leaks.length === 0 ? (
            <div className="text-gray-500">none yet</div>
          ) : (
            <ul className="mt-1 space-y-0.5">
              {leaks.map((l) => (
                <li key={l.tag} className="flex justify-between">
                  <span>{l.tag}</span>
                  <span className="tabular-nums text-gray-600">
                    ×{l.count} · weight {getLeakWeight(l.tag)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => hit(true)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Record correct
          </button>
          <button
            onClick={() => hit(false)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Record wrong (+leak)
          </button>
          <button
            onClick={resetDemo}
            className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-300"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  )
}
