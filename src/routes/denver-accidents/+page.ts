import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import {
  fetchAccidentsForDay,
  fetchLatestAccidentDate,
  todayStr,
} from "$lib/denver-traffic.js";

export const load = (async ({ url, setHeaders }) => {
  let date = url.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Reporting lags, so "today" is usually empty — find the latest day
    // that actually has data.
    try {
      date = (await fetchLatestAccidentDate()) ?? todayStr(-1);
    } catch {
      throw error(502, "Failed to load accident data from Denver Open Data.");
    }
  }

  let accidents;
  try {
    accidents = await fetchAccidentsForDay(date);
  } catch {
    throw error(502, "Failed to load accident data from Denver Open Data.");
  }

  // Recent days get appended to as reports are filed; keep the cache short.
  setHeaders({ "cache-control": "public, max-age=600" });

  return { date, accidents };
}) satisfies Load;
