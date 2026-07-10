// Learn visual — the sequence of a single Hold'em hand, start to finish.
//
// A static, self-contained timeline: blinds → hole cards → preflop → flop → turn →
// river → showdown. It reuses the shared <Card /> so a beginner literally watches
// the shared "board" grow one card at a time (already-dealt cards dim so the fresh
// one stands out). No engine/store imports; the example cards are static content and
// deliberately match the "one full hand" walk-through in this phase's prose. Themed
// with token classes so it tracks light/dark inside a Learn article card.

import Card from '../../components/Card.jsx'

// Steps of one example hand. `cards` (when present) is the state of the table at that
// step; `dim: true` marks a card that was already on the board a step earlier, so the
// newly-dealt card reads as fresh by contrast.
const STEPS = [
  {
    label: 'Blinds posted',
    note: 'The two players to the button’s left put in forced bets — the small blind and the big blind — so there is a pot worth playing for before anyone has even seen a card.',
  },
  {
    label: 'Hole cards dealt',
    note: 'Every player is dealt two private cards, face down. These are your hole cards — only you can see them.',
    cards: [{ card: 'Ac' }, { card: 'Kd' }],
    caption: 'Your hole cards',
  },
  {
    label: 'Preflop — 1st betting round',
    note: 'No shared cards yet, so everyone acts on their two hole cards alone. In our example you raise and one opponent calls.',
  },
  {
    label: 'The flop — 2nd betting round',
    note: 'Three community cards are dealt face up in the middle, shared by everyone. You combine them with your hole cards to make a five-card hand. Then another round of betting.',
    cards: [{ card: 'Ks' }, { card: '9h' }, { card: '4c' }],
    caption: 'The board',
  },
  {
    label: 'The turn — 3rd betting round',
    note: 'A fourth community card is added to the board, followed by another round of betting.',
    cards: [{ card: 'Ks', dim: true }, { card: '9h', dim: true }, { card: '4c', dim: true }, { card: '2d' }],
    caption: 'The board, now four cards',
  },
  {
    label: 'The river — 4th betting round',
    note: 'The fifth and final community card completes the board, and the last round of betting takes place.',
    cards: [
      { card: 'Ks', dim: true },
      { card: '9h', dim: true },
      { card: '4c', dim: true },
      { card: '2d', dim: true },
      { card: 'Qs' },
    ],
    caption: 'The board, now complete',
  },
  {
    label: 'Showdown',
    note: 'Anyone still in the hand turns their cards face up. The best five-card hand — made from your two hole cards plus the five on the board — wins the whole pot.',
  },
]

export default function HandFlowVisual() {
  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-3 sm:p-4">
      <ol>
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1
          return (
            <li key={i} className="flex gap-3 sm:gap-4">
              {/* Left rail: numbered node + connector line down to the next step */}
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold tabular-nums text-onfelt">
                  {i + 1}
                </span>
                {!last && <span className="my-1 w-px flex-1 bg-line" aria-hidden="true" />}
              </div>

              {/* Content */}
              <div className={last ? '' : 'pb-5'}>
                <p className="text-sm font-bold text-ink-heading">{s.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-body">{s.note}</p>
                {s.cards && (
                  <div className="mt-2.5">
                    <div className="flex flex-wrap gap-1">
                      {s.cards.map((c, j) => (
                        <Card key={j} card={c.card} size="sm" className={c.dim ? 'opacity-40' : ''} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{s.caption}</p>
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <p className="mt-3 text-center text-xs text-ink-muted">
        One example hand, top to bottom. Your two hole cards never change; the board grows by one stage — flop, turn,
        river — until it holds five shared cards.
      </p>
    </div>
  )
}
