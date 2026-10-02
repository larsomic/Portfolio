export interface Project {
  title: string;
  /** `null` means not shipped yet — the card renders as a horizon item with no link. */
  slug: string | null;
  description: string;
  /** The primary upstream data source, shown as its own chip. */
  source?: string;
  tags: string[];
  /** "soon" projects render disabled. */
  status?: "live" | "soon";
  /** Deep-link to the project's source folder in the portfolio repo. */
  repo?: string;
  /** One-line "how it's built" note, grounded in the actual implementation. */
  tech?: string;
  /** Whether the project ships with unit tests (shown as a signal badge). */
  tested?: boolean;
}

const REPO_BASE = "https://github.com/larsomic/Portfolio/tree/main/src/routes";

export const PROJECTS: Project[] = [
  {
    title: "Sabermetric Seer",
    slug: "/sabermetric-seer",
    description:
      "Tonight's board, league leaders, standings, the transaction wire, and head-to-head player comps — all live from the diamond.",
    source: "MLB Stats API",
    tags: ["sports", "mlb"],
    repo: `${REPO_BASE}/sabermetric-seer`,
    tech: "MLB Stats API normalized through typed parsers and rendered with TanStack Table; live game views stitch together five separate stat endpoints with per-endpoint 404 fallbacks.",
    tested: true,
  },
  {
    title: "Fantasy Football",
    slug: "/fantasy-football",
    description:
      "My Sleeper head-to-head league: live weekly scores, round-robin records, and per-player game states.",
    source: "Sleeper API",
    tags: ["sports", "nfl"],
    repo: `${REPO_BASE}/fantasy-football`,
    tech: "Reconstructs full keeper-league history by walking Sleeper's previous_league_id chain, with a session-memoized multi-MB player map and short-lived cache headers.",
    tested: true,
  },
  {
    title: "March Madness",
    slug: "/march-madness",
    description:
      "Eighty-plus years of tournament brackets plus a Cinderella tracker, so upsets have receipts.",
    source: "College Basketball Data API",
    tags: ["sports", "ncaa"],
    repo: `${REPO_BASE}/march-madness`,
    tech: "Server-only loads keep a private API key off the client; the Cinderella tracker bulk-fetches every season since 1985 via a bounded 8-worker fetcher, then computes seed/upset analytics server-side (24h cached).",
    tested: false,
  },
  {
    title: "Colorado Data",
    slug: "/colorado-data",
    description:
      "Denver accident maps, legal-weed sales, crime reports, and bike-and-ped counts — Colorado's own numbers, drawn.",
    source: "Colorado Open Data",
    tags: ["data", "colorado"],
    repo: `${REPO_BASE}/colorado-data`,
    tech: "Server-side SoQL/SODA aggregation against Colorado & Denver open-data portals — escaped WHERE clauses, parallel group-by queries, and latest-date probing, all cached.",
    tested: true,
  },
  {
    title: "US Population Comparer",
    slug: "/us-population-comparer",
    description:
      "Pick any two states, metros, or counties and compare income, diversity, jobs, housing, commutes, and health coverage.",
    source: "Data USA · Census ACS",
    tags: ["data", "census"],
    repo: `${REPO_BASE}/us-population-comparer`,
    tech: "Prerendered shell plus client queries to Data USA's OLAP cubes; pure, unit-tested helpers reconcile the latest common ACS year across any two places.",
    tested: true,
  },
  {
    title: "Market Pulse",
    slug: "/market-pulse",
    description:
      "End-of-day equities explorer: daily bars, a growth-of-$100 benchmark overlay, top movers, and the newswire behind the move.",
    source: "Alpaca Market Data API",
    tags: ["finance", "markets"],
    repo: `${REPO_BASE}/market-pulse`,
    tech: "Seven SvelteKit server endpoints proxy the Alpaca API with server-held credentials, compute OHLCV window stats server-side, and route failures through a typed error taxonomy so each card degrades independently.",
    tested: true,
  },
];

/** Shipped projects only — used for the "apps in this portfolio" stat on the player card. */
export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status !== "soon");
