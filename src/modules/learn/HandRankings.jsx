// Learn visual — the NLHE hand-strength ladder (ported from docs/poker-hand-rankings.html).
//
// A static reference: ten hand classes, best to worst, each with an example five-card
// hand and a plain-English gloss. Self-contained (compact inline cards, no engine
// import) and styled to sit inside a white Learn article card.

// Each ranking's example hand, written as "<rank><suit-glyph>" tokens. Red suits
// (♥ ♦) render red; the glyph carries the suit so the mini-card stays tiny.
const RANKINGS = [
  {
    name: 'Royal flush',
    cards: ['A♥', 'K♥', 'Q♥', 'J♥', 'T♥'],
    desc: 'A, K, Q, J, 10 — all the same suit. The best possible hand. You may never see one; that’s fine.',
  },
  {
    name: 'Straight flush',
    cards: ['8♠', '7♠', '6♠', '5♠', '4♠'],
    desc: 'Five in a row, all the same suit. Rarer than everything below it.',
  },
  {
    name: 'Four of a kind',
    cards: ['Q♠', 'Q♥', 'Q♦', 'Q♣', '3♠'],
    desc: 'All four of the same rank — "quads." Here, four queens.',
  },
  {
    name: 'Full house',
    cards: ['K♠', 'K♥', 'K♣', '7♠', '7♦'],
    desc: 'Three of a kind plus a pair. Here, three kings and two 7s — said as "kings full of sevens."',
  },
  {
    name: 'Flush',
    cards: ['A♦', 'J♦', '8♦', '5♦', '2♦'],
    desc: 'Five cards all the same suit, in any order. Beaten only by the four hands above.',
  },
  {
    name: 'Straight',
    cards: ['9♠', '8♥', '7♣', '6♦', '5♠'],
    desc: 'Five cards in a row, any suits. Ace can be high (10-J-Q-K-A) or low (A-2-3-4-5).',
  },
  {
    name: 'Three of a kind',
    cards: ['9♠', '9♥', '9♦', 'K♠', '4♥'],
    desc: 'Three of the same rank — "trips" or a "set." Here, three 9s.',
  },
  {
    name: 'Two pair',
    cards: ['J♠', 'J♦', '5♠', '5♥', 'A♠'],
    desc: 'Two different pairs. Here, two jacks and two 5s.',
  },
  {
    name: 'One pair',
    cards: ['T♠', 'T♥', 'A♠', '7♦', '3♠'],
    desc: 'Two cards of the same rank. Here, a pair of 10s. Very common.',
  },
  {
    name: 'High card',
    cards: ['A♥', 'Q♠', '9♦', '5♣', '2♠'],
    desc: 'Nothing connects — no pair, no straight, no flush. Your best single card plays. Here, "ace high."',
  },
]

function MiniCard({ label }) {
  const isRed = label.includes('♥') || label.includes('♦')
  return (
    <span
      className={`inline-flex h-9 w-7 items-center justify-center rounded border border-card-edge bg-card-face font-mono text-[13px] font-bold ${
        isRed ? 'text-card-red' : 'text-card-ink'
      }`}
    >
      {label}
    </span>
  )
}

export default function HandRankings() {
  return (
    <div className="not-prose mt-4 space-y-2">
      {RANKINGS.map((r, i) => (
        <div key={r.name} className="flex gap-3 rounded-xl border border-line bg-surface-sunken-soft p-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-sm font-bold text-accent-text ring-1 ring-line">
            {i + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink-heading">{r.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {r.cards.map((c, j) => (
                <MiniCard key={j} label={c} />
              ))}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-body">{r.desc}</p>
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-l-4 border-line border-l-gold bg-surface-sunken-soft p-4 text-sm text-ink-body">
        <p>
          <b className="font-semibold text-ink-heading">The pattern:</b> rarer hands win. A flush is harder to make than
          a straight, so it beats it. Memorise the order and you’ve got the one thing you truly must know cold.
        </p>
        <p className="mt-2">
          <b className="font-semibold text-ink-heading">Ties broken by the "kicker":</b> if two players both have a pair
          of 10s, the highest side card decides it — A-kicker beats K-kicker, and so on. Suits never break ties.
        </p>
      </div>
    </div>
  )
}
