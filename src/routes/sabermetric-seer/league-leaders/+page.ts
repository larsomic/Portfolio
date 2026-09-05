import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import { mapLeaders, type RawLeaderEntry } from "./mappers.js";

const API_BASE = "https://statsapi.mlb.com/api/v1/stats/leaders";

/** Default board: this year's home run race. */
const DEFAULT_CATEGORY = "homeRuns";

export const load = (async ({ setHeaders }) => {
  const season = String(new Date().getFullYear());

  try {
    const res = await fetch(
      `${API_BASE}?leaderCategories=${DEFAULT_CATEGORY}&season=${season}&statGroup=hitting&limit=25`,
    );
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    const data = (await res.json()) as { leagueLeaders?: RawLeaderEntry[] };

    setHeaders({ "cache-control": "public, max-age=300" });

    return {
      leaders: mapLeaders(data.leagueLeaders, "hitting"),
      category: DEFAULT_CATEGORY,
      season,
    };
  } catch {
    throw error(502, "Failed to load leaders from the MLB Stats API.");
  }
}) satisfies Load;
