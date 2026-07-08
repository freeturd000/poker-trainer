// Setup screen for the simulator: choose opponents (1–5), each bot's archetype,
// stack depth, and blind level. Play-money only — labelled clearly as practice.

import { useState } from 'react'

const ARCHES = [
  { id: 'random', name: 'Random' },
  { id: 'nit', name: 'Nit (tight-passive)' },
  { id: 'station', name: 'Calling station (loose-passive)' },
  { id: 'tag', name: 'TAG (tight-aggressive)' },
]

const BLINDS = [
  { sb: 1, bb: 2, label: '1 / 2' },
  { sb: 2, bb: 5, label: '2 / 5' },
  { sb: 5, bb: 10, label: '5 / 10' },
]

const DEPTHS = [50, 100, 200] // in big blinds

export default function SimSetup({ onStart, session }) {
  const [opponents, setOpponents] = useState(2)
  const [arches, setArches] = useState(['tag', 'station', 'random', 'random', 'random'])
  const [blindIdx, setBlindIdx] = useState(0)
  const [depthBB, setDepthBB] = useState(100)
  const [mode, setMode] = useState('auto') // 'auto' = bots act on a timer; 'step' = manual advance
  const [coach, setCoach] = useState(false) // plain-English guidance at each decision (default off)

  const setArch = (i, val) => setArches((a) => a.map((x, k) => (k === i ? val : x)))

  const start = () => {
    const { sb, bb } = BLINDS[blindIdx]
    onStart({
      opponents,
      archetypes: arches.slice(0, opponents),
      sb,
      bb,
      stack: depthBB * bb,
      depthBB,
      mode,
      coach,
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-emerald-800 p-6">
      <div className="w-full max-w-xl">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-white">Local Play Simulator</h1>
          <p className="mt-1 text-sm text-emerald-200">
            Play full hands against rule-based bots to drill mechanics, flow, and sizing.
          </p>
          <p className="mt-1 inline-block rounded-full bg-amber-400/90 px-3 py-0.5 text-xs font-bold text-emerald-950">
            PRACTICE · play-money only — no real stakes
          </p>
        </header>

        {session?.hands > 0 && (
          <div className="mb-4 rounded-xl bg-emerald-950/50 p-3 text-center text-sm text-emerald-100">
            Last session: <span className="font-bold">{session.hands}</span> hand
            {session.hands === 1 ? '' : 's'} · your net{' '}
            <span className={`font-bold ${session.heroNet >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {session.heroNet >= 0 ? '+' : ''}
              {session.heroNet}
            </span>
          </div>
        )}

        <div className="space-y-4 rounded-2xl bg-white/95 p-5 shadow-lg">
          {/* Opponents */}
          <Field label="Opponents">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip key={n} active={opponents === n} onClick={() => setOpponents(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Per-opponent archetype */}
          <Field label="Bot archetypes">
            <div className="space-y-2">
              {Array.from({ length: opponents }, (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 text-xs font-semibold text-gray-500">Bot {i + 1}</span>
                  <select
                    value={arches[i]}
                    onChange={(e) => setArch(i, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800"
                  >
                    {ARCHES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Field>

          {/* Blinds */}
          <Field label="Blind level (play-money)">
            <div className="flex gap-2">
              {BLINDS.map((b, i) => (
                <Chip key={b.label} active={blindIdx === i} onClick={() => setBlindIdx(i)}>
                  {b.label}
                </Chip>
              ))}
            </div>
          </Field>

          {/* Advance mode */}
          <Field label="How the action advances">
            <div className="flex gap-2">
              <Chip active={mode === 'auto'} onClick={() => setMode('auto')}>
                Auto-play
              </Chip>
              <Chip active={mode === 'step'} onClick={() => setMode('step')}>
                Step through
              </Chip>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {mode === 'auto'
                ? 'Bots act automatically on a short timer.'
                : 'Bots and each dealt street pause for a "Next" click so you can read every step.'}
            </p>
          </Field>

          {/* Coach mode */}
          <Field label="Coach mode">
            <div className="flex gap-2">
              <Chip active={!coach} onClick={() => setCoach(false)}>
                Off
              </Chip>
              <Chip active={coach} onClick={() => setCoach(true)}>
                On
              </Chip>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {coach
                ? 'Plain-English coaching: reads opponents’ actions, suggests your play, and recaps each hand. Great paired with Step through.'
                : 'A guided tutorial with beginner-friendly explanations at every decision. Off by default.'}
            </p>
          </Field>

          {/* Depth */}
          <Field label="Starting stack">
            <div className="flex gap-2">
              {DEPTHS.map((d) => (
                <Chip key={d} active={depthBB === d} onClick={() => setDepthBB(d)}>
                  {d} BB
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              = {depthBB * BLINDS[blindIdx].bb} chips at {BLINDS[blindIdx].label}
            </p>
          </Field>

          <button
            onClick={start}
            className="w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white shadow hover:bg-emerald-500"
          >
            Deal first hand
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold text-emerald-900">{label}</div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      }`}
    >
      {children}
    </button>
  )
}
