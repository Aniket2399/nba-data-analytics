import React, { useState } from 'react'
import './styles/global.css'
import { useData } from './lib/useData'
import { LeaguePage } from './pages/LeaguePage'
import { PlayersPage } from './pages/PlayersPage'
import { TeamsPage } from './pages/TeamsPage'
import { StandingsPage } from './pages/StandingsPage'
import { MatchupsPage } from './pages/MatchupsPage'
import { ComparePage } from './pages/ComparePage'

/* App shell: top nav + hash routing. Each tab maps to a page in src/pages/;
   data is loaded once via useData() and handed to the active page. */
const TABS = [
  { id: 'league', label: 'League' }, { id: 'players', label: 'Players' }, { id: 'teams', label: 'Teams' },
  { id: 'standings', label: 'Standings' }, { id: 'matchups', label: 'Matchups' }, { id: 'compare', label: 'Compare' },
]

const App: React.FC = () => {
  const [page, setPageState] = useState(() => (location.hash.slice(1) || 'league'))
  const setPage = (p: string) => { setPageState(p); location.hash = p }
  const { data, err } = useData()
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-section"><div className="logo" />
          <div><div className="brand">COURTSIDE</div><div className="brand-sub">NBA ANALYTICS</div></div></div>
        <nav className="tabs">{TABS.map(t =>
          <button key={t.id} className={`tab ${page === t.id ? 'on' : ''}`} onClick={() => setPage(t.id)}>{t.label}</button>)}</nav>
        <span className="season-pill">2022-23</span>
      </header>
      <main className="wrap-main">
        {err ? <div className="empty">{err}</div> : !data ? <div className="loading">Loading data…</div> : (
          <section className="page-content">
            {page === 'league' && <LeaguePage d={data} />}
            {page === 'players' && <PlayersPage d={data} />}
            {page === 'teams' && <TeamsPage d={data} />}
            {page === 'standings' && <StandingsPage d={data} />}
            {page === 'matchups' && <MatchupsPage d={data} />}
            {page === 'compare' && <ComparePage d={data} />}
            <div className="foot">Data: Kaggle “Basketball” dataset · 1946–2023 · processed via DuckDB + dbt · player stats &amp; shot zones derived from play-by-play</div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
