/**
 * Server-only helpers for the College Basketball Data API.
 * The API key lives in the private `CBBD_API_KEY` env var and is never
 * shipped to the browser.
 */
import { env } from "$env/dynamic/private";

import type { NcaaGame, RawCbbGame } from "../ncaa.js";
import { normalizeGame } from "../ncaa.js";

const API_BASE = "https://api.collegebasketballdata.com";

async function fetchGames(params: Record<string, string>): Promise<RawCbbGame[]> {
  const key = env.CBBD_API_KEY;
  if (!key) {
    throw new Error("CBBD_API_KEY is not configured on this server.");
  }
  const url = new URL(`${API_BASE}/games`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("limit", "500");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    throw new Error(`College Basketball Data API responded ${res.status}`);
  }
  return (await res.json()) as RawCbbGame[];
}

/** All NCAA-tournament games for one season (already finished or not). */
export async function fetchNcaaSeasonGames(
  season: number,
): Promise<NcaaGame[]> {
  const raw = await fetchGames({
    season: String(season),
    seasonType: "postseason",
    tournament: "NCAA",
  });
  return raw
    .map(normalizeGame)
    .filter((g): g is NcaaGame => g !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fetch several seasons of NCAA-tournament games in bounded batches so we
 * don't hammer the API all at once.
 */
export async function fetchNcaaSeasons(
  seasons: number[],
  concurrency = 8,
): Promise<NcaaGame[]> {
  const out: NcaaGame[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < seasons.length) {
      const season = seasons[cursor++];
      const games = await fetchNcaaSeasonGames(season);
      out.push(...games);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, seasons.length) }, worker),
  );
  return out;
}
