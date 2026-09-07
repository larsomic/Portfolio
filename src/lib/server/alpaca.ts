/**
 * Server-only Alpaca Market Data API client.
 *
 * Credentials live in the private env vars `ALPACA_API_KEY_ID` /
 * `ALPACA_API_SECRET_KEY` and are attached as `APCA-API-KEY-ID` /
 * `APCA-API-SECRET-KEY` headers. They never reach the browser: only the JSON
 * from `/api/market/*` does.
 *
 * Alpaca's OAuth flow (`/oauth/issuetokens`) is for acting *as* another Alpaca
 * account — trading, portfolio custody, that sort of thing. We only read
 * market data, so plain API-key headers are the right (and far simpler) tool.
 *
 * Free-plan caveat: SIP consolidated feeds and some reference endpoints sit
 * behind paid tiers, so every fetcher treats a 403 as "unsupported here" and
 * callers degrade per-section instead of failing the whole page.
 */
import { env } from "$env/dynamic/private";

import { POPULAR_SYMBOLS } from "./popular-symbols.js";

import {
  normalizeBars,
  num,
  normalizeCorporateActions,
  normalizeMovers,
  normalizeNews,
  normalizeSearch,
  normalizeSnapshots,
  quoteFromBars,
  type CorpActions,
  type RawBarsResponse,
  type RawCorpActionsResponse,
  type RawOptionSnapshotsResponse,
  type RawScreenerResponse,
  type RawNewsResponse,
  type RawSnapshotsResponse,
  type Bar,
  type MoverRow,
  type NewsItem,
  type Quote,
  type RangeKey,
  type SearchHit,
} from "$lib/alpaca.js";

const BASE = "https://data.alpaca.markets";

export type AlpacaErrorKind =
  | "missing-config"
  | "unauthorized"
  | "plan-limit"
  | "rate-limit"
  | "not-found"
  | "upstream";

export class AlpacaError extends Error {
  readonly kind: AlpacaErrorKind;
  readonly status?: number;

  constructor(kind: AlpacaErrorKind, message: string, status?: number) {
    super(message);
    this.name = "AlpacaError";
    this.kind = kind;
    this.status = status;
  }
}

/** True when both keys are present — pages use this to show a setup notice. */
export function alpacaConfigured(): boolean {
  return Boolean(env.ALPACA_API_KEY_ID && env.ALPACA_API_SECRET_KEY);
}

const STATUS_BY_KIND: Record<AlpacaErrorKind, number> = {
  "missing-config": 503,
  unauthorized: 502,
  "plan-limit": 403,
  "rate-limit": 429,
  "not-found": 404,
  upstream: 502,
};

/**
 * Turn any thrown value into a JSON error response. The `kind` is what the
 * client switches on, so each section can say "this feed needs a paid plan"
 * instead of showing a blank card. Never includes credentials.
 */
export function alpacaErrorResponse(error: unknown): Response {
  const kind: AlpacaErrorKind =
    error instanceof AlpacaError ? error.kind : "upstream";
  const message =
    error instanceof Error
      ? error.message
      : "Unexpected error talking to the market data API.";
  return new Response(
    JSON.stringify({ error: { kind, message } }),
    {
      status: STATUS_BY_KIND[kind],
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
}

interface CallOptions {
  /** Retry once with these params merged over the originals (feed fallbacks). */
  retryParams?: Record<string, string | number | undefined>;
}

async function call<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  options: CallOptions = {},
): Promise<T> {
  if (!alpacaConfigured()) {
    throw new AlpacaError(
      "missing-config",
      "Alpaca credentials are not set on this server (ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY).",
    );
  }

  const attempt = async (merged: Record<string, string | number | undefined>) => {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": env.ALPACA_API_KEY_ID ?? "",
        "APCA-API-SECRET-KEY": env.ALPACA_API_SECRET_KEY ?? "",
        accept: "application/json",
      },
    });
    return { status: res.status, body: await readBody(res) };
  };

  let result = await attempt(params);

  // A feed or parameter that the account's plan doesn't include answers 403;
  // drop the offending optional params once and try again before giving up.
  if (result.status === 403 && options.retryParams) {
    result = await attempt({ ...params, ...options.retryParams });
  }

  const { status, body } = result;
  if (status === 401) {
    throw new AlpacaError(
      "unauthorized",
      "Alpaca rejected the API keys. Double-check ALPACA_API_KEY_ID / ALPACA_API_SECRET_KEY.",
      status,
    );
  }
  if (status === 403) {
    throw new AlpacaError(
      "plan-limit",
      describePlanLimit(body),
      status,
    );
  }
  if (status === 429) {
    throw new AlpacaError("rate-limit", "Alpaca rate limit hit. Try again shortly.", status);
  }
  if (status === 404) {
    throw new AlpacaError("not-found", describeMessage(body, "Nothing found for that symbol."), status);
  }
  if (status >= 400) {
    throw new AlpacaError(
      "upstream",
      describeMessage(body, `Alpaca responded ${status}.`),
      status,
    );
  }

  return body as T;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 240) };
  }
}

function describeMessage(body: unknown, fallback: string): string {
  const b = body as { message?: string; code?: string } | null;
  if (b?.message && typeof b.message === "string") return b.message;
  return fallback;
}

function describePlanLimit(body: unknown): string {
  const message = describeMessage(body, "");
  if (/plan|subscription|entitle|not allowed/i.test(message)) {
    return `Your Alpaca plan doesn't include this data (${message}).`;
  }
  return message || "Your Alpaca plan doesn't include this data.";
}

/* ---------------------------------------------------------------------------
 * Fetchers
 * ------------------------------------------------------------------------- */

/**
 * Bars, oldest-first. Free-friendly: asks for the IEX feed by default.
 * `timeframe: "1min"` fetches minute bars from roughly the last five calendar
 * days (enough to reach back over a weekend to the latest two sessions).
 */
export async function getBars(
  symbol: string,
  opts: { limit?: number; range?: RangeKey; timeframe?: "1day" | "1min" } = {},
): Promise<Bar[]> {
  const path = `/v2/stocks/${encodeURIComponent(symbol.toUpperCase())}/bars`;
  const minuteBars = opts.timeframe === "1min";
  const limit = opts.limit ?? 130;
  // This API only answers bar queries that carry an explicit start; without
  // one it replies 200 with `bars: null`. Walk back far enough that holidays
  // and weekends can never eat into the requested number of sessions, then
  // let the client slice what it needs.
  const lookbackDays = minuteBars ? 5 : Math.ceil(limit * 1.6 + 10);
  const start = new Date(Date.now() - lookbackDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const end = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const params: Record<string, string | number | undefined> = {
    timeframe: minuteBars ? "1min" : "1day",
    limit,
    start,
    end,
    // Newest-first: with `limit` cutting a page, descending order keeps the
    // recent sessions instead of silently dropping the most recent ones.
    sort: "desc",
    // Split-adjusted so a stock split doesn't look like a crash.
    adjustment: "all",
    feed: env.ALPACA_DATA_FEED || "iex",
  };
  const raw = await call<RawBarsResponse>(path, params, {
    // Some plans reject the explicit feed or the adjustment mode; fall back to
    // whatever defaults the account is entitled to.
    retryParams: {
      feed: undefined,
      adjustment: undefined,
    },
  });
  return normalizeBars(raw);
}

/** Latest prices for several symbols in one shot (snapshot endpoint). */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const list = symbols.map((s) => s.toUpperCase()).filter(Boolean);
  if (list.length === 0) return [];

  try {
    // v2 endpoint; the legacy /v1beta1/snapshots path has been removed.
    const raw = await call<RawSnapshotsResponse>("/v2/stocks/snapshots", {
      symbols: list.join(","),
      feed: env.ALPACA_DATA_FEED || "iex",
    });
    return normalizeSnapshots(raw);
  } catch (error) {
    // Snapshots aren't on every plan. Rebuild quotes from daily bars instead.
    if (error instanceof AlpacaError && error.kind !== "missing-config") {
      const out: Quote[] = [];
      for (const symbol of list.slice(0, 12)) {
        try {
          const bars = await getBars(symbol, { limit: 5 });
          const q = quoteFromBars(symbol, bars);
          if (q) out.push(q);
        } catch {
          // One dead symbol shouldn't sink the rest of the watchlist.
        }
      }
      return out;
    }
    throw error;
  }
}

/** `limit` is expected to be clamped by the caller (`intParam`). */
export async function getNews(symbol: string, limit = 8): Promise<NewsItem[]> {
  const raw = await call<RawNewsResponse>("/v1beta1/news", {
    symbols: symbol.toUpperCase(),
    limit,
    // The news endpoint's only accepted sort values are asc/desc.
    sort: "desc",
  });
  return normalizeNews(raw);
}

export type MoverKind = "gainers" | "losers" | "active";

const MOVER_QUERY: Record<MoverKind, Record<string, string>> = {
  gainers: { sort: "change_rate", direction: "desc" },
  losers: { sort: "change_rate", direction: "asc" },
  active: { sort: "volume", direction: "desc" },
};

/** `limit` is expected to be clamped by the caller (`intParam`). */
export async function getMovers(kind: MoverKind, limit = 8): Promise<MoverRow[]> {
  try {
    const raw = await call<RawScreenerResponse>("/v1beta1/screener/stocks/market", {
      market: "us",
      page_limit: limit,
      fields: "symbol,latest_price,close,change,change_rate,volume,last_trade",
      ...MOVER_QUERY[kind],
    });
    const movers = normalizeMovers(raw);
    if (movers.length > 0) return movers;
  } catch {
    // The screener endpoint is OAuth-only for API-key accounts; fall through
    // to the snapshot-priced universe below.
  }
  return moversFromSnapshots(kind, limit);
}

/**
 * Rank a curated universe of liquid listings from one snapshots call. This is
 * "good enough" movers for a free-plan deployment: it misses small caps, but
 * it's real session data instead of a dead card.
 */
async function moversFromSnapshots(kind: MoverKind, limit: number): Promise<MoverRow[]> {
  const raw = await call<RawSnapshotsResponse>("/v2/stocks/snapshots", {
    symbols: POPULAR_SYMBOLS.map((s) => s.symbol).join(","),
    feed: env.ALPACA_DATA_FEED || "iex",
  });

  const rows: MoverRow[] = [];
  for (const [symbol, snap] of Object.entries(raw ?? {})) {
    if (!snap || typeof snap !== "object" || Array.isArray(snap)) continue;
    const close = snap.dailyBar?.c;
    const prev = snap.prevDailyBar?.c;
    const price = num(snap.latestTrade?.p) ?? num(close);
    if (price === null) continue;
    const prevClose = num(prev);
    const changePct =
      prevClose !== null && prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : null;
    rows.push({ symbol: symbol.toUpperCase(), price, changePct, volume: num(snap.dailyBar?.v) });
  }

  if (kind === "active") {
    rows.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  } else if (kind === "losers") {
    rows.sort(
      (a, b) => (a.changePct ?? Number.POSITIVE_INFINITY) - (b.changePct ?? Number.POSITIVE_INFINITY),
    );
  } else {
    rows.sort(
      (a, b) => (b.changePct ?? Number.NEGATIVE_INFINITY) - (a.changePct ?? Number.NEGATIVE_INFINITY),
    );
  }
  return rows.slice(0, limit);
}

/**
 * Dividends and splits for one symbol over the last two years. Note the
 * endpoint rejects a `type` filter; dividends and splits arrive together.
 */
export async function getCorporateActions(symbol: string): Promise<CorpActions> {
  const raw = await call<RawCorpActionsResponse>("/v1/corporate-actions", {
    symbols: symbol.toUpperCase(),
    limit: 40,
    start: new Date(Date.now() - 730 * 86_400_000).toISOString().slice(0, 10),
    end: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
  });
  return normalizeCorporateActions(raw);
}

/**
 * Option snapshots for one underlying, one side of the market. The endpoint
 * answers oldest-expiration first, so a modest page comfortably covers the
 * nearest expiration; callers filter with `nearestExpiry`.
 */
export async function getOptionSnapshots(
  symbol: string,
  side: "call" | "put",
): Promise<RawOptionSnapshotsResponse> {
  return await call<RawOptionSnapshotsResponse>(
    `/v1beta1/options/snapshots/${encodeURIComponent(symbol.toUpperCase())}`,
    {
      type: side,
      limit: 250,
    },
  );
}

/** Symbol autocomplete. v2 metadata first, legacy assets endpoint as backup. */
/** `limit` is expected to be clamped by the caller (`intParam`). */
export async function searchSymbols(query: string, limit = 8): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  try {
    const raw = await call<unknown>("/v2/stocks/metadata", {
      search: q,
      statuses: "TRADABLE",
      page_limit: limit,
    });
    const hits = normalizeSearch(raw);
    if (hits.length > 0) return hits;
  } catch {
    // fall through to the legacy endpoint
  }

  try {
    const raw = await call<unknown>("/v1beta1/assets", {
      search: q,
      asset_class: "equity",
      page_limit: limit,
    });
    const hits = normalizeSearch(raw);
    if (hits.length > 0) return hits;
  } catch {
    // fall through to the curated universe
  }

  // Last resort: prefix/substring match against the curated popular list.
  const needle = q.toLowerCase();
  return POPULAR_SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(needle) ||
      s.name.toLowerCase().includes(needle),
  )
    .slice(0, limit)
    .map((s): SearchHit => ({ symbol: s.symbol, name: s.name, type: "equity" }));
}
