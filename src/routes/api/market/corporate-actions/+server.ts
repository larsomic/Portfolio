import { json, type RequestEvent } from "@sveltejs/kit";

import { alpacaErrorResponse, getCorporateActions } from "$lib/server/alpaca.js";

export const prerender = false;

const SYMBOL_RE = /^[A-Z][A-Z.-]{0,9}$/;

function badRequest(message: string): Response {
  return json(
    { error: { kind: "not-found", message } },
    { status: 400 },
  );
}

/**
 * GET /api/market/corporate-actions?symbol=AAPL
 * Trailing dividends and splits for one symbol (about the last two years).
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const symbol = (event.url.searchParams.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  if (!SYMBOL_RE.test(symbol)) {
    return badRequest("That doesn't look like a ticker symbol.");
  }

  try {
    const actions = await getCorporateActions(symbol);
    return json(
      actions,
      // Dividends and splits are announced events; an hour of cache is fine.
      { headers: { "cache-control": "public, max-age=3600" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
