// Shared, presentational card renderer used across every module.
// Purely prop-driven — no state, no engine calls beyond parsing the card string.

import { parseCard } from '../engine/card.js'

// Suit glyphs + which suits render red.
const SUIT_SYMBOL = { s: '♠', h: '♥', d: '♦', c: '♣' }
const RED_SUITS = new Set(['h', 'd'])

const SIZES = {
  sm: 'w-10 h-14 text-base rounded-md',
  md: 'w-14 h-20 text-xl rounded-lg',
  lg: 'w-20 h-28 text-3xl rounded-xl',
}

/**
 * @param {Object} props
 * @param {string|{rank:string,suit:string}} [props.card] - canonical string ("As") or model
 * @param {boolean} [props.faceDown] - render the back of the card
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.className]
 */
export default function Card({ card, faceDown = false, size = 'md', className = '' }) {
  const sizeCls = SIZES[size] ?? SIZES.md

  if (faceDown || !card) {
    return (
      <div
        className={`${sizeCls} flex items-center justify-center border border-blue-900 bg-blue-700 shadow-sm ${className}`}
        aria-label="Face-down card"
      >
        <div className="h-3/4 w-3/4 rounded bg-blue-500/40 border border-blue-300/40" />
      </div>
    )
  }

  const { rank, suit } = typeof card === 'string' ? parseCard(card) : card
  const isRed = RED_SUITS.has(suit)
  const colorCls = isRed ? 'text-red-600' : 'text-gray-900'

  return (
    <div
      className={`${sizeCls} relative flex flex-col justify-between border border-gray-300 bg-white shadow-sm p-1 leading-none ${colorCls} ${className}`}
      aria-label={`${rank}${suit}`}
    >
      <span className="font-bold self-start">{rank}</span>
      <span className="self-center text-[1.4em]">{SUIT_SYMBOL[suit]}</span>
      <span className="font-bold self-end rotate-180">{rank}</span>
    </div>
  )
}
