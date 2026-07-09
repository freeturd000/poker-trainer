// Learn visual — the 13×13 preflop range grid (ported from docs/poker-preflop-ranges.html).
//
// Reads the app's canonical RFI range data (read-only) so the chart shown while
// studying is exactly the chart the Range Trainer grades against — one source of
// truth, no invented ranges. Tap a position tab to see its opening range; tap any
// hand to see which seats open it. Styled to sit inside a white Learn article card.

import { useMemo, useState } from 'react'
import RANGES from '../../data/preflop-ranges-6max-cash.json'

// High → low, the standard chart axis order.
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
// Only the "raise or fold" opening seats (BB defends rather than opens).
const POS = ['UTG', 'HJ', 'CO', 'BTN', 'SB']
const POS_DESC = {
  UTG: 'Under the gun — first to act, tightest range',
  HJ: 'Hijack — one seat before the cutoff',
  CO: 'Cutoff — one seat before the button',
  BTN: 'Button — best seat, widest range',
  SB: 'Small blind — raise to steal, or fold',
}

// Combos per hand class, used to show the "opens X%" figure (52-card deck = 1326).
function combos(hand) {
  return hand.length === 2 ? 6 : hand[2] === 's' ? 4 : 12
}

// The 169 grid hands in row-major order: pairs on the diagonal, suited above it,
// offsuit below — higher rank first, matching the JSON token format.
function handAt(r, c) {
  if (r === c) return RANKS[r] + RANKS[r]
  if (r < c) return RANKS[r] + RANKS[c] + 's'
  return RANKS[c] + RANKS[r] + 'o'
}

export default function RangeGridVisual() {
  const [pos, setPos] = useState('BTN')
  const [selected, setSelected] = useState(null)

  // Precompute a Set of opening hands + the opened % for each position.
  const data = useMemo(() => {
    const out = {}
    for (const p of POS) {
      const hands = RANGES.positions[p] ?? []
      const set = new Set(hands)
      const pct = Math.round(hands.reduce((sum, h) => sum + combos(h), 0) / 1326 * 100)
      out[p] = { set, pct }
    }
    return out
  }, [])

  const cur = data[pos]

  // Which seats open the tapped hand, for the readout line.
  const opensInfo = useMemo(() => {
    if (!selected) return null
    const opens = POS.filter((p) => data[p].set.has(selected))
    return { opens }
  }, [selected, data])

  return (
    <div className="not-prose mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
      {/* Position tabs */}
      <div className="flex gap-1.5">
        {POS.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            className={`flex-1 rounded-lg px-1 py-2 text-sm font-semibold transition ${
              p === pos ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-gray-500">{POS_DESC[pos]}</p>
        <p className="text-sm font-semibold text-emerald-600">opens {cur.pct}% of hands</p>
      </div>

      {/* 13×13 grid — inline template since Tailwind ships no `grid-cols-13`. */}
      <div className="mt-3 grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
        {Array.from({ length: 13 }, (_, r) =>
          Array.from({ length: 13 }, (_, c) => {
            const hand = handAt(r, c)
            const isRaise = cur.set.has(hand)
            const isSel = hand === selected
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelected(hand)}
                className={`flex aspect-square items-center justify-center rounded-[3px] font-mono font-medium leading-none text-[clamp(7px,1.9vw,11px)] transition ${
                  isRaise ? 'bg-emerald-600 text-emerald-50' : 'bg-gray-100 text-gray-400'
                } ${isSel ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
              >
                {hand}
              </button>
            )
          })
        )}
      </div>

      {/* Readout */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <span className="min-w-[2.5rem] font-mono text-lg font-bold text-emerald-900">
          {selected ?? '—'}
        </span>
        <span className="text-sm leading-snug text-gray-600">
          {!selected ? (
            'Tap any hand to see which seats open it.'
          ) : opensInfo.opens.length === 0 ? (
            'Fold from every seat — below the opening threshold.'
          ) : opensInfo.opens.length === POS.length ? (
            <>
              <b className="font-semibold text-emerald-700">Raise from every seat</b> — a core hand you always open.
            </>
          ) : (
            <>
              Opens from <b className="font-semibold text-emerald-700">{opensInfo.opens.join(', ')}</b>. Folded from the earlier seats.
            </>
          )}
        </span>
      </div>

      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-600" /> Raise (open)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-gray-300 bg-gray-100" /> Fold
        </span>
      </div>
    </div>
  )
}
