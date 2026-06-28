/* Shared data shapes for the dashboard.
   Every CSV row is loaded as a flat string map; pages cast/parse as needed. */
export type Row = Record<string, string>

export interface Data {
  teams: Row[]
  standings: Row[]
  games: Row[]
  players: Row[]
  trends: Row[]
  teamSeason: Row[]
  teamAdv: Row[]
  teamShot: Row[]
  playerStats: Row[]
}
