import React from 'react'

/* Offense-vs-Defense quadrant scatter: ORtg on X, DRtg on Y but inverted so
   that lower (better) defense sits at the top. Top-right = elite. */
export const Scatter: React.FC<{ pts: { x: number; y: number; label: string; good?: boolean }[]; xAvg: number; yAvg: number }> =
  ({ pts, xAvg, yAvg }) => {
    const W = 880, H = 470, pad = { l: 58, r: 26, t: 22, b: 46 }
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
    const xMin = Math.min(...xs) - 1.5, xMax = Math.max(...xs) + 1.5
    const yMin = Math.min(...ys) - 1.5, yMax = Math.max(...ys) + 1.5
    const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r)
    const sy = (y: number) => pad.t + ((y - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b)  // low DRtg → top
    const ax = sx(xAvg), ay = sy(yAvg)
    const xt = [xMin + 1.5, xAvg, xMax - 1.5], yt = [yMin + 1.5, yAvg, yMax - 1.5]
    return (
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* quadrant shading */}
        <rect x={ax} y={pad.t} width={W - pad.r - ax} height={ay - pad.t} fill="rgba(237,91,42,0.07)" />
        <rect x={pad.l} y={ay} width={ax - pad.l} height={H - pad.b - ay} fill="rgba(74,158,255,0.06)" />
        {/* corner labels */}
        <text className="lab" x={W - pad.r - 6} y={pad.t + 14} textAnchor="end" style={{ fontSize: 9, fill: 'var(--accent)', opacity: 0.7 }}>ELITE ▸ good O &amp; D</text>
        <text className="lab" x={pad.l + 6} y={H - pad.b - 8} style={{ fontSize: 9, fill: '#4a9eff', opacity: 0.7 }}>◂ struggling</text>
        {/* average lines */}
        <line className="grid" x1={ax} y1={pad.t} x2={ax} y2={H - pad.b} />
        <line className="grid" x1={pad.l} y1={ay} x2={W - pad.r} y2={ay} />
        {/* axes */}
        <line className="axis" x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} />
        <line className="axis" x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} />
        {xt.map((v, i) => <text key={i} className="lab" x={sx(v)} y={H - pad.b + 16} textAnchor="middle">{v.toFixed(0)}</text>)}
        {yt.map((v, i) => <text key={i} className="lab" x={pad.l - 8} y={sy(v) + 3} textAnchor="end">{v.toFixed(0)}</text>)}
        <text className="lab" x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" style={{ fontSize: 10 }}>OFFENSIVE RATING →</text>
        <text className="lab" x={-((pad.t + H - pad.b) / 2)} y={14} textAnchor="middle" transform="rotate(-90)" style={{ fontSize: 10 }}>← BETTER DEFENSE (DRtg)</text>
        {/* points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={5.5} fill={p.good ? 'var(--accent)' : '#4a9eff'} stroke="var(--panel)" strokeWidth={1} />
            <text className="lab" x={sx(p.x)} y={sy(p.y) - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--ink)' }}>{p.label}</text>
          </g>
        ))}
      </svg>
    )
  }
