export interface Project {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  /** "soon" projects render disabled. */
  status?: "live" | "soon";
}

export const PROJECTS: Project[] = [
  {
    title: "Sabermetric Seer",
    slug: "/sabermetric-seer",
    description:
      "MLB stats explorer — league leaders, standings, transactions, and head-to-head player comparisons.",
    tags: ["sports", "mlb"],
  },
  {
    title: "Fantasy Football",
    slug: "/fantasy-football",
    description:
      "Live weekly scores for my Sleeper H2H league, with round-robin records and per-player game states.",
    tags: ["sports", "nfl"],
  },
  {
    title: "March Madness",
    slug: "/march-madness",
    description:
      "NCAA tournament bracket analysis and picks for the craziest month in sports.",
    tags: ["sports", "ncaa"],
  },
  {
    title: "Colorado Data",
    slug: "/colorado-data",
    description:
      "Denver accident maps and the rise of legal weed, straight from Colorado open data.",
    tags: ["data", "colorado"],
  },
  {
    title: "Portfolio P&L",
    slug: "#",
    description:
      "Personal-finance dashboards and market experiments. The next league to join.",
    tags: ["finance", "soon"],
    status: "soon",
  },
];
