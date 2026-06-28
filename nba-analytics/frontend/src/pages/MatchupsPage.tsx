import React, { useMemo, useState } from 'react'
import type { Data } from '../lib/types'
import { n, fixed1 } from '../lib/format'

export const MatchupsPage: React.FC<{ d: Data }> = ({ d }) => {
  const teams = useMemo(() => [...d.teamAdv].sort((a, b) => a.abbr.localeCompare(b.abbr)), [d.teamAdv])
  const [a, setA] = useState('BOS'); const [b, setB] = useState('DEN')
  const ta = teams.find(t => t.abbr === a) || teams[0]
  const tb = teams.find(t => t.abbr === b) || teams[1]
  const margin = n(ta.net) - n(tb.net)
  const pA = 1 / (1 + Math.pow(10, -margin / 12))
  const metrics = [
    { k: 'win_pct', lab: 'WIN %', f: (v: number) => (v * 100).toFixed(1), hi: true },
    { k: 'ortg', lab: 'OFF RATING', f: fixed1, hi: true },
    { k: 'drtg', lab: 'DEF RATING', f: fixed1, hi: false },
    { k: 'net', lab: 'NET RATING', f: fixed1, hi: true },
    { k: 'pace', lab: 'PACE', f: fixed1, hi: true },
    { k: 'efg', lab: 'EFG %', f: (v: number) => (v * 100).toFixed(1), hi: true },
  ]
  return (
    <>
      <div className="page-head"><div><h1 className="page-title">Matchups</h1>
        <p className="sec-sub">2022-23 season profile · win probability from net rating</p></div>
        <div className="toolbar">
          <select className="select" value={a} onChange={e => setA(e.target.value)}>{teams.map(t => <option key={t.abbr}>{t.abbr}</option>)}</select>
          <span className="muted">vs</span>
          <select className="select" value={b} onChange={e => setB(e.target.value)}>{teams.map(t => <option key={t.abbr}>{t.abbr}</option>)}</select>
        </div>
      </div>
      <div className="panel">
        <div className="sec-title">Win probability</div>
        <div className="winprob">
          <div className="a" style={{ flex: pA }}>{ta.abbr} {(pA * 100).toFixed(0)}%</div>
          <div className="b" style={{ flex: 1 - pA }}>{(100 - pA * 100).toFixed(0)}% {tb.abbr}</div>
        </div>
      </div>
      <div className="panel">
        <div className="cmp-row">
          <div className="cmp-side" style={{ justifyContent: 'flex-end' }}><strong style={{ color: 'var(--accent)' }}>{ta.team_name} {n(ta.wins)}-{n(ta.losses)}</strong></div>
          <div className="cmp-lab" />
          <div className="cmp-side right"><strong style={{ color: '#4a9eff' }}>{n(tb.wins)}-{n(tb.losses)} {tb.team_name}</strong></div>
        </div>
        {metrics.map(m => {
          const av = n(ta[m.k]), bv = n(tb[m.k]), max = Math.max(av, bv) || 1
          const aBetter = m.hi ? av > bv : av < bv
          return (
            <div className="cmp-row" key={m.k}>
              <div className="cmp-side"><span className={`cmp-val ${aBetter ? 'win' : ''}`}>{m.f(av)}</span>
                <div className="cmp-bar"><i style={{ width: `${(av / max) * 100}%` }} /></div></div>
              <div className="cmp-lab">{m.lab}</div>
              <div className="cmp-side right"><span className="cmp-val" style={!aBetter ? { color: '#4a9eff' } : {}}>{m.f(bv)}</span>
                <div className="cmp-bar"><i style={{ width: `${(bv / max) * 100}%` }} /></div></div>
            </div>
          )
        })}
      </div>
    </>
  )
}
