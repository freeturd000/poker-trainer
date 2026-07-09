// Small shared display helpers for the Live Toolkit. Presentation only.

/** Whole-dollar string, e.g. 6000 → "$6,000". Rounds to the nearest dollar. */
export function money(n) {
  const v = Math.round(Number(n) || 0)
  return `$${Math.abs(v).toLocaleString('en-US')}`
}

/** Signed dollar string, e.g. -250 → "−$250", 300 → "+$300". */
export function signedMoney(n) {
  const v = Math.round(Number(n) || 0)
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return `${sign}${money(v)}`
}

/** Tailwind text color for a profit figure: green up, red down, neutral zero. */
export function profitColor(n) {
  if (n > 0) return 'text-accent-text'
  if (n < 0) return 'text-danger'
  return 'text-ink-body'
}
