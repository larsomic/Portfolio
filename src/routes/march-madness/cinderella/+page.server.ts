import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import { fetchNcaaSeasons } from "$lib/server/ncaa.js";
import {
  contenderResume,
  latestCompletedSeason,
  seedMatchupRates,
  seasonUpsetStats,
  type NcaaGame,
} from "$lib/ncaa.js";

/** First season with a full 64-team bracket — the modern seeding era. */
const FIRST_SEASON = 1985;

export const load = (async ({ setHeaders }) => {
  const newest = latestCompletedSeason();
  const seasons: number[] = [];
  for (let s = FIRST_SEASON; s <= newest; s += 1) seasons.push(s);

  let games: NcaaGame[];
  try {
    games = await fetchNcaaSeasons(seasons);
  } catch (err) {
    console.error("NCAA upset analysis fetch failed:", err);
    throw error(502, "Couldn't reach College Basketball Data. Try again shortly.");
  }

  if (!games.length) {
    throw error(502, "No NCAA tournament games came back — try again in a bit.");
  }

  const matchUps = seedMatchupRates(games);

  // Biggest shocks: rank by seed gap first, then blowout margin.
  const biggestUpsets = games
    .filter((g) => g.upset && g.winnerSeed != null && g.loserSeed != null)
    .sort(
      (a, b) =>
        (b.winnerSeed! - b.loserSeed!) - (a.winnerSeed! - a.loserSeed!) ||
        b.margin - a.margin,
    )
    .slice(0, 25);

  const contenders = contenderResume(games).slice(0, 12);

  const finalFourCities = Object.entries(
    games.reduce<Record<string, number>>((acc, g) => {
      if (g.round === "Final Four" || g.round === "Championship") {
        const city = [g.city, g.venue].filter(Boolean).join(" — ");
        if (city) acc[city] = (acc[city] ?? 0) + 1;
      }
      return acc;
    }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const perSeason = seasonUpsetStats(games).filter((r) => r.season >= 1990);

  setHeaders({ "cache-control": "public, max-age=86400" });

  return {
    newest,
    firstSeason: FIRST_SEASON,
    gameCount: games.length,
    matchUps,
    biggestUpsets,
    contenders,
    finalFourCities,
    perSeason,
  };
}) satisfies Load;
