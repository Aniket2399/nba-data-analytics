import React from 'react'

/* Ranked leaders as a thin stem + dot (visually distinct from solid bars). */
export const Lollipop: React.FC<{ rows: { label: string; value: number; sub?: string }[]; suffix?: string }> =
  ({ rows, suffix }) => {
    const max = Math.max(...rows.map(r => r.value), 1)
    return (
      <div>
        {rows.map(r => {
          const w = (r.value / max) * 100
          return (
            <div className="dist-row" key={r.label} style={{ margin: '9px 0' }}>
              <div className="top">
                <span className="team-tag">{r.label}{r.sub && <span className="muted" style={{ fontWeight: 400 }}> {r.sub}</span>}</span>
                <span className="v">{r.value.toFixed(1)}{suffix || ''}</span>
              </div>
              <div className="lolli-track">
                <i className="stem" style={{ width: `${w}%` }} />
                <i className="ball" style={{ left: `calc(${w}% - 5px)` }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }
