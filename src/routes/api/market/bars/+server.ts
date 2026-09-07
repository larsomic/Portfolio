import { json, type RequestEvent } from "@sveltejs/kit";

import {
  barsForRange,
  intradayStats,
  isMinuteRange,
  isRangeKey,
  symbolStats,
} from "$lib/alpaca.js";
import { alpacaErrorResponse, getBars } from "$lib/server/alpaca.js";

export const prerender = false;

const SYMBOL_RE = /^[A-Z][A-Z.-]{0,9}$/;

function badRequest(message: string): Response {
  return json(
    { error: { kind: "not-found", message } },
    { status: 400 },
  );
}

/**
 * GET /api/market/bars?symbol=AAPL&range=6M
 * OHLCV bars plus a summary for the charted window. `range=1D` returns the
 * most recent session's minute bars; anything else is daily closes.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const symbol = (event.url.searchParams.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  if (!SYMBOL_RE.test(symbol)) {
    return badRequest("That doesn't look like a ticker symbol.");
  }

  const rawRange = event.url.searchParams.get("range");
  const range = isRangeKey(rawRange) ? rawRange : "6M";

  try {
    const minuteBars = isMinuteRange(range);
    const bars = await getBars(symbol, {
      limit: barsForRange(range),
      timeframe: minuteBars ? "1min" : "1day",
    });
    if (bars.length === 0) {
      return json(
        {
          error: {
            kind: "not-found",
            message: `No price history for ${symbol} on this feed.`,
          },
        },
        { status: 404 },
      );
    }

    if (minuteBars) {
      // The fetch spans a couple of sessions so stats can compare against the
      // prior close; the chart itself only plots the latest session.
      const lastDate = bars[bars.length - 1]!.date;
      const sessionBars = bars.filter((b) => b.date === lastDate);
      return json(
        { symbol, range, bars: sessionBars, stats: intradayStats(bars) },
        // Intraday ticks move; sixty seconds of cache stays polite on the
        // free plan's rate limits.
        { headers: { "cache-control": "public, max-age=60" } },
      );
    }

    // Daily closes settle once a day; ten minutes of cache is plenty.
    return json(
      { symbol, range, bars, stats: symbolStats(bars) },
      { headers: { "cache-control": "public, max-age=600" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
