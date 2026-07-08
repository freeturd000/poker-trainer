// Collapsible hand-history panel for the simulator (CLAUDE.md §4 Module 5).
//
// Purely presentational: it renders the display objects produced by
// handHistory.describeHand() and owns no poker logic. Collapsed by default and
// placed under the table so it never crowds the play area. Shows the current
// in-progress hand (if any) on top, then the most-recent finished hands, newest
// first, in a bounded scroll area.

import { useState } from 'react'
import { parseCard } from '../../engine/card.js'

const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' }
const RED_SUITS = new Set(['h', 'd'])

// A compact coloured card token (e.g. K♣) for the dense log — lighter than the
// full <Card>, and keeps the record's raw card strings as the single source.
function CardToken({ card }) {
  const { rank, suit } = parseCard(card)
  return (
    <span
      className={`inline-block rounded bg-white/95 px-1 text-[11px] font-bold leading-5 ${
        RED_SUITS.has(suit) ? 'text-red-600' : 'text-gray-900'
      }`}
    >
      {rank}
      {SUIT_SYMBOL[suit]}
    </span>
  )
}

const Cards = ({ cards }) =>
  cards && cards.length ? (
    <span className="ml-1 inline-flex gap-0.5 align-middle">
      {cards.map((c) => (
        <CardToken key={c} card={c} />
      ))}
    </span>
  ) : null

// One hand, rendered as a small card: summary header + street lines + result.
function HandBlock({ h }) {
  const netCls = h.net == null ? 'text-emerald-300' : h.net >= 0 ? 'text-emerald-300' : 'text-rose-300'
  return (
    <div className="rounded-xl bg-emerald-950/60 p-3 ring-1 ring-emerald-900/50">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="text-xs font-bold text-emerald-100">
          {h.live ? 'Current hand' : `Hand #${h.handNo}`}
          <span className="ml-2 font-normal text-emerald-300/80">
            Blinds {h.blinds.sb}/{h.blinds.bb} · Button: {h.buttonLabel}
          </span>
        </div>
        {h.net != null && (
          <span className={`text-xs font-bold ${netCls}`}>
            {h.net >= 0 ? '+' : ''}
            {h.net}
          </span>
        )}
      </div>

      <div className="mb-1 text-[11px] text-emerald-300/90">
        Your cards:
        <Cards cards={h.heroCards} />
        <span className="ml-2 text-emerald-400/70">{h.postsLine}</span>
      </div>

      <div className="space-y-0.5">
        {h.streets.map((s, i) => (
          <div key={i} className="text-[12px] leading-snug text-emerald-100">
            <span className="font-semibold text-emerald-200">{s.label}</span>
            <Cards cards={s.cards} />
            {s.line && <span className="text-emerald-400/60">: </span>}
            {s.line}
          </div>
        ))}
      </div>

      {h.reveals.length > 0 && (
        <div className="mt-1 text-[11px] text-emerald-300/80">
          {h.reveals.map((r, i) => (
            <span key={i} className="mr-3">
              {r.name} ({r.position})
              <Cards cards={r.cards} />
              {r.hand ? ` — ${r.hand}` : ''}
            </span>
          ))}
        </div>
      )}

      {h.resultLines.length > 0 && (
        <div className="mt-1.5 space-y-0.5 border-t border-emerald-800/60 pt-1.5">
          {h.resultLines.map((line, i) => (
            <div key={i} className="text-[12px] font-semibold text-yellow-200">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {object|null} props.current - describeHand() for the in-progress hand, or null
 * @param {object[]} props.past       - describeHand() outputs for finished hands (newest first)
 * @param {() => void} props.onClear   - clear stored history
 */
export default function HandHistoryPanel({ current, past, onClear }) {
  const [open, setOpen] = useState(false) // collapsed by default — stays out of the way
  const count = past.length

  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-emerald-950/40 ring-1 ring-emerald-900/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-900/40"
      >
        <span>
          Hand history
          <span className="ml-2 text-xs font-normal text-emerald-300/80">
            {count} saved{current ? ' · 1 in progress' : ''}
          </span>
        </span>
        <span className={`text-emerald-300 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="border-t border-emerald-900/60 p-3">
          {!current && count === 0 ? (
            <div className="py-4 text-center text-sm text-emerald-300/70">
              No hands yet — play one and it'll show up here.
            </div>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {current && <HandBlock h={current} />}
                {past.map((h) => (
                  <HandBlock key={h.handNo + ':' + (h.ts ?? 0)} h={h} />
                ))}
              </div>
              {count > 0 && (
                <div className="mt-2 text-right">
                  <button
                    onClick={onClear}
                    className="text-[11px] font-semibold text-emerald-400/80 hover:text-rose-300"
                  >
                    Clear saved hands
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
