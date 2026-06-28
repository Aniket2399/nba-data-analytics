import React, { useMemo, useState } from 'react'
import type { Row } from '../lib/types'
import { n } from '../lib/format'

/* The shot chart — NBA shot-zone map matching screens/hot-zones-court.png:
   basket at BOTTOM, CLOSE semicircle dome, 5 MID wedges wrapping it, and 3PT
   = 2 corner strips + 3 wings/top wedges. No tabs, no default fill; hover a
   zone -> orange + that zone's real FG%. Distance data: CLOSE=rim+short,
   MID=mid+long2, 3PT=three (every cell in a band shares the band %). */
// each cell maps to a real shot-DISTANCE bucket (the only spatial signal we
// have). Corner 3s are the shortest, top-of-key the deepest, so corner/wing/top
// get the near/mid/deep 3PT buckets — genuinely different real percentages.
const BK: Record<string, [string, string]> = {
  mid: ['mid_m', 'mid_a'], long2: ['long2_m', 'long2_a'],
  c3n: ['c3n_m', 'c3n_a'], c3m: ['c3m_m', 'c3m_a'], c3d: ['c3d_m', 'c3d_a'],
}
const MIDBK = ['mid', 'mid', 'long2', 'mid', 'mid']         // MID L,L-C,C,R-C,R
const PTBK = ['c3n', 'c3m', 'c3d', 'c3m', 'c3n']            // 3PT L,L-C,C,R-C,R
// hoop ON the baseline (250,462) so the close dome merges with the court border
const HX = 250, HY = 462
const pt = (r: number, deg: number) => { const a = deg * Math.PI / 180; return [HX + r * Math.sin(a), HY - r * Math.cos(a)] as const }
const sect = (rI: number, rO: number, d1: number, d2: number) => {
  const [x1, y1] = pt(rO, d1), [x2, y2] = pt(rO, d2), [x3, y3] = pt(rI, d2), [x4, y4] = pt(rI, d1)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${rO} ${rO} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)} A${rI} ${rI} 0 0 0 ${x4.toFixed(1)} ${y4.toFixed(1)} Z`
}
const RC = 88, R3 = 300, BIG = 580            // close radius, 3pt arc radius, outer
const ANG = [-90, -52, -20, 20, 52, 90]      // 5 angular columns
const CLOSE_D = `M${HX - RC} ${HY} A${RC} ${RC} 0 0 1 ${HX + RC} ${HY} Z`   // half-dome on the baseline
const INSIDE3 = 'M48 462 L48 240 A300 300 0 0 1 452 240 L452 462 Z'   // inside the 3pt line
const MIDN = ['MID L', 'MID L-C', 'MID C', 'MID R-C', 'MID R']
const PTN = ['3PT L', '3PT L-C', '3PT C', '3PT R-C', '3PT R']

export const ShotChart: React.FC<{ p: Row }> = ({ p }) => {
  const [hov, setHov] = useState<number | null>(null)
  const stat = (bk: string): [number, number] =>
    bk === 'close' ? [n(p.rim_m) + n(p.short_m), n(p.rim_a) + n(p.short_a)]
      : [n(p[BK[bk][0]]), n(p[BK[bk][1]])]

  const segs = useMemo(() => {
    type S = { id: number; bk: string; d: string; name: string; lx: number; ly: number; rot?: number; layer: 'mid' | 'three' | 'close' }
    const out: S[] = []
    let id = 0
    const mid = (w: number) => (ANG[w] + ANG[w + 1]) / 2
    const lbl = (r: number, w: number) => { const [x, y] = pt(r, mid(w)); return { lx: Math.round(x), ly: Math.round(y) } }
    out.push({ id: id++, bk: 'close', d: CLOSE_D, name: 'CLOSE', lx: 250, ly: 426, layer: 'close' })
    // 5 wedges, split into MID (inside the line) + 3PT (outside) — tiles the
    // whole court so every point is hoverable, no gaps.
    for (let w = 0; w < 5; w++) {
      out.push({ id: id++, bk: MIDBK[w], d: sect(RC, BIG, ANG[w], ANG[w + 1]), name: MIDN[w], ...lbl((RC + R3) / 2, w), layer: 'mid' })
    }
    for (let w = 0; w < 5; w++) {
      const corner = w === 0 || w === 4
      out.push({ id: id++, bk: PTBK[w], d: sect(0, BIG, ANG[w], ANG[w + 1]), name: PTN[w],
        ...lbl(corner ? 230 : R3 + 46, w), rot: corner ? (w === 0 ? -90 : 90) : undefined, layer: 'three' })
    }
    return out
  }, [])

  const hSeg = hov != null ? segs.find(s => s.id === hov) ?? null : null
  const [hm, ha] = hSeg ? stat(hSeg.bk) : [0, 0]
  const hPct = ha ? ((hm / ha) * 100).toFixed(1) : '0.0'
  const Seg: React.FC<{ s: typeof segs[number] }> = ({ s }) =>
    <path className={`zseg ${hov === s.id ? 'on' : ''}`} d={s.d}
      onMouseEnter={() => setHov(s.id)} onMouseLeave={() => setHov(h => h === s.id ? null : h)} />

  return (
    <div className="panel">
      <div className="page-head" style={{ marginBottom: 12 }}>
        <div><div className="sec-title" style={{ marginBottom: 2 }}>Shot Zones · 2022-23</div>
          <div className="sec-sub">{hSeg
            ? <><b>{hSeg.name}</b> — {hm}/{ha} ({hPct}%)</>
            : 'Hover a zone to see its shooting %'}</div></div>
      </div>
      <svg viewBox="0 0 500 466" className="shot-court" style={{ maxWidth: 430, margin: '0 auto' }}>
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0c09" /><stop offset="1" stopColor="#17150f" />
          </linearGradient>
          <clipPath id="court"><rect x="20" y="18" width="460" height="444" rx="6" /></clipPath>
          <clipPath id="in3"><path d={INSIDE3} /></clipPath>
          <mask id="out3">
            <rect x="20" y="18" width="460" height="444" fill="#fff" />
            <path d={INSIDE3} fill="#000" />
          </mask>
        </defs>
        {/* flip vertically so the hoop & backboard sit at the TOP */}
        <g transform="matrix(1 0 0 -1 0 480)">
          <rect x="20" y="18" width="460" height="444" rx="6" fill="url(#floor)" />

          {/* zones — tile the whole court, split by the 3pt line (no gaps) */}
          <g clipPath="url(#court)">
            <g mask="url(#out3)">{segs.filter(s => s.layer === 'three').map(s => <Seg key={s.id} s={s} />)}</g>
            <g clipPath="url(#in3)">{segs.filter(s => s.layer === 'mid').map(s => <Seg key={s.id} s={s} />)}</g>
            {segs.filter(s => s.layer === 'close').map(s => <Seg key={s.id} s={s} />)}
          </g>

          {/* court markings */}
          <rect x="20" y="18" width="460" height="444" rx="6" className="court-line" />
          <path d="M190 18 A60 60 0 0 0 310 18" className="court-line" />
          <rect x="190" y="285" width="120" height="177" className="court-line" fill="none" />
          <circle cx="250" cy="285" r="50" className="court-line" />
          <path d="M48 240 A300 300 0 0 1 452 240" className="court-line" />
          <line x1="48" y1="240" x2="48" y2="462" className="court-line" />
          <line x1="452" y1="240" x2="452" y2="462" className="court-line" />
          <line x1="218" y1="456" x2="282" y2="456" className="court-board" />
          <line x1="250" y1="450" x2="250" y2="456" className="court-rim" />
          <circle cx="250" cy="444" r="7" className="court-rim" />
        </g>

        {/* labels: upright text at the flipped (480 - y) positions */}
        {segs.map(s => hov === s.id ? null : (
          <text key={s.id} x={s.lx} y={480 - s.ly} textAnchor="middle" className="zname"
            transform={s.rot ? `rotate(${s.rot} ${s.lx} ${480 - s.ly})` : undefined}>{s.name}</text>
        ))}
        {hSeg && <g pointerEvents="none">
          <text x={hSeg.lx} y={480 - hSeg.ly} textAnchor="middle" className="zl-pct" fill="#fff"
            transform={hSeg.rot ? `rotate(${hSeg.rot} ${hSeg.lx} ${480 - hSeg.ly})` : undefined}>{hPct}%</text>
          <text x={hSeg.lx} y={480 - hSeg.ly + 15} textAnchor="middle" className="zl-sub" fill="#f2f0ea"
            transform={hSeg.rot ? `rotate(${hSeg.rot} ${hSeg.lx} ${480 - hSeg.ly + 15})` : undefined}>{hm}/{ha}</text>
        </g>}
      </svg>
      <div className="legend" style={{ justifyContent: 'center' }}>
        <span className="muted">Zones by shot distance · corner = nearest 3s, top = deepest · all % real</span>
      </div>
    </div>
  )
}
