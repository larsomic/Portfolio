# Michael Larson — Portfolio

[![CI](https://github.com/larsomic/Portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/larsomic/Portfolio/actions/workflows/ci.yml)

A collection of interactive data explorers built with **SvelteKit 2**, **Svelte 5 (runes)**, **shadcn-svelte**, and **Tailwind CSS v4**. Every project is powered by real public data — MLB and NFL APIs, Colorado open data, and the US Census.

> 🔗 **Live site:** <https://mike-larson.me/>

## Projects

| Project | What it does | Data source |
|---|---|---|
| [**Sabermetric Seer**](https://mike-larson.me/sabermetric-seer) | MLB explorer: league leaders, standings, transactions, a game center with box scores and pitch logs, and head-to-head player comparison (career-per-year charts, traded-player season merging) | [MLB Stats API](https://statsapi.mlb.com/api/v1) |
| [**Fantasy Football**](https://mike-larson.me/fantasy-football) | My Sleeper head-to-head league: member cards with full season history (walked backwards through the previous-league chain), weekly scores with per-player game states and round-robin records | [Sleeper API](https://docs.sleeper.com/) |
| [**US Population Comparer**](https://mike-larson.me/us-population-comparer) | Side-by-side comparison of any two US states, metros, or counties: population, diversity, income, jobs, housing, commute, and health measures | [DataUSA](https://datausa.io/about/api/) |
| [**Colorado Data**](https://mike-larson.me/colorado-data) | Hub for four Colorado open-data explorers (below) | [data.colorado.gov](https://data.colorado.gov) |
| ↳ [Denver Accidents](https://mike-larson.me/denver-accidents) | Map + trend analysis of Denver traffic accidents | Denver Open Data (`cpwf-cznk`) |
| ↳ [Cannabis Economy](https://mike-larson.me/colorado-data/cannabis-economy) | County-by-month retail/medical sales, an animated "bubbles" race through the years, and cumulative growth views | Colorado Open Data (`j7a3-jgd3`) |
| ↳ [Crime in Colorado](https://mike-larson.me/colorado-data/crime) | Agency trends, offense rankings, and weekday/seasonal/hourly patterns | Colorado Open Data (`j6g4-gayk`) |
| ↳ [Bike & Ped Counts](https://mike-larson.me/colorado-data/bike-counts) | CDOT counting stations sized by volume on a map, with hourly and seasonal profiles | Colorado Open Data (`q2qp-xhnj`) |
| [**March Madness**](https://mike-larson.me/march-madness) | NCAA tournament bracket analysis — *coming soon* | — |

The homepage is a scroll-driven story through three scenes (Pullman, WA → Denver, CO → Seattle, WA) built with SVG and CSS only.

## Tech Stack

- **Framework:** SvelteKit 2 · Svelte 5 runes mode
- **UI:** shadcn-svelte (Sera theme, "mist" base color) · Tailwind CSS v4 · Tabler Icons
- **Charts & maps:** LayerChart · D3 scales · MapLibre GL
- **Tables:** TanStack Table (sorting, filtering, column definitions per dataset)
- **Testing:** Vitest 4 (node unit tests via `vitest.config.ts`)
- **Deploy:** Vercel (`@sveltejs/adapter-vercel`, Node 22 runtime)

## Development

```sh
npm install
npm run dev        # start the dev server at http://localhost:5173
```

### Quality gates

All three must pass before a change lands:

```sh
npm run lint       # ESLint (flat config)
npm run check      # svelte-check + TypeScript
npm test           # Vitest unit tests
```

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build (Vercel adapter) |
| `npm run preview` | Preview the production build locally |
| `npm run check:watch` | Type-check in watch mode |

## Project structure

```
src/
├── lib/
│   ├── components/       # App components + shadcn ui/ primitives
│   ├── config/           # Navigation routes and project metadata
│   ├── hooks/            # is-mobile detection, etc.
│   ├── *.ts              # API service layers (MLB, Sleeper, Colorado, DataUSA)
│   └── *.test.ts         # Unit tests for pure data logic
└── routes/               # One folder per project; components colocated with routes
```

Design conventions:

- API access lives in typed service modules under `src/lib/`, and initial page data is fetched in SvelteKit `load` functions (`+page.ts`) with `Cache-Control` headers tuned per dataset — so first visits are server-rendered and upstream APIs aren't hammered. Purely interactive flows (player search, multi-step pickers) fetch on demand; every failure surfaces through `error()` and the shared `+error.svelte` boundary rather than a spinner that never resolves.
- Pure data transformations (parsing, aggregating, sorting) are extracted into functions and unit-tested where they carry real logic (e.g. merging traded-player season splits, innings-as-outs rendering, position ordering).
- shadcn-svelte components live in `src/lib/components/ui/` and are managed with the `shadcn-svelte` CLI.

## Deployment

Deploys to Vercel via `@sveltejs/adapter-vercel`. Static content is prerendered; pages render on demand. See [`vite.config.ts`](vite.config.ts) for adapter configuration.

## Contact

- GitHub: [@larsomic](https://github.com/larsomic)
- LinkedIn: [/in/larson2](https://www.linkedin.com/in/larson2/)
