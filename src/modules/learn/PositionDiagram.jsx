// Learn visual — clickable 6-max table positions (ported from docs/poker-table-positions.html).
//
// Self-contained: an SVG felt table with six tappable seats. Tapping a seat opens a
// detail panel (name, quick-fact chips, one-paragraph note) and highlights it. No
// engine/store/data imports — the seat facts live here as static content, styled to
// sit inside a white Learn article card on the app's emerald theme.

import { useState } from 'react'

// Seat facts. `inpos` drives the position chip colour (in / out / mid). Ordered the
// way cards are dealt so the diagram and detail agree.
const SEATS = {
  BTN: {
    name: 'Button (BTN)',
    chips: ['Dealt 6th (last)', 'Acts last postflop', 'In position'],
    inpos: 'in',
    note: 'Best seat at the table. You watch everyone act before you decide, so you open the widest range — around 45% of hands. The dealer button rotates one seat left after every hand, so everyone takes a turn here.',
  },
  SB: {
    name: 'Small blind (SB)',
    chips: ['Dealt 1st', 'First to act postflop', 'Out of position'],
    inpos: 'out',
    note: "One seat left of the button. Posts a forced half-bet before seeing cards. Preflop it's a steal-or-fold seat, but on every later street you're stuck acting first — a real disadvantage.",
  },
  BB: {
    name: 'Big blind (BB)',
    chips: ['Dealt 2nd', 'Acts last preflop', 'Out of position'],
    inpos: 'out',
    note: "Posts the full big blind — the unit the whole table is measured in. Gets 'the option' to raise preflop since money's already in, so it defends a wide range at a discount. Still out of position postflop.",
  },
  UTG: {
    name: 'Under the gun (UTG)',
    chips: ['Dealt 3rd', 'Acts first preflop', 'Out of position'],
    inpos: 'out',
    note: 'The pressure seat — first to open with the entire table still behind you. Tightest range, around 15%. Only strong hands survive here because so many players can wake up with something.',
  },
  HJ: {
    name: 'Hijack (HJ)',
    chips: ['Dealt 4th', 'Acts early-middle', 'Middle position'],
    inpos: 'mid',
    note: "Two seats off the button. Old slang for 'hijacking' the steal the later seats were about to make. Range widens from here as fewer players remain behind you.",
  },
  CO: {
    name: 'Cutoff (CO)',
    chips: ['Dealt 5th', 'Acts late', 'Late position'],
    inpos: 'in',
    note: "One seat off the button — second-best position at the table. 'Cuts off' the button's steal by acting before it. Opens wide, around 27%, and steals blinds often.",
  },
}

// Rect geometry per seat (x, y of the 84×50 seat card) plus optional role label.
const LAYOUT = {
  UTG: { x: 138, y: 75, role: { text: 'first to act preflop', x: 180, y: 64 } },
  HJ: { x: 298, y: 35 },
  CO: { x: 458, y: 75 },
  BTN: { x: 458, y: 295 },
  SB: { x: 298, y: 337, role: { text: 'posts small blind', x: 340, y: 404 } },
  BB: { x: 138, y: 295, role: { text: 'posts big blind', x: 180, y: 366 } },
}
const ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']

const CHIP_STYLES = {
  in: 'bg-accent-soft text-accent-text border-line',
  out: 'bg-gold-soft text-gold-ink border-gold/40',
  mid: 'bg-surface-sunken text-ink-body border-line',
  neutral: 'bg-surface-sunken text-ink-body border-line',
}

export default function PositionDiagram() {
  const [selected, setSelected] = useState('BTN')
  const d = SEATS[selected]

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-3 sm:p-4">
      <svg
        viewBox="0 0 680 430"
        role="img"
        aria-label="6-max poker table with six clickable seats around the dealer button"
        className="block h-auto w-full"
      >
        {/* Felt — themed via fill/stroke token classes so it tracks light/dark. */}
        <ellipse cx="340" cy="210" rx="200" ry="110" className="fill-felt-rail stroke-line-felt" strokeWidth="2" />
        <text x="340" y="200" textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="600" className="fill-onfelt-2">
          6-max table
        </text>
        <text x="340" y="224" textAnchor="middle" dominantBaseline="central" fontSize="12" className="fill-onfelt-3">
          action moves clockwise
        </text>

        {/* Dealer button token */}
        <circle cx="428" cy="300" r="13" className="fill-gold" />
        <text x="428" y="300" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" className="fill-felt-deep">
          D
        </text>

        {/* Role labels (sit on the panel, not the felt) */}
        {ORDER.map((pos) => {
          const role = LAYOUT[pos].role
          return role ? (
            <text key={`role-${pos}`} x={role.x} y={role.y} textAnchor="middle" fontSize="11" className="fill-ink-muted">
              {role.text}
            </text>
          ) : null
        })}

        {/* Seats — kept as light card faces (readable on the felt in both themes),
            so their ink/edge stay fixed; the button + selection read via gold. */}
        {ORDER.map((pos) => {
          const { x, y } = LAYOUT[pos]
          const isSel = pos === selected
          const isBtn = pos === 'BTN'
          const strokeCls = isSel || isBtn ? 'stroke-gold' : 'stroke-card-edge'
          const strokeW = isSel ? 3 : 1.5
          const cx = x + 42
          return (
            <g
              key={pos}
              onClick={() => setSelected(pos)}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`Select ${SEATS[pos].name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(pos)
                }
              }}
            >
              <rect x={x} y={y} width="84" height="50" rx="8" className={`fill-card-face ${strokeCls}`} strokeWidth={strokeW} />
              <text x={cx} y={y + 19} textAnchor="middle" dominantBaseline="central" fontSize="15" fontWeight="700" className="fill-card-ink">
                {pos}
              </text>
              <text x={cx} y={y + 36} textAnchor="middle" dominantBaseline="central" fontSize="11" className="fill-card-ink opacity-60">
                {SEATS[pos].chips[0].toLowerCase()}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="mt-1 text-center text-xs text-ink-muted">Tap any seat for the full breakdown</p>

      {/* Detail panel */}
      <div className="mt-2 rounded-lg border border-line bg-surface p-4">
        <p className="text-lg font-bold text-ink-heading">{d.name}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.chips.map((c, i) => (
            <span
              key={i}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                i === 2 ? CHIP_STYLES[d.inpos] : CHIP_STYLES.neutral
              }`}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">{d.note}</p>
      </div>
    </div>
  )
}
