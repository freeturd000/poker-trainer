// Learn visual — the live c-bet decision helper (Phase 4).
//
// Frames hero as the preflop raiser, renders a hand + flop, and shows the exact
// recommendation the Postflop Trainer's real cbetDecision() gives (bet or check)
// with its one-line reason — plus the real sizingDecision() size when it says bet.
// Nothing is reimplemented: the bucket comes from analyzeHand, texture (wet /
// wetness) and range advantage (favor) from the Board Reader, exactly as the C-bet
// drill's generator composes them. Framed as heuristic default lines, matching the
// trainer's framing.

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { analyzeHand } from '../../modules/postflop-trainer/handStrength.js'
import { cbetDecision, sizingDecision } from '../../modules/postflop-trainer/heuristics.js'
import { classifyTexture } from '../../modules/board-reader/texture.js'
import { favorFlop } from '../../modules/board-reader/rangeInteraction.js'

// Illustrative spots covering the shape of the rule. hole/board are layouts only —
// every action, reason, and size below is computed live from the real functions.
const EXAMPLES = [
  { hole: ['Ad', 'Kc'], board: ['Ks', '7d', '2c'], note: 'Value on a dry board' },
  { hole: ['9d', '8c'], board: ['9s', '8h', '7h'], note: 'Value on a very wet board' },
  { hole: ['Ah', 'Qh'], board: ['9h', '8h', '2c'], note: 'Strong draw (semi-bluff)' },
  { hole: ['8h', '5s'], board: ['9s', '8d', '7c'], note: 'Weak pair on a wet board' },
  { hole: ['Ah', 'Qd'], board: ['Ks', '7d', '2c'], note: 'Air on a dry board' },
  { hole: ['Ah', 'Qd'], board: ['7s', '6d', '5c'], note: 'Air on a low, connected board' },
]

const SIZE_LABEL = { '1/3': '⅓ pot', '1/2': '½ pot', '3/4': '¾ pot', pot: 'Pot-sized' }

export default function CbetHelperVisual() {
  const [idx, setIdx] = useState(0)
  const ex = EXAMPLES[idx]

  // Compose exactly as the C-bet drill's generator does.
  const tex = classifyTexture(ex.board)
  const fav = favorFlop(ex.board)
  const a = analyzeHand(ex.hole, ex.board)
  const dec = cbetDecision({ bucket: a.bucket, wet: tex.wet, favor: fav.favor })
  const isBet = dec.action === 'cbet'
  const role = a.bucket === 'value' ? 'value' : 'bluff'
  const size = isBet ? sizingDecision({ wetness: tex.wetness, role }).size : null

  const next = () => setIdx((i) => (i + 1) % EXAMPLES.length)

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-heading">You’re the preflop raiser</div>
          <div className="truncate text-xs text-ink-muted">{ex.note}</div>
        </div>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
          Heuristic
        </span>
      </div>

      {/* Hand + flop */}
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-ink-muted">Your hand</span>
          <div className="flex gap-1.5">
            {ex.hole.map((c) => (
              <Card key={c} card={c} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs uppercase tracking-wide text-ink-muted">Flop</span>
          <div className="flex gap-1.5">
            {ex.board.map((c) => (
              <Card key={c} card={c} size="sm" />
            ))}
          </div>
        </div>
      </div>

      {/* The heuristic's recommendation */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span
          className={`rounded-lg px-4 py-2 text-sm font-bold ${
            isBet ? 'bg-accent-soft text-accent-text' : 'bg-surface-inset text-ink-body'
          }`}
        >
          {isBet ? 'C-BET' : 'CHECK'}
        </span>
        {isBet && (
          <span className="rounded-lg bg-gold-soft px-3 py-2 text-sm font-bold text-gold-ink">{SIZE_LABEL[size]}</span>
        )}
      </div>

      {/* The heuristic's own one-line reason */}
      <p className="mt-4 text-sm leading-relaxed text-ink-body">{dec.why}</p>

      <button
        onClick={next}
        className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-onfelt transition hover:bg-accent-hover"
      >
        Next spot →
      </button>

      <p className="mt-3 text-center text-xs text-ink-muted">
        Heuristic default lines, not GTO-perfect — the exact call (and size) the C-bet Decision drill grades you
        against.
      </p>
    </div>
  )
}
