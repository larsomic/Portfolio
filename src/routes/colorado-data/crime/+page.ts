import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import {
  fetchAgencies,
  fetchCategoryTotals,
  fetchDailyCounts,
  fetchHourlyCounts,
  fetchYearCategories,
  YEARS,
} from "$lib/colorado-crime.js";

const DEFAULT_AGENCY = "Denver";

export const load = (async ({ url, setHeaders }) => {
  let agencyNames: string[];
  try {
    agencyNames = (await fetchAgencies()).map((r) => r.name);
  } catch {
    throw error(502, "Failed to load crime data from the Colorado Open Data portal.");
  }

  // ?agency= selects an agency; ?agency= (empty) means statewide.
  // A missing param means "first visit" → default to Denver.
  const raw = url.searchParams.get("agency");
  let agency = raw === null ? DEFAULT_AGENCY : raw;
  if (agency !== "" && !agencyNames.includes(agency)) agency = DEFAULT_AGENCY;

  try {
    const a = agency || null; // null means statewide
    const [totals, yearCats, daily, hourly] = await Promise.all([
      fetchCategoryTotals(a),
      Promise.all(
        YEARS.map(async (y) => ({
          year: y,
          cats: await fetchYearCategories(a, y),
        })),
      ),
      fetchDailyCounts(a),
      fetchHourlyCounts(a),
    ]);

    // Crime aggregates are reported with a long lag; cache generously.
    setHeaders({ "cache-control": "public, max-age=3600" });

    return {
      agencies: agencyNames,
      agency,
      totals,
      yearCats: yearCats.flatMap((y) =>
        y.cats.map((c) => ({ year: y.year, cat: c.cat, n: c.n })),
      ),
      daily,
      hourly,
    };
  } catch {
    throw error(502, "Failed to load crime data from the Colorado Open Data portal.");
  }
}) satisfies Load;
