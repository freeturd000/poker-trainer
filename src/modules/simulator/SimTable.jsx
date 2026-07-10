// Presentational poker table for the simulator.
//
// Pure props-in rendering (no engine calls except the read-only evaluator, used
// to describe revealed showdown hands). Shows each seat's position/stack/cards,
// the button, the board, the pot(s), whose turn it is, and each player's most
// recent action. Bots' cards stay face-down until a showdown reveals them.
//
// LAYOUT: seats are positioned around an oval felt — the hero anchored at bottom
// centre, the opponents spread evenly around the sides and top in clockwise
// seating order relative to the hero (so the button/blind badges read correctly
// wherever a seat lands). The pot and community board sit in the middle of the
// felt. Only the *arrangement* lives here; each seat renders exactly as before.

import Card from '../../components/Card.jsx'
import Term from '../../components/Term.jsx'
import { evaluateHand } from '../../engine/evaluator.js'
import { firstToActPreflop, firstToActPostflop } from './positions.js'

/**
 * Rank every still-acting seat by the order it acts THIS street — purely for a
 * visual "who acts when" cue. Reads existing hand state only (same first-to-act
 * rule the engine uses): preflop opens at UTG, postflop at the first live seat
 * left of the button, then clockwise. All-in/folded seats take no turn and are
 * skipped, so ranks reflect the real remaining sequence.
 *
 * @returns {{ rankBySeat: Record<number, number>, firstSeat: number, total: number }}
 */
function streetActionOrder(view, n, buttonIndex) {
  const rankBySeat = {}
  if (view.complete || view.toAct === -1) return { rankBySeat, firstSeat: -1, total: 0 }
  const first =
    view.street === 'preflop'
      ? firstToActPreflop(n, buttonIndex)
      : firstToActPostflop(n, buttonIndex)
  const bySeat = {}
  view.players.forEach((p) => (bySeat[p.seat] = p))
  let firstSeat = -1
  let rank = 0
  for (let i = 0; i < n; i++) {
    const seat = (first + i) % n
    const p = bySeat[seat]
    if (p && p.status === 'active') {
      rank += 1
      rankBySeat[seat] = rank
      if (firstSeat === -1) firstSeat = seat
    }
  }
  return { rankBySeat, firstSeat, total: rank }
}

/** "st"/"nd"/"rd"/"th" for a small positive ordinal (used only in tooltips). */
function ordinalSuffix(k) {
  if (k % 100 >= 11 && k % 100 <= 13) return 'th'
  return { 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] ?? 'th'
}

// Oval geometry, in % of the table wrapper. Seats are centred on this ellipse;
// the felt is drawn a little inside it. Tuned so seat boxes (2–6 of them) never
// overlap each other or the central pot/board at desktop widths.
const OVAL = { cx: 50, cy: 47, rx: 39, ry: 39 }

/**
 * Anchor point (left/top %) for each seat around the oval. The hero sits at the
 * bottom centre; every other seat is placed at its clockwise offset from the
 * hero, going bottom → left → top → right (clock-hand direction), matching real
 * clockwise seating/action order.
 */
function seatAnchors(n, heroSeat) {
  const { cx, cy, rx, ry } = OVAL
  const anchors = {}
  for (let seat = 0; seat < n; seat++) {
    const k = (seat - heroSeat + n) % n // clockwise seats from the hero
    const a = (k * 2 * Math.PI) / n
    anchors[seat] = {
      left: cx - rx * Math.sin(a),
      top: cy + ry * Math.cos(a),
    }
  }
  return anchors
}

export default function SimTable({
  view,
  heroSeat,
  buttonIndex,
  lastBySeat,
  botNames,
  visibleBoardLen, // step-through: how many board cards to reveal (default: all)
  justActed, // step-through: { seat, text } of the most recent action, or null
  stepMode = false,
}) {
  const complete = view.complete
  const contenders = view.players.filter((p) => p.status !== 'folded')
  const isShowdown = complete && contenders.length > 1 && view.board.length === 5
  const winners = new Set(view.payouts.filter((p) => p.amount > 0).map((p) => p.index))
  const n = view.players.length
  const anchors = seatAnchors(n, heroSeat)
  const shownBoard =
    visibleBoardLen == null ? view.board : view.board.slice(0, visibleBoardLen)

  // Action-order cue for the current street (only meaningful with 2+ live actors).
  const { rankBySeat, firstSeat, total } = streetActionOrder(view, n, buttonIndex)
  const showOrder = total >= 2

  return (
    <>
    <div className="relative mx-auto h-[440px] w-full max-w-3xl sm:h-[560px]">
      {/* Felt oval */}
      <div className="absolute inset-x-[4%] inset-y-[8%] rounded-[50%] bg-felt-rail shadow-2xl ring-4 ring-line-felt/50" />
      <div className="pointer-events-none absolute inset-x-[7%] inset-y-[12%] rounded-[50%] ring-2 ring-accent/20" />

      {/* Centre of the felt: pot + community board */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <div className="rounded-full bg-panel/70 px-5 py-1.5 text-center">
          <span className="text-xs uppercase tracking-wide text-onfelt-3">Pot</span>{' '}
          <span className="text-lg font-bold tabular-nums text-onfelt">{view.pot}</span>
        </div>
        <div className="flex min-h-[5rem] items-center gap-2">
          {shownBoard.length === 0 ? (
            <span className="text-sm italic text-onfelt-2">— board dealt as streets go —</span>
          ) : (
            shownBoard.map((c) => <Card key={c} card={c} size="md" />)
          )}
        </div>
        {isShowdown && view.pots.length > 1 && (
          <div className="text-[11px] text-onfelt-2">
            {view.pots.map((pot, i) => (
              <span key={i} className="mx-1">
                {i === 0 ? 'Main' : `Side ${i}`}: {pot.amount}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Seats around the oval */}
      {view.players.map((p) => {
        const a = anchors[p.seat]
        const isHero = p.seat === heroSeat
        const seatJustActed = justActed != null && justActed.seat === p.seat
        return (
          <div
            key={p.seat}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${a.left}%`, top: `${a.top}%` }}
          >
            <Seat
              p={p}
              label={isHero ? 'You' : botNames[p.seat] ?? 'Bot'}
              isHero={isHero}
              isButton={p.seat === buttonIndex}
              isTurn={!complete && view.toAct === p.seat}
              stepMode={stepMode}
              reveal={isHero || (isShowdown && p.status !== 'folded')}
              won={winners.has(p.seat)}
              board={view.board}
              // The just-acted seat's bubble stays visible even after a street is
              // dealt (its action belongs to the previous street's feed).
              lastAction={seatJustActed ? justActed.text : lastBySeat[p.seat]}
              justActed={seatJustActed}
              actOrder={showOrder ? rankBySeat[p.seat] : undefined}
              isFirstToAct={showOrder && p.seat === firstSeat}
            />
          </div>
        )
      })}
    </div>

    {/* Legend: decodes the action-order cues for a beginner. Only shown while a
        street has a live sequence to read. */}
    {showOrder && (
      <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-onfelt-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-gold" />
          to act now
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-onfelt">
            1
          </span>
          acts first this street
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-felt-rail text-[9px] font-bold text-onfelt-2">
            2
          </span>
          then in order clockwise
        </span>
      </div>
    )}
    </>
  )
}

function Seat({
  p,
  label,
  isHero,
  isButton,
  isTurn,
  stepMode,
  reveal,
  won,
  board,
  lastAction,
  justActed,
  actOrder,
  isFirstToAct,
}) {
  const folded = p.status === 'folded'
  const showCards = reveal && p.holeCards.length === 2 && !folded
  const descr =
    reveal && !folded && board.length === 5 && p.holeCards.length === 2
      ? evaluateHand(p.holeCards, board).descr
      : null

  // Ring priority: winner (gold) > current actor (gold) > just-acted (blue).
  // Winner and current-actor never coincide (one is post-showdown, the other
  // mid-hand), so they can share the gold highlight.
  const ring = won
    ? 'ring-4 ring-gold'
    : isTurn
      ? 'ring-4 ring-gold'
      : justActed
        ? 'ring-4 ring-info-bright'
        : 'ring-1 ring-line-felt/50'

  return (
    <div
      className={`relative w-24 rounded-2xl p-2 text-center shadow-lg transition sm:w-36 sm:p-2.5 ${
        folded ? 'bg-panel/40 opacity-50' : 'bg-panel/80'
      } ${ring}`}
    >
      {/* Pulsing halo on the seat that is on the clock right now — the loudest cue
          on the table, drawn just outside the seat's own gold ring. */}
      {isTurn && (
        <span className="pointer-events-none absolute -inset-1 animate-pulse rounded-[1.1rem] ring-4 ring-gold/70" />
      )}

      {/* "to act" flag floating above the current actor. */}
      {isTurn && (
        <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-ink shadow">
          <span aria-hidden="true">←</span> to act
        </span>
      )}

      {/* Action-order badge (top-left, opposite the dealer button): where this seat
          falls in this street's sequence. Rank 1 (first to act) is accented. */}
      {actOrder != null && !isTurn && (
        <span
          className={`absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow ${
            isFirstToAct ? 'bg-accent text-onfelt ring-2 ring-accent-bright' : 'bg-felt-rail text-onfelt-2'
          }`}
          title={isFirstToAct ? 'First to act this street' : `Acts ${actOrder}${ordinalSuffix(actOrder)} this street`}
        >
          {actOrder}
        </span>
      )}

      {/* Button chip */}
      {isButton && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-onfelt text-xs font-bold text-felt-deep shadow">
          D
        </span>
      )}

      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-onfelt">{label}</span>
        <span className="rounded bg-felt-rail px-1.5 py-0.5 text-[10px] font-semibold uppercase text-onfelt-2">
          <Term id={p.position}>{p.position}</Term>
        </span>
      </div>

      <div className="mt-1 flex justify-center gap-1">
        {p.holeCards.length === 2 ? (
          showCards ? (
            <>
              <Card card={p.holeCards[0]} size="sm" />
              <Card card={p.holeCards[1]} size="sm" />
            </>
          ) : (
            <>
              <Card faceDown size="sm" />
              <Card faceDown size="sm" />
            </>
          )
        ) : (
          <div className="h-14" />
        )}
      </div>

      <div className="mt-1 text-xs font-semibold text-onfelt-2">
        Stack <span className="tabular-nums text-onfelt">{p.stack}</span>
        {p.status === 'allin' && <span className="ml-1 text-gold-text">· all-in</span>}
      </div>

      {descr && <div className="mt-0.5 truncate text-[10px] text-gold-text">{descr}</div>}

      {/* Most-recent action bubble (brightened when it's the just-acted seat) */}
      {lastAction && !folded && (
        <div
          className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-onfelt ${
            justActed ? 'bg-info shadow' : 'bg-panel/80'
          }`}
        >
          {lastAction}
        </div>
      )}
      {folded && <div className="mt-1 text-[11px] font-semibold text-onfelt-3/70">Folded</div>}
      {isTurn && (
        <div className="mt-1 text-[11px] font-semibold text-gold-text">
          {isHero ? 'Your turn' : stepMode ? 'to act' : 'thinking…'}
        </div>
      )}
    </div>
  )
}
