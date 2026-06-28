import React, { useMemo, useState } from 'react'
import type { Data, Row } from '../lib/types'
import { n, pct, fixed1 } from '../lib/format'
import { Radar } from '../components/Radar'

export const ComparePage: React.FC<{ d: Data }> = ({ d }) => {
  const ps = useMemo(() => [...d.playerStats].sort((a, b) => a.player_name.localeCompare(b.player_name)), [d.playerStats])
  const [a, setA] = useState('Joel Embiid'); const [b, setB] = useState('Luka Doncic')
  const pa = ps.find(p => p.player_name === a) || ps[0]
  const pb = ps.find(p => p.player_name === b) || ps[1]
  // single source of truth so the radar and head-to-head always show the same metrics
  const METRICS = [
    { lab: 'PPG', k: 'ppg', f: fixed1, max: 35 },
    { lab: 'RPG', k: 'rpg', f: fixed1, max: 13 },
    { lab: 'APG', k: 'apg', f: fixed1, max: 11 },
    { lab: 'TS%', k: 'ts_pct', f: pct, max: 0.7 },
    { lab: '3P%', k: 'fg3_pct', f: pct, max: 0.45 },
    { lab: 'STL', k: 'spg', f: fixed1, max: 2.5 },
  ]
  const axes = METRICS.map(m => m.lab)
  const vec = (p: Row) => METRICS.map(m => n(p[m.k]) / m.max)
  const h2h = METRICS
  return (
    <>
      <div className="page-head"><div><h1 className="page-title">Compare Players</h1>
        <p className="sec-sub">2022-23 per-game · radar normalized to league-elite maxima</p></div>
        <div className="toolbar">
          <select className="select" value={a} onChange={e => setA(e.target.value)}>{ps.map(p => <option key={p.player_name}>{p.player_name}</option>)}</select>
          <span className="muted">vs</span>
          <select className="select" value={b} onChange={e => setB(e.target.value)}>{ps.map(p => <option key={p.player_name}>{p.player_name}</option>)}</select>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel"><div className="sec-title">Radar overlay</div>
          <Radar axes={axes} a={vec(pa)} b={vec(pb)} nameA={pa.player_name} nameB={pb.player_name} /></div>
        <div className="panel"><div className="sec-title">Head to head</div>
          <table className="tbl">
            <thead><tr><th className="num" style={{ color: 'var(--accent)' }}>{pa.team}</th><th style={{ textAlign: 'center' }}>STAT</th><th className="num" style={{ color: '#4a9eff' }}>{pb.team}</th></tr></thead>
            <tbody>
              {h2h.map(m => { const av = n(pa[m.k]), bv = n(pb[m.k]); return (
                <tr key={m.k}>
                  <td className={`num ${av >= bv ? '' : 'muted'}`} style={av >= bv ? { color: 'var(--accent)' } : {}}>{m.f(pa[m.k])}</td>
                  <td className="muted" style={{ textAlign: 'center' }}>{m.lab}</td>
                  <td className="num" style={bv > av ? { color: '#4a9eff' } : { color: 'var(--muted)' }}>{m.f(pb[m.k])}</td>
                </tr>) })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
