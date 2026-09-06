import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import {
  buildSeasonHistory,
  fetchJson,
  membersUrl,
  parseMembers,
  type RawLeagueUser,
} from "$lib/sleeper.js";

export const load = (async ({ setHeaders }) => {
  const [history, usersRaw] = await Promise.all([
    buildSeasonHistory(),
    fetchJson<RawLeagueUser[]>(membersUrl()),
  ]);

  if (!usersRaw) {
    throw error(502, "Couldn't reach Sleeper. Try again in a moment.");
  }

  // Roster membership changes rarely during a season.
  setHeaders({ "cache-control": "public, max-age=60" });

  return {
    members: parseMembers(usersRaw),
    seasons: history.seasons,
    leagueName: history.name,
  };
}) satisfies Load;
