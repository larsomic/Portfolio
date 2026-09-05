import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";
import { getLocalTimeZone, today } from "@internationalized/date";

import { fetchSchedule } from "$lib/mlb-games.js";

export const load = (async ({ setHeaders }) => {
  const dateParam = today(getLocalTimeZone()).toString();

  try {
    const games = await fetchSchedule(dateParam);
    // Today's board can change minute to minute when games are live.
    setHeaders({ "cache-control": "public, max-age=30" });
    return { games, date: dateParam };
  } catch {
    throw error(502, "Failed to load the MLB schedule from the Stats API.");
  }
}) satisfies Load;
