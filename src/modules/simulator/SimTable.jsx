// Presentational poker table for the simulator.
//
// Pure props-in rendering (no engine calls except the read-only evaluator, used
// to describe revealed showdown hands). Shows each seat's position/stack/cards,
// the button, the board, the pot(s), whose turn it is, and each player's most
// recent action. Bots' cards stay face-down until a showdown reveals them.

import Card from '../../components/Card.jsx'
import { evaluateHand } from '../../engine/evaluator.js'

export default function SimTable({ view, heroSeat, buttonIndex, lastBySeat, botNames }) {
  const complete = view.complete
  const contenders = view.players.filter((p) => p.status !== 'folded')
  const isShowdown = complete && contenders.length > 1 && view.board.length === 5
  const winners = new Set(view.payouts.filter((p) => p.amount > 0).map((p) => p.index))

  const opponents = view.players.filter((p) => p.seat !== heroSeat)
  const hero = view.players[heroSeat]

  return (
    <div className="rounded-3xl bg-emerald-700 p-4 shadow-2xl ring-4 ring-emerald-900/50">
      {/* Opponents across the top */}
      <div className="flex flex-wrap justify-center gap-3">
        {opponents.map((p) => (
          <Seat
            key={p.seat}
            p={p}
            label={botNames[p.seat] ?? 'Bot'}
            isButton={p.seat === buttonIndex}
            isTurn={!complete && view.toAct === p.seat}
            reveal={isShowdown && p.status !== 'folded'}
            won={winners.has(p.seat)}
            board={view.board}
            lastAction={lastBySeat[p.seat]}
          />
        ))}
      </div>

      {/* Center: pot + board */}
      <div className="my-5 flex flex-col items-center gap-3">
        <div className="rounded-full bg-emerald-950/70 px-5 py-1.5 text-center">
          <span className="text-xs uppercase tracking-wide text-emerald-300">Pot</span>{' '}
          <span className="text-lg font-bold tabular-nums text-white">{view.pot}</span>
        </div>
        <div className="flex min-h-[5rem] items-center gap-2">
          {view.board.length === 0 ? (
            <span className="text-sm italic text-emerald-200/70">— board dealt as streets go —</span>
          ) : (
            view.board.map((c) => <Card key={c} card={c} size="md" />)
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

      {/* Hero at the bottom */}
      <div className="flex justify-center">
        <Seat
          p={hero}
          label="You"
          isHero
          isButton={heroSeat === buttonIndex}
          isTurn={!complete && view.toAct === heroSeat}
          reveal
          won={winners.has(heroSeat)}
          board={view.board}
          lastAction={lastBySeat[heroSeat]}
        />
      </div>
    </div>
  )
}

function Seat({ p, label, isHero, isButton, isTurn, reveal, won, board, lastAction }) {
  const folded = p.status === 'folded'
  const showCards = (isHero || reveal) && p.holeCards.length === 2 && !folded
  const descr =
    reveal && !folded && board.length === 5 && p.holeCards.length === 2
      ? evaluateHand(p.holeCards, board).descr
      : null

  return (
    <div
      className={`relative w-40 rounded-2xl p-2.5 text-center shadow-lg transition ${
        folded ? 'bg-emerald-900/40 opacity-50' : 'bg-emerald-950/70'
      } ${isTurn ? 'ring-4 ring-amber-400' : 'ring-1 ring-emerald-900/50'} ${
        won ? 'ring-4 ring-yellow-300' : ''
      }`}
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

      {/* Most-recent action bubble */}
      {lastAction && !folded && (
        <div className="mt-1 rounded-full bg-emerald-800/80 px-2 py-0.5 text-[11px] font-semibold text-white">
          {lastAction}
        </div>
      )}
      {folded && <div className="mt-1 text-[11px] font-semibold text-emerald-300/70">Folded</div>}
      {isTurn && (
        <div className="mt-1 text-[11px] font-semibold text-amber-300">
          {isHero ? 'Your turn' : 'thinking…'}
        </div>
      )}
    </div>
  )
}
