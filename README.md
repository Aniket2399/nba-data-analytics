<div align="center">

# 🏀 COURTSIDE — NBA Analytics Platform

### From a 2.2 GB raw database to an interactive scouting dashboard — the full data pipeline, the modelling behind it, and the decisions it drives.

[![Live](https://img.shields.io/badge/Live_Demo-courtside--nba--analytics-ED5B2A?style=for-the-badge)](https://courtside-nba-analytics.vercel.app)
&nbsp;
![React](https://img.shields.io/badge/React-18-149ECA?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![DuckDB](https://img.shields.io/badge/DuckDB-FFF000?style=for-the-badge&logo=duckdb&logoColor=black)
![dbt](https://img.shields.io/badge/dbt-FF694B?style=for-the-badge&logo=dbt&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)

🔗 **Live demo → https://courtside-nba-analytics.vercel.app**

![Title slide](docs/slides/slide-1.png)

### 🖥️ The live dashboard — League Overview

![Dashboard — League Overview](docs/dashboard-league.png)

</div>

| `2.2 GB` | `9` | `11` | `6` |
|:--:|:--:|:--:|:--:|
| raw source database | analytics-ready marts | shot zones from play-by-play | dashboard pages |

---

## 📑 Table of Contents

- [Why build this?](#-why-build-this)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [Data Lineage — the 9 marts](#-data-lineage--the-9-marts)
- [The Dashboard — six pages](#-the-dashboard--six-pages)
- [Live Component: Shot-Zone Explorer](#-live-component-shot-zone-explorer)
- [Use Case: Scouting](#-use-case-scouting)
- [Use Case: A Betting Edge](#-use-case-a-betting-edge)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Rebuild the Data Pipeline](#-rebuild-the-data-pipeline)
- [Deploy to Vercel](#%EF%B8%8F-deploy-to-vercel)
- [Data Notes & Caveats](#-data-notes--caveats)
- [The Impact](#-the-impact)
- [Full Slide Deck](#-full-slide-deck)
- [License](#-license)

---

## 💡 Why build this?

> **A 2.2 GB database is not an insight.** The value is in turning raw rows into answers people can act on — *fast*.

![Why slide](docs/slides/slide-2.png)

| Stage | What it means |
|---|---|
| **01 · Problem** — *Data nobody can use* | Millions of play-by-play rows sit locked in a raw file — no structure, no metrics, no way to ask a question without writing heavy SQL every time. |
| **02 · Build** — *One trusted pipeline* | Ingest → clean → model into **9 query-ready marts** with consistent metrics, tested and refreshable on demand — the single source of truth. |
| **03 · Payoff** — *Faster, sharper calls* | Any question — a team's edge, a player's cold zone, a matchup's odds — is answered in **seconds, not a weekend** of wrangling. |

**Who uses it:** Coaches · Front office · Analysts · Media · Bettors

---

## 🏗️ System Architecture

A classic **medallion architecture** (Bronze → Silver → Gold) built on **DuckDB + dbt**: land raw data as-is, clean and conform it in staging, then aggregate into business-ready marts.

![Architecture slide](docs/slides/slide-3.png)

```
SOURCES                  DATA WAREHOUSE · DuckDB + dbt                       CONSUME
─────────                ─────────────────────────────────────────          ─────────
Kaggle ·     ┌────────────┐   ┌──────────────┐   ┌──────────────┐          Dashboard
basketball → │ RAW·BRONZE │ → │ STAGING·SILVER│ → │  MARTS·GOLD  │  →  ───→  (React + TS)
SQLite 2.2GB │ land as-is │   │ clean · test  │   │ 9 marts, CSV │          BI / ad-hoc SQL
1946→2023    │ pandas load│   │ dbt Views     │   │ ORtg/eFG/TS  │          Scouting & models
             └────────────┘   └──────────────┘   └──────────────┘
```

| Layer | Object type | Transform | Data quality |
|---|---|---|---|
| **Raw · Bronze** | DuckDB tables | None — 1:1 copy, idempotent drop & reload via Python + pandas | — |
| **Staging · Silver** | dbt Views | Type casting · null filtering · dedupe · rename | dbt tests + source freshness |
| **Marts · Gold** | DuckDB SQL → CSV | Aggregations · window calcs · shot-zone parsing · ORtg / eFG / TS | 9 conformed analytics marts |

---

## 🔀 Data Lineage — the 9 marts

Five raw sources are cleaned in dbt staging (one conformed view per source), then composed into **9 gold marts** grouped into **League / Team / Player** domains.

![Data lineage slide](docs/slides/slide-4.png)

| Mart | Domain | Built from |
|---|---|---|
| `games` | League | game |
| `standings` | League | game · team |
| `trends` | League | game |
| `teams` | Team | game · team · detail |
| `team_season` | Team | game · team |
| `team_advanced` | Team | game · team |
| `team_shotdist` | Team | play_by_play |
| `players` | Player | player_info |
| `player_stats` | Player | play_by_play |

> **Raw sources:** `kaggle_games` (scores, box, season_id) · `kaggle_play_by_play` (event-level shot text) · `kaggle_team` (franchise, abbr) · `common_player_info` (bios, draft, school) · `kaggle_team_detail` (arena, coach).

---

## 📊 The Dashboard — six pages

Six pages, **one data model**. Built with React + TypeScript + Vite, every chart hand-rolled in SVG (no charting library).

![Six pages slide](docs/slides/slide-7.png)

> **Player Stats page — live:**
>
> ![Dashboard — Players](docs/dashboard-players.png)

| # | Page | What it shows |
|---|---|---|
| 01 | **League Overview** | Season KPIs (PPG, 3PA, eFG%, APG, RPG) with YoY deltas · shot-mix donut · net-rating bars · scoring lollipop · rebounding radial gauges · offense-vs-defense quadrant scatter · 77-season trend charts |
| 02 | **Team Profiles** | Advanced ratings (ORTG / DRTG / NET / Pace) · last-12-game point differential · shot distribution |
| 03 | **Player Stats** | Searchable roster · per-game stats · interactive shot-zone court · shot-selection donut · efficiency-by-zone bars |
| 04 | **Standings** | East/West tables with win %, point differential, and live win/loss streaks |
| 05 | **Matchup Model** | Head-to-head team profiles with a net-rating-based win-probability bar |
| 06 | **Player Compare** | Two-player radar overlay + synchronized head-to-head stat table |

---

## 🎯 Live Component: Shot-Zone Explorer

Built in **React + SVG** — hover any zone to filter the court and reveal its efficiency. **11 shot zones parsed straight from play-by-play** distance & text; the active zone fills with its real FG% (makes / attempts).

![Shot-zone explorer slide](docs/slides/slide-6.png)

- Hover to filter — any zone highlights instantly with its shooting split.
- Zones by shot distance · corner = nearest 3s · top = deepest · **all % are real**.
- Pure React + SVG — **no charting library**.

---

## 🔍 Use Case: Scouting

The same marts profile a **whole team** and a **single player** — pinpointing exactly where each wins and where they can be attacked.

![Scouting slide](docs/slides/slide-5.png)

**Team · Boston Celtics · 2022-23** — `+7.0` net rating, `.567` eFG%
- **Strength:** Elite on both ends — 115.7 offense, 108.8 defense for a league-best +7.0 net.
- **Watch-out:** A three-heavy diet brings variance — cold nights tighten close games.

**Player · Joel Embiid · 2022-23** — `74.6%` FG at the rim, `.655` true shooting
- **Strength:** Unstoppable at the rim with elite .655 true shooting — force the ball inside.
- **Weakness:** Below-average 3PT (31.8%) and a low assist rate — sag off, load the paint.

> **Answers:** Who's elite — and where · Hot vs cold zones · Efficient or just volume · How to defend.

---

## 💸 Use Case: A Betting Edge

The marts feed simple, transparent models. *For analysis & education — models inform decisions, they don't guarantee outcomes.*

![Betting slide](docs/slides/slide-8.png)

| Market | Signal |
|---|---|
| **ML — Moneyline** | Net-rating gap → win probability; compare to implied odds to spot value. |
| **± Spread** | Off vs def rating gaps estimate a fair margin — flag lines that drift from the modelled spread. |
| **O/U — Totals** | Pace (poss/48) × eFG projects possessions and points — the core of an over/under read. |
| **P — Player props** | Zone efficiency vs an opponent's defensive weak spots sharpens points, rebounds & threes props. |

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| **Ingestion** | Python · Pandas |
| **Warehouse** | DuckDB |
| **Transformation** | dbt · SQL |
| **Export** | Python → CSV |
| **Frontend** | React 18 · TypeScript · Vite |
| **Charts** | Hand-rolled SVG (no library) |
| **Hosting** | Vercel |

---

## 📂 Project Structure

```
.
├── ingestion/                # Python ETL: load Kaggle SQLite → DuckDB (Bronze)
├── transform/                # dbt project — staging models + tests (Silver)
├── tableau/
│   └── export_marts.py       # DuckDB queries → 9 CSV marts (Gold)
├── exports/                  # Generated CSV outputs
├── docs/slides/              # Project presentation (slide-1 … slide-9 .png)
├── frontend/                 # React + TypeScript + Vite dashboard
│   ├── public/data/          # CSVs the dashboard fetches at runtime
│   └── src/
│       ├── App.tsx           # App shell: nav + hash routing
│       ├── lib/              # types · CSV parser · formatters · data hook
│       ├── components/       # reusable SVG charts + UI primitives
│       │   ├── AreaChart.tsx  Donut.tsx     Kpi.tsx
│       │   ├── HBar.tsx       Scatter.tsx   ScopeHead.tsx
│       │   ├── Lollipop.tsx   Radar.tsx
│       │   └── Radial.tsx     ShotChart.tsx
│       └── pages/            # one file per tab
│           ├── LeaguePage.tsx     StandingsPage.tsx
│           ├── PlayersPage.tsx    MatchupsPage.tsx
│           └── TeamsPage.tsx      ComparePage.tsx
├── requirements.txt
└── README.md
```

> **Where to find things:** change a *tab* → `src/pages/` · tweak a *chart* → `src/components/` · touch *data loading / formatting* → `src/lib/`.

---

## 🚀 Quick Start

The exported CSVs are committed under `frontend/public/data/`, so the frontend runs **out of the box — no data download needed**:

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Build for production:

```bash
npm run build        # outputs to frontend/dist/
npm run preview      # serve the production build locally
```

---

## 🔄 Rebuild the Data Pipeline

The large source files are **not** committed (see [Data Notes](#-data-notes--caveats)). You only need them to regenerate the CSV marts from scratch.

```bash
# 1. Download basketball.sqlite (~2.2 GB) from Kaggle and place it at data/basketball.sqlite
#    https://www.kaggle.com/datasets/wyattowalsh/basketball

# 2. Build the warehouse + marts
pip install -r requirements.txt
python ingestion/ingest.py                       # Bronze: load raw → DuckDB
cd transform && dbt build --profiles-dir . && cd ..   # Silver: clean + test
python tableau/export_marts.py                   # Gold: export 9 CSVs

# CSVs land in both exports/ and frontend/public/data/
```

---

## ☁️ Deploy to Vercel

This repo deploys as a Vite app living in the `frontend/` subdirectory.

1. Import the repo at **vercel.com → Add New → Project**.
2. Set **Root Directory** to **`frontend`** — the key step; everything else auto-detects.
   - Framework: **Vite** · Build: `npm run build` · Output: `dist`
3. Deploy. Hash-based routing means **no rewrite rules** are required.

> This project is already live at **https://courtside-nba-analytics.vercel.app**.

---

## 📋 Data Notes & Caveats

- **Source:** Kaggle [*Basketball*](https://www.kaggle.com/datasets/wyattowalsh/basketball) dataset by Wyatt Walsh — **65,698 games, 1946–2023**. Latest completed season featured: **2022-23**.
- **Shot zones:** the source has **no x/y shot coordinates** — only shot *distance*. The 11 zones are therefore reconstructed from distance bands, and **every percentage shown is real** (corner 3s = nearest threes, top-of-key = deepest). This approximation is disclosed in the UI.
- **Excluded from the repo** (regenerable / over GitHub's 100 MB file limit):

  | File | Size | How to get it |
  |---|---|---|
  | `data/basketball.sqlite` | ~2.2 GB | Download from Kaggle (link above) |
  | `nba.duckdb` | ~706 MB | Generated by the pipeline |
  | `frontend/node_modules` | ~82 MB | `npm install` |

---

## 🏆 The Impact

> **From 2.2 GB to decisions that matter.**

![Impact slide](docs/slides/slide-9.png)

- Raw, unusable data → **9 trusted, query-ready datasets**.
- Every team & player **profiled for strengths and weaknesses**.
- One source of truth feeding **scouting, BI, and betting models**.

| Audience | Value |
|---|---|
| **Coaches** | Game plans from real tendencies |
| **Front office** | Roster & trade decisions |
| **Analysts** | Answers without re-wrangling |
| **Media** | Story-ready stats & charts |
| **Bettors** | Model-driven edge |

---

## 🖼️ Full Slide Deck

The complete project presentation (also in [`docs/slides/`](docs/slides)):

| | | |
|:--:|:--:|:--:|
| ![1](https://github.com/Aniket2399/nba-data-analytics/blob/main/nba-analytics/docs/slides/slide-1.png?raw=true) | ![2](docs/slides/slide-2.png) | ![3](docs/slides/slide-3.png) |
| ![4](docs/slides/slide-4.png) | ![5](docs/slides/slide-5.png) | ![6](docs/slides/slide-6.png) |
| ![7](docs/slides/slide-7.png) | ![8](docs/slides/slide-8.png) | ![9](docs/slides/slide-9.png) |

---

## 📝 License

MIT — free to use, learn from, and build on.

<div align="center">

**Built end-to-end: data engineering → modelling → product.** ⭐ Star the repo if it helped.

</div>
