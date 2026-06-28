import React from 'react'

/* Horizontal bars. `signed` renders a diverging +/- scale (net rating);
   `suffix` appends a unit to each value (e.g. "%"). */
export const HBar: React.FC<{ rows: { label: string; value: number; sub?: string }[]; signed?: boolean; suffix?: string }> =
  ({ rows, signed, suffix }) => {
    const max = Math.max(...rows.map(r => Math.abs(r.value)), 1)
    const min = Math.min(...rows.map(r => r.value), 0)
    const lo = signed ? Math.min(min, 0) : 0
    return (
      <div>
        {rows.map(r => (
          <div className="dist-row" key={r.label} style={{ margin: '7px 0' }}>
            <div className="top">
              <span className="team-tag">{r.label}{r.sub && <span className="muted" style={{ fontWeight: 400 }}> {r.sub}</span>}</span>
              <span className={`v ${signed ? (r.value >= 0 ? 'pos' : 'neg') : ''}`}>{signed && r.value > 0 ? '+' : ''}{r.value.toFixed(1)}{suffix || ''}</span>
            </div>
            <div className="dist-track"><i style={{ width: `${((Math.abs(r.value) - (signed ? 0 : lo)) / max) * 100}%`, background: r.value >= 0 ? 'var(--accent)' : '#f08a8a' }} /></div>
          </div>
        ))}
      </div>
    )
  }
