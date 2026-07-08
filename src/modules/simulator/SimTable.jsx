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
import { evaluateHand } from '../../engine/evaluator.js'

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

  return (
    <div className="relative mx-auto h-[440px] w-full max-w-3xl sm:h-[560px]">
      {/* Felt oval */}
      <div className="absolute inset-x-[4%] inset-y-[8%] rounded-[50%] bg-emerald-700 shadow-2xl ring-4 ring-emerald-900/50" />
      <div className="pointer-events-none absolute inset-x-[7%] inset-y-[12%] rounded-[50%] ring-2 ring-emerald-500/20" />

      {/* Centre of the felt: pot + community board */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <div className="rounded-full bg-emerald-950/70 px-5 py-1.5 text-center">
          <span className="text-xs uppercase tracking-wide text-emerald-300">Pot</span>{' '}
          <span className="text-lg font-bold tabular-nums text-white">{view.pot}</span>
        </div>
        <div className="flex min-h-[5rem] items-center gap-2">
          {shownBoard.length === 0 ? (
            <span className="text-sm italic text-emerald-200/70">— board dealt as streets go —</span>
          ) : (
            shownBoard.map((c) => <Card key={c} card={c} size="md" />)
          )}
        </div>
        {isShowdown && view.pots.length > 1 && (
          <div className="text-[11px] text-emerald-200">
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
            />
          </div>
        )
      })}
    </div>
  )
}

function Seat({ p, label, isHero, isButton, isTurn, stepMode, reveal, won, board, lastAction, justActed }) {
  const folded = p.status === 'folded'
  const showCards = reveal && p.holeCards.length === 2 && !folded
  const descr =
    reveal && !folded && board.length === 5 && p.holeCards.length === 2
      ? evaluateHand(p.holeCards, board).descr
      : null

  // Ring priority: winner (yellow) > current actor (amber) > just-acted (sky).
  const ring = won
    ? 'ring-4 ring-yellow-300'
    : isTurn
      ? 'ring-4 ring-amber-400'
      : justActed
        ? 'ring-4 ring-sky-400'
        : 'ring-1 ring-emerald-900/50'

  return (
    <div
      className={`relative w-24 rounded-2xl p-2 text-center shadow-lg transition sm:w-36 sm:p-2.5 ${
        folded ? 'bg-emerald-900/40 opacity-50' : 'bg-emerald-950/80'
      } ${ring}`}
    >
      {/* Button chip */}
      {isButton && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-900 shadow">
          D
        </span>
      )}

      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-200">
          {p.position}
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

      <div className="mt-1 text-xs font-semibold text-emerald-200">
        Stack <span className="tabular-nums text-white">{p.stack}</span>
        {p.status === 'allin' && <span className="ml-1 text-amber-300">· all-in</span>}
      </div>

      {descr && <div className="mt-0.5 truncate text-[10px] text-yellow-200">{descr}</div>}

      {/* Most-recent action bubble (brightened when it's the just-acted seat) */}
      {lastAction && !folded && (
        <div
          className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
            justActed ? 'bg-sky-500 shadow' : 'bg-emerald-800/80'
          }`}
        >
          {lastAction}
        </div>
      )}
      {folded && <div className="mt-1 text-[11px] font-semibold text-emerald-300/70">Folded</div>}
      {isTurn && (
        <div className="mt-1 text-[11px] font-semibold text-amber-300">
          {isHero ? 'Your turn' : stepMode ? 'to act' : 'thinking…'}
        </div>
      )}
    </div>
  )
}
