import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import type { TeamStanding } from "./columns.js";

interface MlbStandingsResponse {
  records: Array<{
    league: { id: number };
    division: { id: number };
    teamRecords: Array<{
      team: { id: number; name: string };
      wins: number;
      losses: number;
      gamesPlayed: number;
      winningPercentage: string;
      streak?: { streakCode?: string };
      gamesBack: string | null;
      runDifferential: number;
    }>;
  }>;
}

export type Division = {
  id: number;
  name: string;
  teams: TeamStanding[];
};

export type League = {
  id: number;
  name: string;
  divisions: Division[];
};

const API_BASE = "https://statsapi.mlb.com/api/v1/standings";

const divisionNames: Record<number, string> = {
  200: "AL West",
  201: "AL East",
  202: "AL Central",
  203: "NL West",
  204: "NL East",
  205: "NL Central",
};

const leagueNames: Record<number, string> = {
  103: "American League",
  104: "National League",
};

export const load = (async ({ setHeaders }) => {
  const season = new Date().getFullYear();
  const url = `${API_BASE}?leagueId=103,104&season=${season}&standingsTypes=regularSeason`;

  let data: MlbStandingsResponse;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    data = (await res.json()) as MlbStandingsResponse;
  } catch {
    // Standings change at most daily; don't hammer the API again on failure.
    setHeaders({ "cache-control": "no-store" });
    throw error(502, "Failed to load standings from the MLB Stats API.");
  }

  const leagueGroups: Record<number, League> = {};

  for (const record of data.records ?? []) {
    const leagueId = record.league.id;
    const divisionId = record.division.id;

    let league = leagueGroups[leagueId];
    if (!league) {
      league = {
        id: leagueId,
        name: leagueNames[leagueId] ?? `League ${leagueId}`,
        divisions: [],
      };
      leagueGroups[leagueId] = league;
    }

    const division: Division = {
      id: divisionId,
      name: divisionNames[divisionId] ?? `Division ${divisionId}`,
      teams: (record.teamRecords ?? []).map((team) => ({
        teamId: team.team.id,
        teamName: team.team.name,
        wins: team.wins,
        losses: team.losses,
        gamesPlayed: team.gamesPlayed,
        winningPct: team.winningPercentage,
        streakCode: team.streak?.streakCode ?? "—",
        gamesBack: team.gamesBack === "-" ? null : team.gamesBack,
        runDifferential: team.runDifferential,
      })),
    };
    league.divisions.push(division);
  }

  const leagues = Object.values(leagueGroups)
    .sort((a, b) => a.id - b.id)
    .map((league) => ({
      ...league,
      divisions: league.divisions.sort((a, b) => a.name.localeCompare(b.name)),
    }));

  // Standings update once a day at most.
  setHeaders({ "cache-control": "public, max-age=300" });

  return { leagues, season };
}) satisfies Load;
