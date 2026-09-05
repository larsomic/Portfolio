import { error } from "@sveltejs/kit";
import type { Load } from "@sveltejs/kit";

import { fetchCannabisSales } from "$lib/colorado-cannabis.js";

export const load = (async ({ setHeaders }) => {
  try {
    const rows = await fetchCannabisSales();
    // Sales are reported monthly; an hour of cache is invisible.
    setHeaders({ "cache-control": "public, max-age=3600" });
    return { rows };
  } catch {
    throw error(
      502,
      "Failed to load cannabis sales from the Colorado Open Data portal.",
    );
  }
}) satisfies Load;
