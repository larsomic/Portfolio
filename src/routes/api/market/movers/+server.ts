import { json, type RequestEvent } from "@sveltejs/kit";

import { intParam } from "$lib/alpaca.js";
import { alpacaErrorResponse, getMovers, type MoverKind } from "$lib/server/alpaca.js";

export const prerender = false;

const KINDS: readonly MoverKind[] = ["gainers", "losers", "active"];

function isKind(value: string | null): value is MoverKind {
  return value !== null && (KINDS as readonly string[]).includes(value);
}

/**
 * GET /api/market/movers?kind=gainers&limit=8
 * Equity screener: top movers by change or volume.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const rawKind = event.url.searchParams.get("kind");
  const kind: MoverKind = isKind(rawKind) ? rawKind : "gainers";
  const limit = intParam(event.url.searchParams.get("limit"), 8, 1, 20);

  try {
    const movers = await getMovers(kind, limit);
    return json(
      { kind, movers },
      // The screener reflects the current session; a minute of cache keeps us
      // well inside Alpaca's rate limits.
      { headers: { "cache-control": "public, max-age=60" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
