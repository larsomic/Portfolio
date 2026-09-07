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
}

export const PROJECTS: Project[] = [
  {
    title: "Sabermetric Seer",
    slug: "/sabermetric-seer",
    description:
      "Tonight's board, league leaders, standings, the transaction wire, and head-to-head player comps — all live from the diamond.",
    source: "MLB Stats API",
    tags: ["sports", "mlb"],
  },
  {
    title: "Fantasy Football",
    slug: "/fantasy-football",
    description:
      "My Sleeper head-to-head league: live weekly scores, round-robin records, and per-player game states.",
    source: "Sleeper API",
    tags: ["sports", "nfl"],
  },
  {
    title: "March Madness",
    slug: "/march-madness",
    description:
      "Eighty-plus years of tournament brackets plus a Cinderella tracker, so upsets have receipts.",
    source: "Sports Reference API",
    tags: ["sports", "ncaa"],
  },
  {
    title: "Colorado Data",
    slug: "/colorado-data",
    description:
      "Denver accident maps, legal-weed sales, crime reports, and bike-and-ped counts — Colorado's own numbers, drawn.",
    source: "Colorado Open Data",
    tags: ["data", "colorado"],
  },
  {
    title: "US Population Comparer",
    slug: "/us-population-comparer",
    description:
      "Pick any two states, metros, or counties and compare income, diversity, jobs, housing, commutes, and health coverage.",
    source: "Data USA · Census ACS",
    tags: ["data", "census"],
  },
  {
    title: "Market Pulse",
    slug: "/market-pulse",
    description:
      "End-of-day equities explorer: daily bars, a growth-of-$100 benchmark overlay, top movers, and the newswire behind the move.",
    source: "Alpaca Market Data API",
    tags: ["finance", "markets"],
  },
];

/** Shipped projects only — used for the "apps in this portfolio" stat on the player card. */
export const LIVE_PROJECTS = PROJECTS.filter((p) => p.status !== "soon");
