import { useEffect, useState } from 'react'
import { parseCSV } from './csv'
import type { Data } from './types'

const FILES = ['teams', 'standings', 'games', 'players', 'trends', 'team_season', 'team_advanced', 'team_shotdist', 'player_stats']

/* Loads every CSV mart from /public/data once on mount.
   Returns { data, err } — exactly one is non-null when loading finishes. */
export function useData() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    (async () => {
      try {
        const t = await Promise.all(FILES.map(async f => {
          const r = await fetch(`/data/${f}.csv`); if (!r.ok) throw new Error(`${f}.csv (${r.status})`); return r.text()
        }))
        const [teams, standings, games, players, trends, teamSeason, teamAdv, teamShot, playerStats] = t.map(parseCSV)
        setData({ teams, standings, games, players, trends, teamSeason, teamAdv, teamShot, playerStats })
      } catch (e: any) { setErr(`Could not load ${e.message}. Run: python tableau/export_marts.py`) }
    })()
  }, [])
  return { data, err }
}
