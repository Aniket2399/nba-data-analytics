import type { Row } from './types'

/* Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes
   ("") and \r\n. Returns an array of objects keyed by the header row. */
export function parseCSV(text: string): Row[] {
  const rows: string[][] = []
  let field = '', row: string[] = [], q = false
  const s = text.replace(/\r/g, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++ } else q = false } else field += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  if (!rows.length) return []
  const h = rows[0]
  return rows.slice(1).filter(r => r.length > 1 || r[0] !== '')
    .map(r => { const o: Row = {}; h.forEach((k, i) => { o[k.trim()] = (r[i] ?? '').trim() }); return o })
}
