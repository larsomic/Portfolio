import { json, type RequestEvent } from "@sveltejs/kit";

import { intParam } from "$lib/alpaca.js";
import { alpacaErrorResponse, searchSymbols } from "$lib/server/alpaca.js";

export const prerender = false;

/**
 * GET /api/market/search?q=nvid
 * Symbol autocomplete for the search box. Results are short-lived and small.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const q = (event.url.searchParams.get("q") ?? "").slice(0, 32);
  const limit = intParam(event.url.searchParams.get("limit"), 8, 1, 15);

  try {
    const hits = await searchSymbols(q, limit);
    return json(
      { hits },
      // Reference data changes rarely, but autocomplete wants to feel live.
      { headers: { "cache-control": "public, max-age=3600" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
