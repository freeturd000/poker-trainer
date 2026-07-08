// Learn section — the six-phase learning path (data only).
//
// This file is the single source of truth for the Learn section's STRUCTURE:
// the ordered phases, each phase's headline/description, the trainer(s) that let
// you practise it, and the section headings the article will cover. It is scaffold
// — the teaching prose is intentionally NOT written here yet. Real content gets
// dropped in later, one phase at a time, by filling each section's `body`.
//
// Shape, so later prompts know exactly where prose goes:
//   {
//     id, number, title, description,      // index-card fields (Learn home)
//     trainers: [{ view, label }],         // App nav ids to link theory → practice
//     sections: [{ heading, body }],       // article outline; body is [] for now
//   }
// A section's `body` is an array of paragraph strings. Empty array = "coming soon".
// Keeping content as plain strings (not JSX) keeps this file reviewable and lets
// the article renderer stay dumb.

export const PHASES = [
  {
    id: 'preflop-ranges',
    number: 1,
    title: 'Preflop ranges & position',
    description: 'Which hands to play from which seat — the highest-ROI fundamental.',
    trainers: [{ view: 'range', label: 'Range Trainer' }],
    sections: [
      { heading: 'Why preflop is 80% of the game', body: [] },
      { heading: 'How position changes everything', body: [] },
      { heading: 'Reading an RFI (raise-first-in) chart', body: [] },
      { heading: 'Open-raising by seat', body: [] },
      { heading: 'Facing a raise: call, 3-bet, or fold', body: [] },
      { heading: 'Common preflop leaks', body: [] },
    ],
  },
  {
    id: 'pot-odds-equity',
    number: 2,
    title: 'Pot odds, outs & equity',
    description: 'The table math — is this call profitable? Learn to answer instantly.',
    trainers: [{ view: 'odds', label: 'Odds Trainer' }],
    sections: [
      { heading: 'Pot odds: the price of a call', body: [] },
      { heading: 'Counting your outs', body: [] },
      { heading: 'The Rule of 2 and 4', body: [] },
      { heading: 'Turning outs into equity', body: [] },
      { heading: 'Putting it together: the call/fold verdict', body: [] },
      { heading: 'Implied odds (a first look)', body: [] },
    ],
  },
  {
    id: 'board-texture',
    number: 3,
    title: 'Board texture & hand reading',
    description: 'Read the board and think in ranges, not just your own two cards.',
    trainers: [{ view: 'board', label: 'Board Reader' }],
    sections: [
      { heading: 'Dry, wet, and draw-heavy boards', body: [] },
      { heading: 'Paired and monotone textures', body: [] },
      { heading: 'What beats you: reading the nuts', body: [] },
      { heading: 'Whose range does this flop favor?', body: [] },
      { heading: 'How texture drives your decision', body: [] },
    ],
  },
  {
    id: 'postflop-decisions',
    number: 4,
    title: 'Postflop decisions & bet sizing',
    description: 'C-bets, facing bets, and sizing — where the real edges live.',
    trainers: [{ view: 'postflop', label: 'Postflop Trainer' }],
    sections: [
      { heading: 'The c-bet: when to fire as the aggressor', body: [] },
      { heading: 'Checking back and pot control', body: [] },
      { heading: 'Facing a bet: call, raise, or fold', body: [] },
      { heading: 'Bet sizing tied to texture (⅓ / ½ / ¾ / pot)', body: [] },
      { heading: 'Value bets vs bluffs', body: [] },
      { heading: 'Why this is heuristic, not solved', body: [] },
    ],
  },
  {
    id: 'volume-reps',
    number: 5,
    title: 'Volume & reps',
    description: 'How to practice so it sticks — turning study into instinct.',
    trainers: [
      { view: 'simulator', label: 'Simulator' },
      { view: 'concept', label: 'Concept Deck' },
    ],
    sections: [
      { heading: 'Why reps beat reading', body: [] },
      { heading: 'Using the Simulator to drill mechanics', body: [] },
      { heading: 'Spaced repetition and the Concept Deck', body: [] },
      { heading: 'Reviewing your leaks', body: [] },
      { heading: 'Building a nightly study routine', body: [] },
    ],
  },
  {
    id: 'live-vegas',
    number: 6,
    title: 'Live play & Vegas prep',
    description: 'Etiquette, mechanics, and bankroll — so your first live session feels natural.',
    trainers: [{ view: 'live', label: 'Live Toolkit' }],
    sections: [
      { heading: 'How a live table actually runs', body: [] },
      { heading: 'Etiquette: acting in turn, string bets, min-raises', body: [] },
      { heading: 'Chip handling, posting & straddling', body: [] },
      { heading: 'Bankroll management for live cash', body: [] },
      { heading: 'Tracking sessions and win rate', body: [] },
      { heading: 'Your first Vegas trip: a checklist', body: [] },
    ],
  },
]

// Lookup helper for the article router.
export function getPhase(id) {
  return PHASES.find((p) => p.id === id) ?? null
}
