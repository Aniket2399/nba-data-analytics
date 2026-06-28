import React from 'react'

/* Donut / pie chart with a labelled legend beside it. */
export const Donut: React.FC<{ slices: { label: string; value: number; color: string }[]; size?: number; unit?: string }> =
  ({ slices, size = 168, unit = '%' }) => {
    const total = slices.reduce((s, x) => s + x.value, 0) || 1
    const r = size / 2 - 4, cx = size / 2, cy = size / 2, inner = r * 0.6
    let acc = 0
    const arcs = slices.map(s => {
      const a0 = (acc / total) * 2 * Math.PI - Math.PI / 2; acc += s.value
      const a1 = (acc / total) * 2 * Math.PI - Math.PI / 2
      const big = a1 - a0 > Math.PI ? 1 : 0
      const p = (ang: number, rad: number) => `${(cx + rad * Math.cos(ang)).toFixed(1)} ${(cy + rad * Math.sin(ang)).toFixed(1)}`
      return `M${p(a0, r)} A${r} ${r} 0 ${big} 1 ${p(a1, r)} L${p(a1, inner)} A${inner} ${inner} 0 ${big} 0 ${p(a0, inner)} Z`
    })
    return (
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size, flexShrink: 0 }}>
          {arcs.map((d, i) => <path key={i} d={d} fill={slices[i].color} stroke="var(--panel)" strokeWidth={1.5} />)}
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, margin: '7px 0' }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span>{s.label}</span>
              <span className="mono muted" style={{ marginLeft: 'auto' }}>{(s.value / total * 100).toFixed(1)}{unit}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
