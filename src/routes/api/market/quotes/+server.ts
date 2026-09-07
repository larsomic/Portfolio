import { json, type RequestEvent } from "@sveltejs/kit";

import { alpacaErrorResponse, getQuotes } from "$lib/server/alpaca.js";

export const prerender = false;

/**
 * GET /api/market/quotes?symbols=AAPL,MSFT
 * Latest prices for a watchlist. Capped at 12 symbols so one page can't turn
 * into a load test.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const symbols = (event.url.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z][A-Z.-]{0,9}$/.test(s))
    .slice(0, 12);

  if (symbols.length === 0) {
    return json({ quotes: [] }, { headers: { "cache-control": "no-store" } });
  }

  try {
    const quotes = await getQuotes(symbols);
    return json(
      { quotes },
      // Prices move continuously, but a minute of staleness is invisible here.
      { headers: { "cache-control": "public, max-age=60" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
