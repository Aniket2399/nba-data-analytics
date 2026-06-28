import React from 'react'
import type { Data, Row } from '../lib/types'
import { n, pct } from '../lib/format'
import { streak } from '../lib/stats'

export const StandingsPage: React.FC<{ d: Data }> = ({ d }) => {
  const conf = (c: string) => d.standings.filter(s => s.conference === c).sort((a, b) => n(b.win_pct) - n(a.win_pct))
  const Col: React.FC<{ title: string; rows: Row[] }> = ({ title, rows }) => (
    <div className="panel">
      <div className="conf-head"><span className="conf-dot" />{title}</div>
      <table className="tbl">
        <thead><tr><th>#</th><th>Team</th><th className="num">W</th><th className="num">L</th><th className="num">PCT</th><th style={{ width: 90 }}></th><th className="num">DIFF</th><th>STRK</th></tr></thead>
        <tbody>
          {rows.map((t, i) => (
            <tr key={t.abbr}>
              <td className="mono muted">{i + 1}</td>
              <td><span className="team-tag">{t.abbr}</span> <span className="muted">{t.team_name}</span></td>
              <td className="num">{n(t.wins)}</td>
              <td className="num">{n(t.losses)}</td>
              <td className="num">.{pct(t.win_pct).replace('.', '').padStart(3, '0').slice(0, 3)}</td>
              <td><div className="bar-track"><div className="bar-fill" style={{ width: `${n(t.win_pct) * 100}%` }} /></div></td>
              <td className={`num ${n(t.diff) >= 0 ? 'pos' : 'neg'}`}>{n(t.diff) > 0 ? '+' : ''}{t.diff}</td>
              <td><span className={`pill ${streak(d.games, t.abbr).startsWith('W') ? 'w' : 'l'}`}>{streak(d.games, t.abbr)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <>
      <h1 className="page-title">Standings</h1>
      <p className="sec-sub">2022-23 regular season · by conference</p>
      <div className="grid-2">
        <Col title="Eastern Conference" rows={conf('East')} />
        <Col title="Western Conference" rows={conf('West')} />
      </div>
    </>
  )
}
