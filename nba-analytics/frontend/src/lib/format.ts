/* Number / string formatting helpers shared across charts and pages. */

/** Coerce any CSV value to a number, defaulting to 0 for blanks/NaN. */
export const n = (v: any) => { const x = Number(v); return isNaN(x) ? 0 : x }

/** Fraction (0–1) → one-decimal percentage string, e.g. 0.547 → "54.7". */
export const pct = (v: any) => (n(v) * 100).toFixed(1)

/** Value → one decimal place, e.g. 33.42 → "33.4". */
export const fixed1 = (v: any) => n(v).toFixed(1)

/** "Joel Embiid" → "Embiid" (keeps everything after the first token). */
export const lastName = (s: string) => {
  const p = (s || '').trim().split(' ')
  return p.length > 1 ? p.slice(1).join(' ') : s
}
