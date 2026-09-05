import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

interface SpotlightRow {
  id: string;
  rank: number;
  personId: number;
  player: string;
  team: string;
  value: string;
}

interface LeagueLeadersResponse {
  leagueLeaders?: Array<{
    leaders?: Array<{
      rank: number;
      value: string;
      person?: { id: number; fullName: string };
      team?: { name: string };
    }>;
  }>;
}

const API_BASE = "https://statsapi.mlb.com/api/v1/stats/leaders";

async function fetchLeaders(
  category: string,
  season: number,
  group: "hitting" | "pitching",
  key: string,
): Promise<SpotlightRow[]> {
  const url = `${API_BASE}?leaderCategories=${category}&season=${season}&statGroup=${group}&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  const json = (await res.json()) as LeagueLeadersResponse;
  return (json.leagueLeaders?.[0]?.leaders ?? []).map((l, index) => ({
    id: `${key}-${index}`,
    rank: l.rank,
    personId: l.person?.id ?? 0,
    player: l.person?.fullName ?? "Unknown",
    team: l.team?.name ?? "—",
    value: l.value,
  }));
}

export const load = (async ({ setHeaders }) => {
  const season = new Date().getFullYear();

  let hitting: SpotlightRow[];
  let pitching: SpotlightRow[];
  try {
    [hitting, pitching] = await Promise.all([
      fetchLeaders("homeRuns", season, "hitting", "hr"),
      fetchLeaders("earnedRunAverage", season, "pitching", "era"),
    ]);
  } catch {
    throw error(502, "Couldn't reach the MLB Stats API. Try again in a moment.");
  }

  // Leaderboards tick over slowly; five minutes is plenty.
  setHeaders({ "cache-control": "public, max-age=300" });

  return { hitting, pitching, season };
}) satisfies Load;
