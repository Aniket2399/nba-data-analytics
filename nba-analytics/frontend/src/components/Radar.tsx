import React from 'react'

/* Radar / spider overlay comparing two players across N normalized axes.
   Player A renders in accent orange, player B in blue. */
export const Radar: React.FC<{ axes: string[]; a: number[]; b: number[]; nameA: string; nameB: string }> =
  ({ axes, a, b, nameA, nameB }) => {
    const S = 300, c = S / 2, R = S / 2 - 40, N = axes.length
    const pt = (i: number, r: number) => {
      const ang = (Math.PI * 2 * i) / N - Math.PI / 2
      return [c + Math.cos(ang) * R * r, c + Math.sin(ang) * R * r]
    }
    const poly = (vals: number[]) => vals.map((v, i) => { const [x, y] = pt(i, Math.max(0.04, Math.min(1, v))); return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}` }).join(' ') + 'Z'
    return (
      <div>
        <svg viewBox={`0 0 ${S} ${S}`} className="chart-svg" style={{ maxWidth: 340, margin: '0 auto' }}>
          {[0.25, 0.5, 0.75, 1].map(r => <polygon key={r} className="court-line" style={{ stroke: 'var(--line)' }}
            points={axes.map((_, i) => pt(i, r).join(',')).join(' ')} />)}
          {axes.map((ax, i) => { const [x, y] = pt(i, 1); return <g key={ax}>
            <line className="grid" x1={c} y1={c} x2={x} y2={y} />
            <text className="lab" x={pt(i, 1.16)[0]} y={pt(i, 1.16)[1] + 3} textAnchor="middle">{ax}</text></g> })}
          <path d={poly(b)} fill="rgba(74,158,255,0.12)" stroke="#4a9eff" strokeWidth={2} />
          <path d={poly(a)} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        </svg>
        <div className="legend" style={{ justifyContent: 'center' }}>
          <span><i className="dot" style={{ background: 'var(--accent)' }} />{nameA}</span>
          <span><i className="dot" style={{ background: '#4a9eff' }} />{nameB}</span>
        </div>
      </div>
    )
  }
