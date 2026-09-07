import { json, type RequestEvent } from "@sveltejs/kit";

import {
  normalizeOptionSnapshots,
  selectOptionWindow,
  type OptionRow,
} from "$lib/alpaca.js";
import {
  alpacaErrorResponse,
  getOptionSnapshots,
} from "$lib/server/alpaca.js";

export const prerender = false;

const SYMBOL_RE = /^[A-Z][A-Z.-]{0,9}$/;

function badRequest(message: string): Response {
  return json(
    { error: { kind: "not-found", message } },
    { status: 400 },
  );
}

interface SidePayload {
  calls: OptionRow[];
  puts: OptionRow[];
}

/**
 * GET /api/market/options?symbol=AAPL&spot=319.80
 * The options chain for the nearest listed expiration, centered on the
 * underlying's latest price when one is provided. Free-plan caveat: this is
 * end-of-day IEX data for the last session, not live quotes.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const symbol = (event.url.searchParams.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  if (!SYMBOL_RE.test(symbol)) {
    return badRequest("That doesn't look like a ticker symbol.");
  }

  const spotRaw = event.url.searchParams.get("spot");
  const spot = spotRaw === null ? null : Number(spotRaw);

  try {
    const [callRaw, putRaw] = await Promise.all([
      getOptionSnapshots(symbol, "call"),
      getOptionSnapshots(symbol, "put"),
    ]);
    const callsAll = normalizeOptionSnapshots(callRaw);
    const putsAll = normalizeOptionSnapshots(putRaw);

    // The nearest expiration is shared across both sides of the market.
    const expiries = [
      ...callsAll.map((r) => r.expiry),
      ...putsAll.map((r) => r.expiry),
    ].sort();
    if (expiries.length === 0) {
      return json(
        { symbol, expiry: null, calls: [], puts: [] },
        { headers: { "cache-control": "public, max-age=600" } },
      );
    }
    const expiry = expiries[0]!;

    const near = (rows: OptionRow[]): OptionRow[] =>
      selectOptionWindow(
        rows.filter((r) => r.expiry === expiry),
        spot,
        7,
      );

    const payload: SidePayload = {
      calls: near(callsAll),
      puts: near(putsAll),
    };

    return json(
      { symbol, expiry, ...payload },
      // End-of-day data on the free plan; ten minutes of cache keeps us far
      // inside the rate limit while switching symbols feels instant.
      { headers: { "cache-control": "public, max-age=600" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
