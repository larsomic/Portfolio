import { json, type RequestEvent } from "@sveltejs/kit";

import { alpacaErrorResponse, getNews } from "$lib/server/alpaca.js";

export const prerender = false;

/**
 * GET /api/market/news?symbol=AAPL&limit=7
 * Newest newswire items tagged with one symbol.
 */
export async function GET(event: RequestEvent): Promise<Response> {
  const symbol = (event.url.searchParams.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  if (!/^[A-Z][A-Z.-]{0,9}$/.test(symbol)) {
    return json({ error: { kind: "not-found", message: "Bad symbol." } }, { status: 400 });
  }

  try {
    const news = await getNews(symbol, Number(event.url.searchParams.get("limit") ?? 7));
    return json(
      { news },
      { headers: { "cache-control": "public, max-age=300" } },
    );
  } catch (error) {
    return alpacaErrorResponse(error);
  }
}
