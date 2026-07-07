// Standard draws → outs reference for the Odds Trainer (CLAUDE.md §3b, §4 Module 2).
//
// ⚠️ CORRECTNESS-CRITICAL — please review. These out counts are the textbook
// standard (e.g. "The Theory of Poker" / "Applications of NLHE" / any equity
// primer). Each `why` explains the count from first principles so it can be
// checked. The `templates` are concrete, hand-verified card layouts that produce
// EXACTLY the stated draw with no muddying secondary draws — see the per-template
// notes. The trainer applies a random SUIT PERMUTATION to each template for
// variety, which is a bijection over suits and therefore provably preserves every
// draw property and never creates a duplicate card.
//
// Card strings are canonical (see /src/engine/card.js): "<rank><suit>".

/**
 * @typedef {Object} DrawInfo
 * @property {string} type   - stable id
 * @property {number} outs   - standard out count
 * @property {string} label  - human name
 * @property {string} why    - one-line derivation of the count
 */

/** The reference table: draw → outs, with the derivation. */
export const OUTS_REFERENCE = [
  {
    type: 'flush-draw',
    outs: 9,
    label: 'Flush draw',
    why: '13 cards of your suit − 4 already visible (2 in hand, 2 on board) = 9.',
  },
  {
    type: 'oesd',
    outs: 8,
    label: 'Open-ended straight draw',
    why: 'Two different ranks complete the straight, 4 of each suit = 8.',
  },
  {
    type: 'gutshot',
    outs: 4,
    label: 'Gutshot (inside) straight draw',
    why: 'Only one rank fills the gap, 4 of that rank = 4.',
  },
  {
    type: 'two-overcards',
    outs: 6,
    label: 'Two overcards',
    why: 'Pairing either overcard wins vs a made pair: 3 + 3 = 6.',
  },
  {
    type: 'set-draw',
    outs: 2,
    label: 'Pocket pair (drawing to a set)',
    why: 'Only the two remaining cards of your rank make a set = 2.',
  },
  {
    type: 'flush-oesd',
    outs: 15,
    label: 'Flush draw + open-ended straight draw',
    why: '9 flush outs + 8 straight outs − 2 straight cards that are also your flush suit = 15.',
  },
  {
    type: 'flush-gutshot',
    outs: 12,
    label: 'Flush draw + gutshot',
    why: '9 flush outs + 4 straight outs − 1 straight card that is also your flush suit = 12.',
  },
]

/** Quick lookup by type. */
export const OUTS_BY_TYPE = Object.fromEntries(OUTS_REFERENCE.map((d) => [d.type, d]))

/**
 * One hand-verified layout per draw type: { hole:[c,c], board:[c,c,c] }.
 * Each is chosen so there is a SINGLE clear draw and no ambiguous extra outs.
 * @type {Record<string, {hole: [string,string], board: [string,string,string]}>}
 */
export const OUTS_TEMPLATES = {
  // 9h6h on Kh4h2s: hearts seen = 9h6h Kh4h (4) → 9 left. No straight (9-6-4-2
  // is gappy), no pair, 9/6 are not overcards to the K. Pure flush draw.
  'flush-draw': { hole: ['9h', '6h'], board: ['Kh', '4h', '2s'] },

  // 6c5d on 7h8sAc: you hold 5-6, board 7-8 → a 4 or a 9 completes (open-ended),
  // 8 outs. Only 2 clubs so no flush draw; 5/6 sit under the Ace so no overcards.
  oesd: { hole: ['6c', '5d'], board: ['7h', '8s', 'Ac'] },

  // 9h8s on 6c5dAc: you hold 9-8 with 6-5 on board → only a 7 fills 9-8-7-6-5,
  // 4 outs (inside). No flush (2 clubs), 9/8 under the Ace so no overcards.
  gutshot: { hole: ['9h', '8s'], board: ['6c', '5d', 'Ac'] },

  // AhKs on 8c5d2h: A and K are both overcards to an 8-high board. Pair either =
  // 3 + 3 = 6. Only 2 hearts (no flush draw), no straight draw.
  'two-overcards': { hole: ['Ah', 'Ks'], board: ['8c', '5d', '2h'] },

  // 7h7s on Kd9c2h: a pocket pair under the board; only the two remaining 7s make
  // a set = 2. No flush/straight draw.
  'set-draw': { hole: ['7h', '7s'], board: ['Kd', '9c', '2h'] },

  // 9h8h on 7h6h2s: flush draw (9h8h7h6h = 4 hearts → 9 outs) PLUS open-ended
  // straight (9-8-7-6 → a T or a 5). The Th and 5h are already counted in the 9
  // flush outs, so straight adds only 6 new → 9 + 6 = 15. Classic monster draw.
  'flush-oesd': { hole: ['9h', '8h'], board: ['7h', '6h', '2s'] },

  // KhJh on Qh9h4s: flush draw (KhJhQh9h = 4 hearts → 9 outs) PLUS a gutshot (only
  // a T fills K-Q-J-T-9). The Th is already one of the 9 flush outs, so the
  // straight adds only 3 new → 9 + 3 = 12.
  'flush-gutshot': { hole: ['Kh', 'Jh'], board: ['Qh', '9h', '4s'] },
}
