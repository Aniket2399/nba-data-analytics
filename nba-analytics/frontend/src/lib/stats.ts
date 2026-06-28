import type { Row } from './types'

/** Current win/loss streak for a team, e.g. "W3" / "L2", from its games
    (newest first), regular season only. */
export function streak(games: Row[], team: string): string {
  const gs = games.filter(g => (g.home === team || g.away === team) && g.season_type === 'Regular Season')
  if (!gs.length) return '—'
  const first = gs[0].winner === team
  let count = 0
  for (const g of gs) { if ((g.winner === team) === first) count++; else break }
  return `${first ? 'W' : 'L'}${count}`
}
