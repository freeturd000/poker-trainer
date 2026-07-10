// Shared glossary — one source of truth for the plain-English, complete-beginner
// definitions surfaced by the <Term> tooltip component across every module.
//
// Each entry is a single, self-contained sentence or two written WITHOUT jargon in
// the definition itself, so a lost beginner never has to look up a word inside a
// definition. Wording mirrors the plain-English text already used elsewhere in the
// app (the Learn position notes in modules/learn/PositionDiagram.jsx, the bot
// archetype glosses in modules/simulator/coach.js) rather than inventing new copy.
//
// This file owns NO poker logic — it is static reference content only. Keys are the
// exact tokens that render in the UI (position codes are UPPERCASE to match the seat
// labels; actions/concepts are lowercase ids). Look terms up with GLOSSARY[id]; for
// a concrete dealt hand ("72o") use describeHand() to build a definition on the fly.

/** @type {Record<string, string>} term id → plain-English definition. */
export const GLOSSARY = {
  // ── Position codes (6-max), mirroring the Learn seat notes ──────────────────
  UTG: 'Under the gun — the first player to act before the flop, and the earliest seat. So many players still act after you that only your strongest hands are worth playing here.',
  HJ: 'Hijack — two seats to the right of the dealer button. A middle seat; you can open a few more hands than the earliest seats because fewer players are left behind you.',
  CO: 'Cutoff — one seat to the right of the dealer button. A strong late seat, second only to the button, so you play a wide range of hands.',
  BTN: "The button — the dealer seat, marked with a 'D'. The best seat at the table: you act last after the flop, so you get to play the most hands.",
  SB: 'Small blind — one seat to the left of the button. You post a forced half-bet before the cards are dealt, and you have to act first on every street after the flop.',
  BB: "Big blind — two seats to the left of the button. You post the full forced bet (the “big blind”) before the cards, and you act last before the flop.",
  button:
    "The dealer button — a disc that marks who is the nominal dealer this hand. It moves one seat to the left after every hand, so everyone takes a turn in every position.",

  // ── Actions ────────────────────────────────────────────────────────────────
  fold: "Fold — give up your hand (and any chips you've already put in) and sit out until the next hand.",
  check: 'Check — pass your turn without betting. Only allowed when no one has bet yet; it keeps you in the hand for free.',
  call: 'Call — put in exactly enough chips to match the current bet and stay in the hand. (Checking is free; calling costs chips to match someone’s bet.)',
  bet: 'Bet — be the first to put chips in on a betting round when no one else has yet. A bet starts the action; a raise increases a bet that already exists.',
  raise: "Raise — increase the amount when there's already a bet on the table, forcing everyone else to pay more to keep playing.",
  '3bet':
    'A 3-bet is simply a re-raise. The big blind counts as the first bet, the opener’s raise is the second, so raising again is the “third bet.”',

  // ── Core concepts ────────────────────────────────────────────────────────────
  equity:
    'Equity — your share of the pot right now: the percentage of the time your hand would win if every remaining card were dealt out. 40% equity means you’d win about 4 times in 10.',
  outs: 'Outs — the cards still left in the deck that would complete your hand and likely make it the winner (for example, 9 cards of your suit are left when you’re drawing to a flush).',
  potodds:
    'Pot odds — the price of calling: the amount you must call compared with how big the pot would be. It tells you the minimum equity you need for a call to be worth it.',
  breakeven:
    'Break-even — the exact equity at which calling neither wins nor loses money over the long run. With more equity than that, calling profits; with less, folding is better.',
  range: 'Range — all the different hands a player could have in a spot, not just one specific guess. Strong players think about an opponent’s whole range rather than putting them on a single hand.',
  draw: 'Draw — an unfinished hand that still needs one more card to become strong, such as four cards toward a flush or an open-ended straight.',
  board: 'The board — the community cards dealt face-up in the middle. Every player shares them to make their best five-card hand.',
  flop: 'Flop — the first three community cards, dealt at the same time. Play after they appear is the first round of “postflop” poker.',
  turn: 'Turn — the fourth community card, dealt after the flop betting round finishes.',
  river: 'River — the fifth and final community card, dealt after the turn. The last betting round follows it.',
  preflop: 'Preflop — the first betting round, before any community cards are dealt, when all you have is your two hole cards.',
  postflop: 'Postflop — every betting round after the flop is dealt (the flop, turn, and river rounds).',
  wet: 'Wet board — a coordinated board where lots of draws are possible (connected ranks and/or shared suits), so hands change in value quickly.',
  dry: 'Dry board — an uncoordinated board with few possible draws (scattered ranks, mixed suits), so a made hand is unlikely to get overtaken.',
  paired: 'Paired board — two of the community cards share a rank (e.g. K K 4). That makes full houses possible and shifts how strong other hands are.',
  monotone: 'Monotone board — all three flop cards are the same suit, so a flush is already possible for anyone holding two more of that suit.',
  'two-tone': 'Two-tone board — exactly two suits are on the flop, so a flush draw is possible but no flush is complete yet.',
  cbet: 'C-bet (continuation bet) — a bet made on the flop by the player who did the raising before the flop, continuing to show strength.',
  value: 'Value bet — betting a strong hand to get called by weaker hands, so you win extra chips the times you’re ahead.',
  bluff: 'Bluff — betting or raising a weak hand to make a stronger hand fold, winning the pot without having to show down the best cards.',
  'made hand': 'Made hand — a hand that is already complete and has real value now (a pair or better), as opposed to a draw that still needs another card.',
  showdown: 'Showdown — the end of a hand where the remaining players turn their cards face-up and the best five-card hand wins the pot.',
  blinds: 'Blinds — the forced bets posted before the cards are dealt (a small blind and a big blind) that seed the pot so there’s something to play for.',
  pot: 'The pot — all the chips wagered so far in the current hand. The winner (or winners) take it.',
  'buy-in': 'Buy-in — the amount of chips you sit down with. Cash games have a range (100 big blinds is a standard buy-in).',
  bb: 'Big blind (bb) — the forced bet posted by the big-blind seat. It’s also the unit stacks and winnings are measured in (e.g. “100bb deep”).',

  // ── Bot archetypes (wording from simulator/coach.js ARCHETYPE_INFO) ─────────
  nit: 'Nit — an extremely tight player who only plays premium hands.',
  station: 'Calling station — a loose player who calls with almost anything and hates folding.',
  tag: 'TAG (tight-aggressive) — a player who plays few hands but bets and raises them hard.',
}

// Rank names for building a plain-English description of a concrete dealt hand.
const CARD_WORD = {
  A: 'an Ace',
  K: 'a King',
  Q: 'a Queen',
  J: 'a Jack',
  T: 'a Ten',
  9: 'a 9',
  8: 'an 8',
  7: 'a 7',
  6: 'a 6',
  5: 'a 5',
  4: 'a 4',
  3: 'a 3',
  2: 'a 2',
}
const PAIR_WORD = {
  A: 'Aces',
  K: 'Kings',
  Q: 'Queens',
  J: 'Jacks',
  T: 'Tens',
  9: 'nines',
  8: 'eights',
  7: 'sevens',
  6: 'sixes',
  5: 'fives',
  4: 'fours',
  3: 'threes',
  2: 'twos',
}

/**
 * Plain-English description of a hand-notation token ("AKs", "72o", "TT"), for
 * restating the shorthand a beginner sees in feedback. Returns null for anything
 * that isn't a recognisable token so callers can fall back to plain text.
 * @param {string} token
 * @returns {string|null}
 */
export function describeHand(token) {
  if (typeof token !== 'string') return null
  // Pair: two identical ranks, e.g. "AA".
  if (token.length === 2 && token[0] === token[1] && PAIR_WORD[token[0]]) {
    return `${token} — a pair of ${PAIR_WORD[token[0]]}.`
  }
  // Suited / offsuit: two ranks + 's' or 'o', e.g. "AKs", "72o".
  if (token.length === 3) {
    const [a, b, suf] = token
    if (CARD_WORD[a] && CARD_WORD[b] && (suf === 's' || suf === 'o')) {
      const suitPart = suf === 's' ? 'of the same suit (suited)' : 'of different suits (offsuit)'
      return `${token} — ${CARD_WORD[a]} and ${CARD_WORD[b]} ${suitPart}.`
    }
  }
  return null
}
