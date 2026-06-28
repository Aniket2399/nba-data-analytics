import React, { useMemo, useState } from 'react'
import type { Data } from '../lib/types'
import { n, pct, fixed1 } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { AreaChart } from '../components/AreaChart'

export const TeamsPage: React.FC<{ d: Data }> = ({ d }) => {
  const adv = useMemo(() => [...d.teamAdv].sort((a, b) => a.abbr.localeCompare(b.abbr)), [d.teamAdv])
  const [sel, setSel] = useState('BOS')
  const t = adv.find(x => x.abbr === sel) || adv[0]
  const shot = d.teamShot.find(s => s.abbr === t.abbr)
  // net-rating proxy over last 12 games: per-game point differential
  const last = useMemo(() => {
    const gs = d.games.filter(g => (g.home === t.abbr || g.away === t.abbr) && g.season_type === 'Regular Season').slice(0, 12).reverse()
    return gs.map((g, i) => {
      const home = g.home === t.abbr
      const diff = (home ? n(g.pts_home) - n(g.pts_away) : n(g.pts_away) - n(g.pts_home))
      return { i: i + 1, diff } as any
    })
  }, [d.games, t.abbr])
  const dist = shot ? [
    { lab: 'At rim', v: n(shot.rim_share) }, { lab: 'Mid-range', v: n(shot.mid_share) }, { lab: 'Three-point', v: n(shot.three_share) },
  ] : []
  return (
    <>
      <div className="page-head"><div><h1 className="page-title">Team Stats</h1>
        <p className="sec-sub">{t.team_name} · {t.conference}ern Conference · 2022-23</p></div></div>
      <div className="panel"><div className="team-grid">
        {adv.map(x => <button key={x.abbr} className={x.abbr === sel ? 'on' : ''} onClick={() => setSel(x.abbr)}>{x.abbr}</button>)}
      </div></div>
      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="team-banner"><div className="team-logo">{t.abbr}</div>
          <div><div style={{ fontSize: 18, fontWeight: 700 }}>{t.team_name}</div>
            <div className="sub muted" style={{ fontSize: 12 }}>{t.conference}ern Conference</div></div></div>
        <div className="mono" style={{ fontSize: 24, fontWeight: 700 }}>{n(t.wins)}-{n(t.losses)}</div>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <Kpi lab="Record" val={`${n(t.wins)}-${n(t.losses)}`} note={`${pct(t.win_pct)}% win`} />
        <Kpi lab="ORTG" val={fixed1(t.ortg)} note="off rating" />
        <Kpi lab="DRTG" val={fixed1(t.drtg)} note="def rating" />
        <Kpi lab="NET" val={`${n(t.net) > 0 ? '+' : ''}${fixed1(t.net)}`} note="net rating" />
        <Kpi lab="Pace" val={fixed1(t.pace)} note="poss / 48" />
      </div>
      <div className="grid-2">
        <div className="chart-card"><div className="sec-title">Point differential · last 12 games</div>
          <AreaChart data={last} xKey="i" yKey="diff" baseline={0} height={200} /></div>
        <div className="chart-card"><div className="sec-title">Shot distribution (share of FGA)</div>
          {dist.map(r => <div className="dist-row" key={r.lab}>
            <div className="top"><span>{r.lab}</span><span className="v">{r.v}%</span></div>
            <div className="dist-track"><i style={{ width: `${r.v}%` }} /></div></div>)}
        </div>
      </div>
    </>
  )
}
