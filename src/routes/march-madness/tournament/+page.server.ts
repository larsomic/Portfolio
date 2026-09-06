import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import { fetchNcaaSeasonGames } from "$lib/server/ncaa.js";
import { latestCompletedSeason } from "$lib/ncaa.js";

export const load = (async ({ setHeaders, url }) => {
  const requested = Number(url.searchParams.get("season"));
  const season =
    Number.isFinite(requested) && requested >= 1939 && requested <= latestCompletedSeason() + 1
      ? requested
      : latestCompletedSeason();

  const games = await fetchNcaaSeasonGames(season);

  if (!games.length) {
    // The default guess found nothing — walk back to the newest season
    // that actually has tournament games.
    for (let s = season - 1; s >= season - 3; s--) {
      const fallback = await fetchNcaaSeasonGames(s);
      if (fallback.length) {
        setHeaders({ "cache-control": "public, max-age=86400" });
        return { season: s, games: fallback };
      }
    }
    throw error(404, `No NCAA tournament games found for season ${season}.`);
  }

  // Finished tournament data never changes; cache hard.
  setHeaders({ "cache-control": "public, max-age=86400" });
  return { season, games };
}) satisfies Load;
