import React from 'react'

/* Ring gauge per leader — arc length = value as a share of the field's best. */
export const Radial: React.FC<{ rows: { label: string; value: number; sub?: string }[]; suffix?: string }> =
  ({ rows, suffix }) => {
    const max = Math.max(...rows.map(r => r.value), 1)
    const R = 40, C = 2 * Math.PI * R
    return (
      <div className="radial-grid">
        {rows.map(r => {
          const frac = Math.max(0.04, r.value / max)
          return (
            <div className="radial-cell" key={r.label}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
                <circle cx="50" cy="50" r={R} fill="none" stroke="var(--accent)" strokeWidth="9"
                  strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
                  transform="rotate(-90 50 50)" />
                <text x="50" y="48" textAnchor="middle" className="rad-val">{r.value.toFixed(1)}</text>
                {suffix && <text x="50" y="64" textAnchor="middle" className="rad-unit">{suffix}</text>}
              </svg>
              <div className="rad-name">{r.label}</div>
              {r.sub && <div className="rad-sub">{r.sub}</div>}
            </div>
          )
        })}
      </div>
    )
  }
