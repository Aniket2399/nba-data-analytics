"""
Export DuckDB marts to CSV for the COURTSIDE dashboard.

Reads the real Kaggle-sourced tables in nba.duckdb and writes analytics-ready
CSVs to BOTH:
  - exports/                 (archive / Tableau)
  - frontend/public/data/    (served by Vite at /data/*.csv)

Includes per-player box stats and shot-zone splits derived from play-by-play.
Run from the project root:  python tableau/export_marts.py
"""
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "nba.duckdb"
EXPORT_DIRS = [ROOT / "exports", ROOT / "frontend" / "public" / "data"]

CURRENT_SEASON = "22022"          # '2' = Regular Season, '2022' = season start (2022-23)
CURRENT_PLAYOFFS = "42022"

# Conference reference (not present in the dataset).
EAST = ['ATL','BOS','BKN','CHA','CHI','CLE','DET','IND','MIA','MIL','NYK','ORL','PHI','TOR','WAS']

for d in EXPORT_DIRS:
    d.mkdir(parents=True, exist_ok=True)


def export(conn, query, filename):
    df = conn.execute(query).df()
    for d in EXPORT_DIRS:
        df.to_csv(d / filename, index=False)
    print(f"  ok  {filename:20s} {len(df):>6} rows")
    return df


def main():
    print("=" * 64)
    print("Exporting marts from nba.duckdb")
    print("=" * 64)
    conn = duckdb.connect(str(DB_PATH), read_only=True)
    conn.execute("SET threads TO 4")

    east = "(" + ",".join(f"'{a}'" for a in EAST) + ")"

    # --- Teams: all-time franchise record ---------------------------------
    export(conn, f"""
        WITH g AS (
            SELECT team_id_home AS team_id, wl_home AS wl, pts_home AS pts, pts_away AS opp
            FROM raw.kaggle_game WHERE season_type IN ('Regular Season','Playoffs')
            UNION ALL
            SELECT team_id_away, wl_away, pts_away, pts_home
            FROM raw.kaggle_game WHERE season_type IN ('Regular Season','Playoffs')
        )
        SELECT
            t.abbreviation AS abbr, t.full_name AS team_name, t.city, t.state,
            CASE WHEN t.abbreviation IN {east} THEN 'East' ELSE 'West' END AS conference,
            CAST(t.year_founded AS INT) AS founded,
            COALESCE(d.arena,'') AS arena, COALESCE(d.headcoach,'') AS coach,
            COUNT(*) AS games,
            SUM((g.wl='W')::INT) AS wins, SUM((g.wl='L')::INT) AS losses,
            ROUND(SUM((g.wl='W')::INT)*1.0/NULLIF(SUM(g.wl IN ('W','L')::INT),0),3) AS win_pct,
            ROUND(AVG(g.pts),1) AS ppg, ROUND(AVG(g.opp),1) AS opp_ppg
        FROM raw.kaggle_team t
        JOIN g ON g.team_id=t.id
        LEFT JOIN raw.kaggle_team_detail d ON d.team_id=t.id
        GROUP BY 1,2,3,4,5,6,7,8
        ORDER BY win_pct DESC
    """, "teams.csv")

    # --- Standings: 2022-23 regular season, with conference ---------------
    export(conn, f"""
        WITH g AS (
            SELECT team_id_home AS team_id, wl_home AS wl, pts_home AS pts, pts_away AS opp
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
            UNION ALL
            SELECT team_id_away, wl_away, pts_away, pts_home
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
        )
        SELECT
            t.abbreviation AS abbr, t.full_name AS team_name,
            CASE WHEN t.abbreviation IN {east} THEN 'East' ELSE 'West' END AS conference,
            COUNT(*) AS gp,
            SUM((wl='W')::INT) AS wins, SUM((wl='L')::INT) AS losses,
            ROUND(SUM((wl='W')::INT)*1.0/NULLIF(COUNT(*),0),3) AS win_pct,
            ROUND(AVG(pts),1) AS pts_for, ROUND(AVG(opp),1) AS pts_against,
            ROUND(AVG(pts)-AVG(opp),1) AS diff
        FROM raw.kaggle_team t JOIN g ON g.team_id=t.id
        GROUP BY 1,2,3
        ORDER BY win_pct DESC
    """, "standings.csv")

    # --- Games: 2022-23 (regular + playoffs) ------------------------------
    export(conn, f"""
        SELECT game_id, CAST(game_date AS DATE) AS game_date, season_type,
            team_abbreviation_home AS home, team_abbreviation_away AS away,
            team_id_home, team_id_away,
            CAST(pts_home AS INT) AS pts_home, CAST(pts_away AS INT) AS pts_away,
            CASE WHEN pts_home>pts_away THEN team_abbreviation_home ELSE team_abbreviation_away END AS winner,
            ABS(CAST(pts_home AS INT)-CAST(pts_away AS INT)) AS margin
        FROM raw.kaggle_game
        WHERE season_id IN ('{CURRENT_SEASON}','{CURRENT_PLAYOFFS}')
          AND pts_home IS NOT NULL AND pts_away IS NOT NULL
        ORDER BY game_date DESC
    """, "games.csv")

    # --- Players: bios ----------------------------------------------------
    export(conn, """
        SELECT display_first_last AS player_name, NULLIF(position,'') AS position,
            NULLIF(height,'') AS height, TRY_CAST(NULLIF(weight,'') AS INT) AS weight,
            NULLIF(team_name,'') AS team, TRY_CAST(NULLIF(jersey,'') AS INT) AS jersey,
            TRY_CAST(from_year AS INT) AS from_year, TRY_CAST(to_year AS INT) AS to_year,
            NULLIF(school,'') AS school, NULLIF(country,'') AS country,
            TRY_CAST(NULLIF(draft_year,'') AS INT) AS draft_year,
            CASE WHEN greatest_75_flag='Y' THEN 1 ELSE 0 END AS hof75
        FROM raw.kaggle_common_player_info
        WHERE display_first_last IS NOT NULL
        ORDER BY (to_year IS NULL), to_year DESC, last_name
    """, "players.csv")

    # --- League trends: scoring evolution by season -----------------------
    export(conn, """
        SELECT CAST(SUBSTR(season_id,2) AS INT) AS season,
            ROUND(AVG((pts_home+pts_away)/2.0),1) AS ppg,
            ROUND(AVG((fg3a_home+fg3a_away)/2.0),1) AS fg3a,
            ROUND(AVG(((fgm_home+0.5*fg3m_home)/NULLIF(fga_home,0)
                     +(fgm_away+0.5*fg3m_away)/NULLIF(fga_away,0))/2.0),3) AS efg,
            ROUND(AVG((reb_home+reb_away)/2.0),1) AS rpg,
            ROUND(AVG((ast_home+ast_away)/2.0),1) AS apg,
            COUNT(*) AS games
        FROM raw.kaggle_game
        WHERE season_type='Regular Season' AND LEFT(season_id,1)='2' AND pts_home IS NOT NULL
        GROUP BY 1 HAVING CAST(SUBSTR(season_id,2) AS INT) BETWEEN 1946 AND 2022
        ORDER BY 1
    """, "trends.csv")

    # --- Team season averages (Compare) -----------------------------------
    export(conn, f"""
        WITH g AS (
            SELECT team_id_home tid, wl_home wl, pts_home pts, pts_away opp, fg_pct_home fg_pct,
                   fg3m_home fg3m, reb_home reb, ast_home ast, stl_home stl, blk_home blk, tov_home tov
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
            UNION ALL
            SELECT team_id_away, wl_away, pts_away, pts_home, fg_pct_away, fg3m_away,
                   reb_away, ast_away, stl_away, blk_away, tov_away
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
        )
        SELECT t.abbreviation AS abbr, t.full_name AS team_name, COUNT(*) AS gp,
            ROUND(AVG(pts),1) ppg, ROUND(AVG(opp),1) opp_ppg, ROUND(AVG(fg_pct),3) fg_pct,
            ROUND(AVG(fg3m),1) fg3m, ROUND(AVG(reb),1) rpg, ROUND(AVG(ast),1) apg,
            ROUND(AVG(stl),1) spg, ROUND(AVG(blk),1) bpg, ROUND(AVG(tov),1) topg,
            ROUND(SUM((wl='W')::INT)*1.0/NULLIF(COUNT(*),0),3) win_pct
        FROM raw.kaggle_team t JOIN g ON g.tid=t.id
        GROUP BY 1,2 ORDER BY ppg DESC
    """, "team_season.csv")

    # --- Team advanced ratings (Teams KPIs + Matchups) --------------------
    #   poss = FGA - OREB + TOV + 0.44*FTA ;  ORtg = 100*pts/poss
    export(conn, f"""
        WITH g AS (
            SELECT team_id_home tid, wl_home wl, pts_home pts, pts_away opp,
                   fga_home fga, fgm_home fgm, fg3m_home fg3m, oreb_home oreb, tov_home tov, fta_home fta,
                   fga_away ofga, oreb_away ooreb, tov_away otov, fta_away ofta
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
            UNION ALL
            SELECT team_id_away, wl_away, pts_away, pts_home,
                   fga_away, fgm_away, fg3m_away, oreb_away, tov_away, fta_away,
                   fga_home, oreb_home, tov_home, fta_home
            FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}' AND season_type='Regular Season'
        )
        SELECT t.abbreviation AS abbr, t.full_name AS team_name,
            CASE WHEN t.abbreviation IN {east} THEN 'East' ELSE 'West' END AS conference,
            COUNT(*) gp, SUM((wl='W')::INT) wins, SUM((wl='L')::INT) losses,
            ROUND(SUM((wl='W')::INT)*1.0/NULLIF(COUNT(*),0),3) win_pct,
            ROUND(100*SUM(pts)/NULLIF(SUM(fga-oreb+tov+0.44*fta),0),1) AS ortg,
            ROUND(100*SUM(opp)/NULLIF(SUM(ofga-ooreb+otov+0.44*ofta),0),1) AS drtg,
            ROUND(100*SUM(pts)/NULLIF(SUM(fga-oreb+tov+0.44*fta),0)
                - 100*SUM(opp)/NULLIF(SUM(ofga-ooreb+otov+0.44*ofta),0),1) AS net,
            ROUND(AVG(fga-oreb+tov+0.44*fta),1) AS pace,
            ROUND(AVG((fgm+0.5*fg3m)/NULLIF(fga,0)),3) AS efg
        FROM raw.kaggle_team t JOIN g ON g.tid=t.id
        GROUP BY 1,2,3 ORDER BY net DESC
    """, "team_advanced.csv")

    # --- Per-team shot distribution from play-by-play ---------------------
    export(conn, f"""
        WITH sg AS (SELECT game_id FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}'),
        p AS (
            SELECT pp.player1_team_abbreviation abbr, pp.eventmsgtype et,
                   COALESCE(pp.homedescription,'')||COALESCE(pp.visitordescription,'') d
            FROM raw.kaggle_play_by_play pp JOIN sg ON sg.game_id=pp.game_id
            WHERE pp.eventmsgtype IN (1,2) AND pp.player1_team_abbreviation IS NOT NULL
        )
        SELECT abbr,
            COUNT(*) fga,
            ROUND(100.0*SUM((d LIKE '%Layup%' OR d LIKE '%Dunk%' OR d LIKE '%Tip%' OR d LIKE '%Hook%')::INT)/COUNT(*),1) AS rim_share,
            ROUND(100.0*SUM((d LIKE '%3PT%')::INT)/COUNT(*),1) AS three_share,
            ROUND(100.0*SUM((d NOT LIKE '%3PT%' AND d NOT LIKE '%Layup%' AND d NOT LIKE '%Dunk%' AND d NOT LIKE '%Tip%' AND d NOT LIKE '%Hook%')::INT)/COUNT(*),1) AS mid_share
        FROM p GROUP BY abbr ORDER BY abbr
    """, "team_shotdist.csv")

    # --- Per-player box stats + shot zones from play-by-play (2022-23) -----
    #   Zones use the shot DISTANCE (feet) parsed from the play-by-play text,
    #   plus the 3PT flag: rim 0-4ft, short 5-9, mid 10-15, long2 16ft-arc, three.
    #   (Corner vs above-break 3 isn't derivable — feed only records 3s at 24ft+.)
    export(conn, f"""
        WITH sg AS (SELECT game_id FROM raw.kaggle_game WHERE season_id='{CURRENT_SEASON}'),
        pbp AS (
            SELECT p.game_id, p.eventmsgtype et, p.player1_id pid, p.player1_name nm,
                   p.player2_id aid, p.player1_team_abbreviation abbr,
                   COALESCE(p.homedescription,'')||COALESCE(p.visitordescription,'') d
            FROM raw.kaggle_play_by_play p JOIN sg ON sg.game_id=p.game_id
        ),
        z AS (
            SELECT pid, nm, aid, abbr, et, game_id, d,
                TRY_CAST(regexp_extract(d, '([0-9]+)' || chr(39), 1) AS INT) AS dist,
                (d LIKE '%3PT%') AS is3,
                (d LIKE '%Layup%' OR d LIKE '%Dunk%' OR d LIKE '%Tip%' OR d LIKE '%Hook%' OR d LIKE '%Putback%') AS rimtype
            FROM pbp WHERE et IN (1,2) AND pid IS NOT NULL AND pid<>0
        ),
        zc AS (
            SELECT *, CASE
                WHEN is3 AND COALESCE(dist,26) >= 27 THEN 'c3d'   -- deep 3 (top-of-key)
                WHEN is3 AND COALESCE(dist,26) = 26 THEN 'c3m'    -- mid 3 (wings)
                WHEN is3 THEN 'c3n'                               -- near 3 (corners, <=25ft)
                WHEN COALESCE(dist, CASE WHEN rimtype THEN 0 ELSE 99 END) <= 4 THEN 'rim'
                WHEN dist <= 9 THEN 'short'
                WHEN dist <= 15 THEN 'mid'
                WHEN dist IS NOT NULL THEN 'long2'
                WHEN rimtype THEN 'rim'
                ELSE 'mid'
            END AS zone FROM z
        ),
        fg AS (
            SELECT pid, ANY_VALUE(nm) nm, ANY_VALUE(abbr) abbr, COUNT(DISTINCT game_id) gp,
                COUNT(*) fga, SUM((et=1)::INT) fgm,
                SUM((is3)::INT) fg3a, SUM((is3 AND et=1)::INT) fg3m,
                SUM((zone='rim')::INT) rim_a,     SUM((zone='rim'   AND et=1)::INT) rim_m,
                SUM((zone='short')::INT) short_a, SUM((zone='short' AND et=1)::INT) short_m,
                SUM((zone='mid')::INT) mid_a,     SUM((zone='mid'   AND et=1)::INT) mid_m,
                SUM((zone='long2')::INT) long2_a, SUM((zone='long2' AND et=1)::INT) long2_m,
                SUM((zone='c3n')::INT) c3n_a, SUM((zone='c3n' AND et=1)::INT) c3n_m,
                SUM((zone='c3m')::INT) c3m_a, SUM((zone='c3m' AND et=1)::INT) c3m_m,
                SUM((zone='c3d')::INT) c3d_a, SUM((zone='c3d' AND et=1)::INT) c3d_m
            FROM zc GROUP BY pid
        ),
        ft AS (SELECT pid, SUM((d NOT LIKE '%MISS%')::INT) ftm, COUNT(*) fta
               FROM pbp WHERE et=3 AND pid IS NOT NULL AND pid<>0 GROUP BY pid),
        reb AS (SELECT pid, COUNT(*) reb FROM pbp WHERE et=4 AND pid IS NOT NULL AND pid<>0 GROUP BY pid),
        ast AS (SELECT aid pid, COUNT(*) ast FROM pbp WHERE et=1 AND aid IS NOT NULL AND aid<>0 GROUP BY aid),
        stl AS (SELECT pid, COUNT(*) stl FROM pbp WHERE et=5 AND d LIKE '%STEAL%' AND pid IS NOT NULL AND pid<>0 GROUP BY pid),
        blk AS (SELECT pid, COUNT(*) blk FROM pbp WHERE et=2 AND d LIKE '%BLOCK%' AND pid IS NOT NULL AND pid<>0 GROUP BY pid)
        SELECT fg.nm AS player_name, fg.abbr AS team, fg.gp,
            ROUND((2*(fg.fgm-fg.fg3m)+3*fg.fg3m+COALESCE(ft.ftm,0))*1.0/fg.gp,1) AS ppg,
            ROUND(COALESCE(reb.reb,0)*1.0/fg.gp,1) AS rpg,
            ROUND(COALESCE(ast.ast,0)*1.0/fg.gp,1) AS apg,
            ROUND(COALESCE(stl.stl,0)*1.0/fg.gp,1) AS spg,
            ROUND(COALESCE(blk.blk,0)*1.0/fg.gp,1) AS bpg,
            ROUND(fg.fgm*1.0/NULLIF(fg.fga,0),3) AS fg_pct,
            ROUND(fg.fg3m*1.0/NULLIF(fg.fg3a,0),3) AS fg3_pct,
            ROUND((2*(fg.fgm-fg.fg3m)+3*fg.fg3m+COALESCE(ft.ftm,0))
                  /NULLIF(2*(fg.fga+0.44*COALESCE(ft.fta,0)),0),3) AS ts_pct,
            fg.fga, fg.fgm, fg.fg3a, fg.fg3m,
            fg.rim_a, fg.rim_m, fg.short_a, fg.short_m, fg.mid_a, fg.mid_m,
            fg.long2_a, fg.long2_m,
            fg.c3n_a, fg.c3n_m, fg.c3m_a, fg.c3m_m, fg.c3d_a, fg.c3d_m
        FROM fg LEFT JOIN ft ON ft.pid=fg.pid LEFT JOIN reb ON reb.pid=fg.pid
                LEFT JOIN ast ON ast.pid=fg.pid LEFT JOIN stl ON stl.pid=fg.pid
                LEFT JOIN blk ON blk.pid=fg.pid
        WHERE fg.gp>=15
        ORDER BY ppg DESC
    """, "player_stats.csv")

    conn.close()
    print("=" * 64)
    print("Export complete.")
    print("=" * 64)


if __name__ == "__main__":
    main()
