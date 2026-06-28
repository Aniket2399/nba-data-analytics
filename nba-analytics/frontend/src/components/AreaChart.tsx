import React from 'react'
import type { Row } from '../lib/types'
import { n } from '../lib/format'

/* Filled line/area chart over a list of rows (e.g. season trends). */
export const AreaChart: React.FC<{ data: Row[]; xKey: string; yKey: string; alt?: boolean; height?: number; baseline?: number }> =
  ({ data, xKey, yKey, alt, height = 200, baseline }) => {
    const W = 720, H = height, pad = { l: 36, r: 12, t: 12, b: 22 }
    const xs = data.map(d => n(d[xKey])), ys = data.map(d => n(d[yKey]))
    const xMin = Math.min(...xs), xMax = Math.max(...xs)
    const lo = baseline !== undefined ? Math.min(baseline, ...ys) : Math.min(...ys)
    const hi = Math.max(...ys)
    const yMin = baseline !== undefined ? lo : lo - (hi - lo) * 0.1
    const yMax = hi + (hi - lo) * 0.1 || 1
    const sx = (x: number) => pad.l + ((x - xMin) / (xMax - xMin || 1)) * (W - pad.l - pad.r)
    const sy = (y: number) => H - pad.b - ((y - yMin) / (yMax - yMin || 1)) * (H - pad.t - pad.b)
    const pts = data.map(d => [sx(n(d[xKey])), sy(n(d[yKey]))])
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - pad.b} L${pts[0][0].toFixed(1)},${H - pad.b} Z`
    const ticks = 4
    return (
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const yv = yMin + (yMax - yMin) * (i / ticks), y = sy(yv)
          return <g key={i}><line className="grid" x1={pad.l} y1={y} x2={W - pad.r} y2={y} />
            <text className="lab" x={pad.l - 6} y={y + 3} textAnchor="end">{Math.round(yv)}</text></g>
        })}
        {[xMin, Math.round((xMin + xMax) / 2), xMax].map((xv, i) =>
          <text key={i} className="lab" x={sx(xv)} y={H - 6} textAnchor="middle">{xv}</text>)}
        <path className="chart-area" d={area} fill={alt ? 'rgba(74,158,255,0.14)' : 'var(--accent-soft)'} />
        <path className="chart-line" d={line} stroke={alt ? '#4a9eff' : 'var(--accent)'} />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={data.length < 14 ? 3 : 0} fill={alt ? '#4a9eff' : 'var(--accent)'} />)}
      </svg>
    )
  }
