// Seat / position model for the simulator.
//
// The range trainer names its 6-max seats UTG, HJ, CO, BTN, SB, BB (see
// /src/modules/range-trainer/ranges.js). There is no *general* button-rotation
// seat model in /engine — that chart list excludes the BB and only covers
// 6-handed. So this file derives the standard positional labels for any table of
// 2–6 players, using the SAME names as the range trainer so the vocabulary is
// consistent across modules. Pure logic — no state, no React.
//
// Labels are given in seat order starting from the SMALL BLIND and going
// clockwise. The button is the last-to-act preflop seat (except heads-up, where
// the button IS the small blind and acts first preflop).
//
//   2 (heads-up): SB(=BTN), BB
//   3:            SB, BB, BTN
//   4:            SB, BB, UTG, BTN
//   5:            SB, BB, UTG, CO, BTN
//   6:            SB, BB, UTG, HJ, CO, BTN
//
// For 6-handed this yields preflop action order UTG, HJ, CO, BTN, SB, BB —
// exactly the range trainer's convention.

/** Position labels in clockwise order starting from the small blind, by count. */
const LABELS_FROM_SB = {
  2: ['SB', 'BB'],
  3: ['SB', 'BB', 'BTN'],
  4: ['SB', 'BB', 'UTG', 'BTN'],
  5: ['SB', 'BB', 'UTG', 'CO', 'BTN'],
  6: ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'],
}

/**
 * The seat index of the small blind, given the button seat.
 * Heads-up: the button posts the small blind (SB === button). Otherwise the SB
 * is the seat immediately clockwise (left) of the button.
 * @param {number} n - number of players (2–6)
 * @param {number} buttonIndex - seat index of the button
 * @returns {number}
 */
export function smallBlindIndex(n, buttonIndex) {
  return n === 2 ? buttonIndex : (buttonIndex + 1) % n
}

/**
 * The seat index of the big blind, given the button seat.
 * @param {number} n
 * @param {number} buttonIndex
 * @returns {number}
 */
export function bigBlindIndex(n, buttonIndex) {
  return (smallBlindIndex(n, buttonIndex) + 1) % n
}

/**
 * Assign a position label to every seat for a given button.
 * @param {number} n - number of players (2–6)
 * @param {number} buttonIndex - seat index of the button
 * @returns {string[]} labels indexed by seat (i.e. result[seatIndex] = 'BTN')
 */
export function positionLabels(n, buttonIndex) {
  const labels = LABELS_FROM_SB[n]
  if (!labels) throw new Error(`Unsupported player count: ${n} (support 2–6)`)
  const sb = smallBlindIndex(n, buttonIndex)
  const bySeat = new Array(n)
  for (let i = 0; i < n; i++) {
    // labels[i] is the (i)th seat clockwise from the SB
    bySeat[(sb + i) % n] = labels[i]
  }
  return bySeat
}

/**
 * Seat index of the first player to act PREFLOP (before skipping all-ins/folds).
 * Heads-up: the button/SB acts first. Otherwise: first seat left of the big
 * blind (UTG).
 * @param {number} n
 * @param {number} buttonIndex
 * @returns {number}
 */
export function firstToActPreflop(n, buttonIndex) {
  return n === 2 ? buttonIndex : (bigBlindIndex(n, buttonIndex) + 1) % n
}

/**
 * Seat index where POSTFLOP action begins (before skipping all-ins/folds):
 * the first seat clockwise from the button. For 3+ handed that is the small
 * blind; heads-up it is the big blind (so the button acts LAST postflop).
 * @param {number} n
 * @param {number} buttonIndex
 * @returns {number}
 */
export function firstToActPostflop(n, buttonIndex) {
  return (buttonIndex + 1) % n
}
