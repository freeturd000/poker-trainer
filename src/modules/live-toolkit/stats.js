// Session stats math for the Live Toolkit (CLAUDE.md §4 Module 7).
//
// Pure functions over an array of session records (see ../../store/liveToolkit.js
// for the shape). No storage, no React — easy to unit-test.

/**
 * Profit/loss for a single session, in dollars. Derived, never stored.
 * @param {{buyIn:number, cashOut:number}} s
 * @returns {number}
 */
export function sessionProfit(s) {
  return (Number(s.cashOut) || 0) - (Number(s.buyIn) || 0)
}

/**
 * @typedef {Object} SessionStats
 * @property {number} count           total sessions
 * @property {number} totalProfit     lifetime net P/L
 * @property {number} totalHours      lifetime hours played
 * @property {number} hourlyRate      totalProfit / totalHours (0 if no hours)
 * @property {number} biggestWin      best single-session result (can be ≤ 0 if never won)
 * @property {number} biggestLoss     worst single-session result (≤ 0)
 * @property {number} winningSessions sessions with profit > 0
 * @property {number} winRate         % of sessions that were winners (0 if none)
 */

/**
 * Aggregate lifetime stats across sessions.
 * @param {Array<object>} sessions
 * @returns {SessionStats}
 */
export function computeSessionStats(sessions) {
  const stats = {
    count: sessions.length,
    totalProfit: 0,
    totalHours: 0,
    hourlyRate: 0,
    biggestWin: 0,
    biggestLoss: 0,
    winningSessions: 0,
    winRate: 0,
  }
  if (sessions.length === 0) return stats

  let best = -Infinity
  let worst = Infinity
  for (const s of sessions) {
    const p = sessionProfit(s)
    stats.totalProfit += p
    stats.totalHours += Number(s.hours) || 0
    if (p > best) best = p
    if (p < worst) worst = p
    if (p > 0) stats.winningSessions += 1
  }
  stats.biggestWin = best
  stats.biggestLoss = worst
  stats.hourlyRate = stats.totalHours > 0 ? stats.totalProfit / stats.totalHours : 0
  stats.winRate = (100 * stats.winningSessions) / sessions.length
  return stats
}
