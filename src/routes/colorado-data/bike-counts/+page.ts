import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import {
  fetchStationMonths,
  fetchStations,
  fetchYearsCovered,
} from "$lib/colorado-bikes.js";

export const load = (async ({ setHeaders }) => {
  try {
    const [stations, stationMonths, years] = await Promise.all([
      fetchStations(),
      fetchStationMonths(),
      fetchYearsCovered(),
    ]);
    // Count summaries are updated infrequently upstream.
    setHeaders({ "cache-control": "public, max-age=3600" });
    return { stations, stationMonths, years };
  } catch {
    throw error(
      502,
      "Failed to load bike and pedestrian counts from the Colorado Open Data portal.",
    );
  }
}) satisfies Load;
