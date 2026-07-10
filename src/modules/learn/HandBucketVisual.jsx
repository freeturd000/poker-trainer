// Learn visual — the live hand-strength bucketer (Phase 4).
//
// Renders a hand + board with the shared <Card /> and shows the EXACT action
// bucket the Postflop Trainer's real analyzeHand() assigns (value / draw /
// marginal / air). Nothing here re-derives strength: the bucket comes straight
// from analyzeHand, so this visual matches the trainer by construction. The short
// "why" is built only from that same analysis object's own fields (made-hand
// description, draw flags, outs) — it describes the result, it never decides it.

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { analyzeHand } from '../../modules/postflop-trainer/handStrength.js'

// Clear archetype per bucket. hole+board are illustrative layouts only — the bucket
// and description shown are computed live from analyzeHand at render time.
const EXAMPLES = [
  { hole: ['Ad', 'Kc'], board: ['Ks', '7d', '2c'], note: 'Top pair' },
  { hole: ['Ah', 'Qh'], board: ['Kh', '7h', '2c'], note: 'Flush draw' },
  { hole: ['8h', '5s'], board: ['9s', '8d', '2c'], note: 'Middle pair' },
  { hole: ['Ah', 'Qd'], board: ['9s', '7d', '2c'], note: 'No pair, no draw' },
]

// Per-bucket chrome — all theme tokens, so it reads in light and dark.
const BUCKET_STYLE = {
  value: { label: 'VALUE', cls: 'bg-accent-soft text-accent-text' },
  draw: { label: 'DRAW', cls: 'bg-gold-soft text-gold-ink' },
  marginal: { label: 'MARGINAL', cls: 'bg-surface-inset text-ink-body' },
  air: { label: 'AIR', cls: 'bg-danger-soft text-danger-text' },
}

// A plain-English "why", assembled purely from analyzeHand's own output fields.
// This is presentation only — the bucket it explains was decided by analyzeHand.
function bucketWhy(a) {
  switch (a.bucket) {
    case 'value':
      return a.strongValue
        ? `${a.madeDescr} — a strong made hand (two pair or better) that wants to build the pot.`
        : `${a.madeDescr} — a top pair or overpair: strong enough to bet for value.`
    case 'draw': {
      const parts = []
      if (a.flushDraw) parts.push('a flush draw')
      if (a.straightDraw) parts.push('an open-ended straight draw')
      return `Only ${a.madeDescr.toLowerCase()} made, but ${parts.join(' + ')} (~${a.outs} outs) — play it for its equity, not its showdown value.`
    }
    case 'marginal':
      return `${a.madeDescr} — a weak pair with some showdown value but too fragile to build a big pot.`
    default:
      return `${a.madeDescr}${a.gutshot ? ' with only a gutshot' : ''} — no pair and no strong draw; nothing to bet for value.`
  }
}

export default function HandBucketVisual() {
  const [idx, setIdx] = useState(0)
  const ex = EXAMPLES[idx]
  const a = analyzeHand(ex.hole, ex.board)
  const style = BUCKET_STYLE[a.bucket]

  const next = () => setIdx((i) => (i + 1) % EXAMPLES.length)

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-heading">Hand-strength bucket</div>
          <div className="truncate text-xs text-ink-muted">{ex.note}</div>
        </div>
        <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${style.cls}`}>{style.label}</span>
      </div>

      {/* Hand + board */}
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

      {/* The analyzer's own "why" */}
      <p className="mt-4 text-sm leading-relaxed text-ink-body">{bucketWhy(a)}</p>

      <button
        onClick={next}
        className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-onfelt transition hover:bg-accent-hover"
      >
        Next example →
      </button>

      <p className="mt-3 text-center text-xs text-ink-muted">
        Buckets come straight from the Postflop Trainer's analyzer — the same one every drill in this module reasons
        from.
      </p>
    </div>
  )
}
