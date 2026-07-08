// ⚠️ BANKROLL THRESHOLDS — FLAG FOR REVIEW (CLAUDE.md §4 Module 7, §7).
//
// Pure bankroll/stakes logic: no storage, no React. Given a bankroll, decide which
// cash stakes the player is safely rolled for, using a CONSERVATIVE, documented
// standard. These numbers are opinions about risk, not poker law — review them.
//
// ── The standard used here ──────────────────────────────────────────────────
//   • A "buy-in" = 100 big blinds. Live cash games are typically bought in for
//     ~100bb (many rooms cap the max buy-in around there), so 100bb is the honest
//     unit of risk. Deep/straddled games run bigger, so treat this as a floor.
//   • MIN_BUYINS = 20  → the absolute minimum roll to sit down at a stake without
//     serious risk of ruin from normal variance. Below this you're under-rolled.
//   • COMFORTABLE_BUYINS = 30 → the "you can absorb a downswing and not stress"
//     level. CLAUDE.md §7 cites "20–30+ buy-ins"; 30 is the top of that band and
//     what we call comfortable. Serious regs often keep 40–50+; 30 is a sane, not
//     reckless, floor for "comfortable".
// So $1/$2 (bb $2 → $200 buy-in) wants ~$4,000 (min) to ~$6,000 (comfortable).

export const BUYIN_BB = 100
export const MIN_BUYINS = 20
export const COMFORTABLE_BUYINS = 30

// Common live cash stakes, ASCENDING by stake. buyIn = BUYIN_BB × big blind.
// (Home games can use other blinds; this list drives the bankroll guide, while the
// session tracker lets you type any stakes string.)
export const STAKES = [
  { id: '1-2', label: '$1/$2', sb: 1, bb: 2, buyIn: 200 },
  { id: '1-3', label: '$1/$3', sb: 1, bb: 3, buyIn: 300 },
  { id: '2-5', label: '$2/$5', sb: 2, bb: 5, buyIn: 500 },
  { id: '5-10', label: '$5/$10', sb: 5, bb: 10, buyIn: 1000 },
  { id: '10-20', label: '$10/$20', sb: 10, bb: 20, buyIn: 2000 },
  { id: '10-25', label: '$10/$25', sb: 10, bb: 25, buyIn: 2500 },
]

/**
 * @typedef {'comfortable'|'minimum'|'under'} RollStatus
 * comfortable: ≥ COMFORTABLE_BUYINS · minimum: ≥ MIN_BUYINS (edge) · under: below min.
 */

const STATUS_META = {
  comfortable: { label: 'Rolled', tone: 'good' },
  minimum: { label: 'Minimum', tone: 'warn' },
  under: { label: 'Under-rolled', tone: 'bad' },
}

/** Human/label + tone for a status, for the UI to render consistently. */
export function statusMeta(status) {
  return STATUS_META[status] ?? STATUS_META.under
}

/**
 * Evaluate one stake against a bankroll.
 * @param {number} bankroll
 * @param {{buyIn:number}} stake
 * @returns {{stake:object, buyIns:number, status:RollStatus}}
 */
export function evaluateStake(bankroll, stake) {
  const buyIns = stake.buyIn > 0 ? bankroll / stake.buyIn : 0
  let status
  if (buyIns >= COMFORTABLE_BUYINS) status = 'comfortable'
  else if (buyIns >= MIN_BUYINS) status = 'minimum'
  else status = 'under'
  return { stake, buyIns, status }
}

/** Evaluate every listed stake against a bankroll (ascending order preserved). */
export function evaluateAll(bankroll) {
  return STAKES.map((s) => evaluateStake(bankroll, s))
}

/**
 * The highest stake the bankroll can at least MINIMALLY play (≥ MIN_BUYINS), and
 * whether it clears the comfortable bar. Returns null if under-rolled for even the
 * smallest listed stake.
 * @returns {{stake:object, status:RollStatus, buyIns:number}|null}
 */
export function recommendedStake(bankroll) {
  let best = null
  for (const s of STAKES) {
    const evaln = evaluateStake(bankroll, s)
    if (evaln.status !== 'under') best = evaln // STAKES ascending → keep the biggest
  }
  return best
}
