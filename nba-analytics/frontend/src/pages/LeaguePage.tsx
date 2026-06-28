import React from 'react'
import type { Data } from '../lib/types'
import { n, pct, fixed1, lastName } from '../lib/format'
import { Kpi } from '../components/Kpi'
import { ScopeHead } from '../components/ScopeHead'
import { Donut } from '../components/Donut'
import { HBar } from '../components/HBar'
import { Lollipop } from '../components/Lollipop'
import { Radial } from '../components/Radial'
import { Scatter } from '../components/Scatter'
import { AreaChart } from '../components/AreaChart'

export const LeaguePage: React.FC<{ d: Data }> = ({ d }) => {
  const tr = d.trends, last = tr[tr.length - 1], prev = tr[tr.length - 2]
  const topNet = [...d.teamAdv].sort((a, b) => n(b.net) - n(a.net)).slice(0, 10).map(t => ({ label: t.abbr, value: n(t.net) }))
  const dShare = (k: string) => n(last[k]) - n(prev[k])
  const leaders = [...d.playerStats].sort((a, b) => n(b.ppg) - n(a.ppg)).slice(0, 10).map(p => ({ label: p.player_name, value: n(p.ppg), sub: p.team }))
  const rebLeaders = [...d.playerStats].sort((a, b) => n(b.rpg) - n(a.rpg)).slice(0, 8).map(p => ({ label: lastName(p.player_name), value: n(p.rpg), sub: p.team }))
  const avgShare = (k: string) => d.teamShot.reduce((s, t) => s + n(t[k]), 0) / (d.teamShot.length || 1)
  const shotMix = [
    { label: 'At rim', value: avgShare('rim_share'), color: '#ED5B2A' },
    { label: 'Mid-range', value: avgShare('mid_share'), color: '#9a6a45' },
    { label: 'Three', value: avgShare('three_share'), color: '#4a9eff' },
  ]
  const scatter = d.teamAdv.map(t => ({ x: n(t.ortg), y: n(t.drtg), label: t.abbr, good: n(t.net) >= 0 }))
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1)
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">League Overview</h1>
          <p className="sec-sub">2022-23 regular season · 30 teams</p></div>
      </div>
      <div className="hero">
        <div className="hero-court-img" />
        <div className="hero-inner">
          <div className="hero-kicker">2022-23 SEASON</div>
          <div className="hero-title">The league, by the numbers</div>
          <div className="hero-sub">Pace is up and the three-point line keeps stretching. Explore every team and player from one place — all figures derived from {Number(65698).toLocaleString()} real games.</div>
        </div>
      </div>
      <ScopeHead title="This Season" badge="2022-23" now />
      <p className="sec-sub" style={{ marginTop: -2 }}>League averages and team net ratings from the latest completed season, vs. the prior year.</p>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <Kpi lab="Points / Game" val={fixed1(last.ppg)} delta={dShare('ppg')} />
        <Kpi lab="3PA / Game" val={fixed1(last.fg3a)} delta={dShare('fg3a')} />
        <Kpi lab="eFG%" val={pct(last.efg) + '%'} delta={(n(last.efg) - n(prev.efg)) * 100} />
        <Kpi lab="Assists / Game" val={fixed1(last.apg)} delta={dShare('apg')} />
        <Kpi lab="Rebounds / Game" val={fixed1(last.rpg)} delta={dShare('rpg')} />
      </div>
      <div className="grid-2">
        <div className="chart-card"><div className="sec-title">League shot mix · share of attempts</div>
          <Donut slices={shotMix} /></div>
        <div className="chart-card"><div className="sec-title">Net rating · top 10 teams</div>
          <HBar rows={topNet} signed /></div>
      </div>
      <div className="grid-2">
        <div className="chart-card"><div className="sec-title">Scoring leaders · PPG</div>
          <Lollipop rows={leaders} /></div>
        <div className="chart-card"><div className="sec-title">Rebounding leaders · RPG</div>
          <Radial rows={rebLeaders} /></div>
      </div>
      <div className="chart-card"><div className="sec-title">Offense vs Defense · rating per 100 possessions</div>
        <Scatter pts={scatter} xAvg={mean(scatter.map(p => p.x))} yAvg={mean(scatter.map(p => p.y))} />
        <div className="legend" style={{ justifyContent: 'center' }}>
          <span><i className="dot" style={{ background: 'var(--accent)' }} />Positive net rating</span>
          <span><i className="dot" style={{ background: '#4a9eff' }} />Negative net rating</span>
        </div>
      </div>

      <ScopeHead title="League History" badge="1946–2023" />
      <p className="sec-sub" style={{ marginTop: -2 }}>How the game has changed across 77 seasons of regular-season play.</p>
      <div className="grid-2">
        <div className="chart-card"><div className="sec-title">Scoring per game · by season</div>
          <AreaChart data={tr} xKey="season" yKey="ppg" /></div>
        <div className="chart-card"><div className="sec-title">The three-point revolution · attempts per game</div>
          <AreaChart data={tr} xKey="season" yKey="fg3a" alt /></div>
      </div>
    </>
  )
}
