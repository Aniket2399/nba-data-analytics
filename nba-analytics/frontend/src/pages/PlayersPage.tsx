import React, { useMemo, useState } from 'react'
import type { Data } from '../lib/types'
import { n, pct, fixed1 } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { Donut } from '../components/Donut'
import { HBar } from '../components/HBar'
import { ShotChart } from '../components/ShotChart'

export const PlayersPage: React.FC<{ d: Data }> = ({ d }) => {
  const ps = d.playerStats
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(ps[0]?.player_name)
  const filtered = useMemo(() => ps.filter(p => p.player_name.toLowerCase().includes(q.toLowerCase())), [ps, q])
  const p = ps.find(x => x.player_name === sel) || ps[0]
  const bio = d.players.find(b => b.player_name === p?.player_name)
  if (!p) return <div className="empty">No player data.</div>
  return (
    <>
      <h1 className="page-title">Players</h1>
      <p className="sec-sub">2022-23 · per-game stats &amp; shot profile derived from play-by-play</p>
      <div className="split">
        <div className="rail">
          <div className="rail-head"><span className="t">Players</span><span className="t">{filtered.length}</span></div>
          <div className="rail-search"><input className="input" style={{ minWidth: '100%', width: '100%' }} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="rail-list">
            {filtered.slice(0, 200).map(x => (
              <div key={x.player_name} className={`p-item ${x.player_name === sel ? 'on' : ''}`} onClick={() => setSel(x.player_name)}>
                <div><div className="nm">{x.player_name}</div>
                  <div className="meta">{fixed1(x.ppg)} PPG · {fixed1(x.rpg)} REB · {fixed1(x.apg)} AST</div></div>
                <div className="tm">{x.team}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="page-content" style={{ gap: 14 }}>
          <div className="panel player-card">
            <div><div className="nm">{p.player_name}</div>
              <div className="sub">{bio?.position || '—'} · {bio?.team || p.team} · {p.gp} games</div></div>
            <div className="big-tag">{p.team}</div>
          </div>
          <div className="stat-grid">
            <Kpi lab="PPG" val={fixed1(p.ppg)} note="points" />
            <Kpi lab="RPG" val={fixed1(p.rpg)} note="rebounds" />
            <Kpi lab="APG" val={fixed1(p.apg)} note="assists" />
            <Kpi lab="TS%" val={pct(p.ts_pct)} note="true shooting" />
          </div>
          <ShotChart p={p} />
          <div className="grid-2">
            <div className="chart-card"><div className="sec-title">Shot selection · attempts by zone</div>
              <Donut slices={[
                { label: 'At rim', value: n(p.rim_a), color: '#ED5B2A' },
                { label: 'Short', value: n(p.short_a), color: '#cf7340' },
                { label: 'Mid', value: n(p.mid_a), color: '#9a6a55' },
                { label: 'Long 2', value: n(p.long2_a), color: '#6b6e8c' },
                { label: 'Three', value: n(p.fg3a), color: '#4a9eff' },
              ]} /></div>
            <div className="chart-card"><div className="sec-title">Efficiency by zone · FG%</div>
              <HBar rows={[
                { label: 'RIM', value: n(p.rim_a) ? n(p.rim_m) / n(p.rim_a) * 100 : 0 },
                { label: 'SHORT', value: n(p.short_a) ? n(p.short_m) / n(p.short_a) * 100 : 0 },
                { label: 'MID', value: n(p.mid_a) ? n(p.mid_m) / n(p.mid_a) * 100 : 0 },
                { label: 'LONG 2', value: n(p.long2_a) ? n(p.long2_m) / n(p.long2_a) * 100 : 0 },
                { label: '3PT', value: n(p.fg3a) ? n(p.fg3m) / n(p.fg3a) * 100 : 0 },
              ]} suffix="%" /></div>
          </div>
          <div className="grid-3">
            <Kpi lab="FG%" val={pct(p.fg_pct) + '%'} />
            <Kpi lab="3P%" val={pct(p.fg3_pct) + '%'} />
            <Kpi lab="STL / BLK" val={`${fixed1(p.spg)} / ${fixed1(p.bpg)}`} />
          </div>
        </div>
      </div>
    </>
  )
}
