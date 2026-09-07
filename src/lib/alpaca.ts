/**
 * Shared Alpaca Market Data API helpers.
 *
 * The v1beta1/v2 responses are loose (timestamps show up as RFC-3339 strings
 * *or* epoch nanoseconds depending on endpoint and parameters, and most fields
 * disappear for some asset types), so all parsing lives here in pure functions
 * that the server client and unit tests share. Nothing in this file touches
 * credentials — see `$lib/server/alpaca.js`.
 */

/** One OHLCV bar. `date` is the UTC trading-session day, `YYYY-MM-DD`. */
export interface Bar {
  date: string;
  /** Epoch millis for the session open — keeps chart scales honest. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Latest known price plus the move versus the previous close. */
export interface Quote {
  symbol: string;
  price: number | null;
  change: number | null;
  /** Percent, already multiplied by 100 (e.g. -1.23). */
  changePct: number | null;
  /** `snapshot` = intraday trade feed, `bar` = last end-of-day close. */
  source: "snapshot" | "bar";
  time: string | null;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string | null;
  url: string;
  source: string;
  publishedAt: number | null;
  image: string | null;
}

export interface MoverRow {
  symbol: string;
  price: number | null;
  changePct: number | null;
  volume: number | null;
}

export interface SearchHit {
  symbol: string;
  name: string | null;
  type: string | null;
}

/** Chart windows offered in the UI. `1D` plots minutes of the latest session. */
export const RANGES = ["1D", "1M", "3M", "6M", "1Y"] as const;
export type RangeKey = (typeof RANGES)[number];

/** True for ranges charted with minute bars rather than daily bars. */
export function isMinuteRange(value: unknown): boolean {
  return value === "1D";
}

/** How many daily bars each range needs. */
const RANGE_BARS: Record<RangeKey, number> = {
  // ~390 minute bars per session; two sessions so the intraday stats can
  // compare against the prior close.
  "1D": 800,
  "1M": 32,
  "3M": 66,
  "6M": 130,
  "1Y": 252,
};

export function barsForRange(range: RangeKey): number {
  return RANGE_BARS[range] ?? RANGE_BARS["6M"];
}

export function isRangeKey(value: unknown): value is RangeKey {
  return typeof value === "string" && (RANGES as readonly string[]).includes(value);
}

/* ---------------------------------------------------------------------------
 * Raw shapes (only what we read; everything optional on purpose)
 * ------------------------------------------------------------------------- */

interface RawTimestamped {
  t?: string | number;
  o?: string | number;
  h?: string | number;
  l?: string | number;
  c?: string | number;
  v?: string | number;
}

export interface RawBarsResponse {
  bars?: RawTimestamped[] | null;
  symbol?: string;
}

export interface RawSnapshot {
  symbol?: string;
  latestTrade?: { p?: string | number; t?: string | number } | null;
  latestQuote?: { ap?: string | number; t?: string | number } | null;
  /** v2 snapshots carry the current session's bar and the prior close. */
  dailyBar?: RawTimestamped | null;
  prevDailyBar?: RawTimestamped | null;
}

export interface RawSnapshotsResponse {
  snapshots?: RawSnapshot[] | null;
  /** v2 (`/v2/stocks/snapshots`) returns snapshots keyed by symbol instead. */
  [symbol: string]: RawSnapshot | RawSnapshot[] | null | undefined;
}

export interface RawNewsItem {
  id?: string | number;
  headline?: string;
  summary?: string;
  url?: string;
  source?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  images?: (string | { image_url?: string })[] | null;
}

export interface RawNewsResponse {
  news?: RawNewsItem[] | null;
}

export interface RawScreenerRow {
  symbol?: string;
  latest_price?: string | number;
  close?: string | number;
  change?: string | number;
  change_rate?: string | number;
  volume?: string | number;
}

export interface RawScreenerResponse {
  symbols?: RawScreenerRow[] | null;
}

export interface RawMetadataEntry {
  symbol?: string;
  name?: string;
  type?: string;
  simpleName?: string;
}

export interface RawMetadataResponse {
  datasets?: { metadata?: { entries?: RawMetadataEntry[] } } | null;
  symbols?: RawMetadataEntry[] | null;
}

export interface RawAssetsResponse {
  assets?: { symbol?: string; name?: string; asset_class?: string }[] | null;
}

/* ---------------------------------------------------------------------------
 * Coercion helpers
 * ------------------------------------------------------------------------- */

export function num(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Clamp a query parameter to an integer in `[min, max]`, else `fallback`. */
export function intParam(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

/**
 * Alpaca timestamps are a mess: RFC-3339 strings, epoch seconds, millis, or
 * nanoseconds. Guess by magnitude — anything above ~1e11 is not seconds.
 */
export function toMillis(value: unknown): number | null {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const n = num(value);
  if (n === null || n <= 0) return null;
  if (n > 1e17) return Math.round(n / 1e6); // nanoseconds
  if (n > 1e14) return Math.round(n / 1e3); // microseconds
  if (n > 1e11) return n; // millis
  return Math.round(n * 1000); // seconds
}

function isoDay(millis: number): string {
  const d = new Date(millis);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${month}-${day}`;
}

/* ---------------------------------------------------------------------------
 * Normalizers
 * ------------------------------------------------------------------------- */

/** Bars oldest-first, dropping anything without a usable close. */
export function normalizeBars(raw: RawBarsResponse | null): Bar[] {
  const list = Array.isArray(raw?.bars) ? raw!.bars! : [];
  const out: Bar[] = [];
  for (const b of list) {
    const close = num(b.c);
    const time = toMillis(b.t);
    if (close === null || time === null) continue;
    out.push({
      date: isoDay(time),
      time,
      open: num(b.o) ?? close,
      high: num(b.h) ?? close,
      low: num(b.l) ?? close,
      close,
      volume: num(b.v) ?? 0,
    });
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

/** Snapshots → quotes. Intraday trade price if present, else last quote mid. */
export function normalizeSnapshots(raw: RawSnapshotsResponse | null): Quote[] {
  // v1beta1 returned an array under `snapshots` with a `symbol` on each entry;
  // v2 returns the snapshots keyed by symbol (without a `symbol` field).
  const list: Array<[string, RawSnapshot]> = [];
  if (Array.isArray(raw?.snapshots)) {
    for (const s of raw!.snapshots!) {
      if (s?.symbol) list.push([s.symbol, s]);
    }
  } else if (raw) {
    for (const [key, value] of Object.entries(raw)) {
      if (key === "snapshots") continue;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        list.push([key, value as RawSnapshot]);
      }
    }
  }

  const out: Quote[] = [];
  for (const [symbolKey, s] of list) {
    const tradePrice = num(s.latestTrade?.p);
    const quotePrice = num(s.latestQuote?.ap);
    const price = tradePrice ?? quotePrice;
    if (price === null) continue;
    const time = toMillis(s.latestTrade?.t ?? s.latestQuote?.t);

    // v2 snapshots include the previous session's bar, so the change can be
    // computed right here; older shapes leave it null for the caller to fill.
    const prevClose = num(s.prevDailyBar?.c);
    const change =
      prevClose !== null && tradePrice !== null ? tradePrice - prevClose : null;
    const changePct =
      change !== null && prevClose !== null && prevClose !== 0
        ? (change / prevClose) * 100
        : null;

    out.push({
      symbol: symbolKey.toUpperCase(),
      price,
      change,
      changePct,
      source: "snapshot",
      time: time === null ? null : new Date(time).toISOString(),
    });
  }
  return out;
}

/**
 * Derive a quote from the last two daily bars — always available, end of day.
 * `bars` must be oldest-first.
 */
export function quoteFromBars(symbol: string, bars: Bar[]): Quote | null {
  if (bars.length === 0) return null;
  const last = bars[bars.length - 1]!;
  const prev = bars.length > 1 ? bars[bars.length - 2] : null;
  const change = prev ? last.close - prev.close : null;
  const changePct =
    prev && prev.close !== 0 ? ((last.close - prev.close) / prev.close) * 100 : null;
  return {
    symbol: symbol.toUpperCase(),
    price: last.close,
    change,
    changePct,
    source: "bar",
    time: new Date(last.time).toISOString(),
  };
}

export function normalizeNews(raw: RawNewsResponse | null): NewsItem[] {
  const list = Array.isArray(raw?.news) ? raw!.news! : [];
  const out: NewsItem[] = [];
  for (const n of list) {
    if (!n?.headline) continue;
    const imageEntry = Array.isArray(n.images) ? n.images[0] : null;
    out.push({
      id: String(n.id ?? `${n.headline.slice(0, 48)}-${out.length}`),
      headline: n.headline,
      summary: n.summary ? clip(n.summary, 220) : null,
      url: n.url ?? "",
      source: n.source || "Alpaca",
      publishedAt: toMillis(n.published_at ?? n.created_at ?? n.updated_at),
      image:
        (typeof imageEntry === "string"
          ? imageEntry
          : (imageEntry?.image_url ?? null)) || null,
    });
  }
  out.sort(
    (a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0),
  );
  return out;
}

export function normalizeMovers(raw: RawScreenerResponse | null): MoverRow[] {
  const list = Array.isArray(raw?.symbols) ? raw!.symbols! : [];
  const out: MoverRow[] = [];
  for (const r of list) {
    if (!r?.symbol) continue;
    const rate = num(r.change_rate) ?? num(r.change);
    out.push({
      symbol: r.symbol.toUpperCase(),
      price: num(r.latest_price) ?? num(r.close),
      // Screener change_rate is a ratio (0.05 = +5%); `change` is already percent.
      changePct: rate === null ? null : Math.abs(rate) <= 1 ? rate * 100 : rate,
      volume: num(r.volume),
    });
  }
  return out;
}

/** A search hit from any of the three shapes Alpaca can answer with. */
interface RawSearchEntry {
  symbol?: string;
  name?: string;
  type?: string;
  asset_class?: string;
}

/** Metadata entries from either the v2 metadata or legacy assets endpoint. */
export function normalizeSearch(raw: unknown): SearchHit[] {
  const r = raw as
    | (RawMetadataResponse & RawAssetsResponse)
    | null
    | undefined;
  const entries: RawSearchEntry[] =
    r?.datasets?.metadata?.entries ?? r?.symbols ?? r?.assets ?? [];
  if (!Array.isArray(entries)) return [];

  const out: SearchHit[] = [];
  for (const e of entries) {
    if (!e?.symbol) continue;
    out.push({
      symbol: e.symbol.toUpperCase(),
      name: e.name ? clip(e.name, 60) : null,
      type: e.type ?? e.asset_class ?? null,
    });
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Derived stats
 * ------------------------------------------------------------------------- */

export interface SymbolStats {
  last: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  avgVolume: number | null;
  periodHigh: number | null;
  periodLow: number | null;
  /** Percent over the whole charted window. */
  periodChangePct: number | null;
}

export function symbolStats(bars: Bar[]): SymbolStats {
  if (bars.length === 0) {
    return {
      last: null,
      prevClose: null,
      change: null,
      changePct: null,
      dayHigh: null,
      dayLow: null,
      volume: null,
      avgVolume: null,
      periodHigh: null,
      periodLow: null,
      periodChangePct: null,
    };
  }
  const last = bars[bars.length - 1]!;
  const prev = bars.length > 1 ? bars[bars.length - 2] : null;
  const first = bars[0]!;
  const tail = bars.slice(-20);
  const avgVolume =
    tail.reduce((sum, b) => sum + b.volume, 0) / (tail.length || 1);

  return {
    last: last.close,
    prevClose: prev ? prev.close : null,
    change: prev ? last.close - prev.close : null,
    changePct:
      prev && prev.close !== 0
        ? ((last.close - prev.close) / prev.close) * 100
        : null,
    dayHigh: last.high,
    dayLow: last.low,
    volume: last.volume,
    avgVolume,
    periodHigh: bars.reduce((m, b) => Math.max(m, b.high), -Infinity),
    periodLow: bars.reduce((m, b) => Math.min(m, b.low), Infinity),
    periodChangePct:
      first.close !== 0 ? ((last.close - first.close) / first.close) * 100 : null,
  };
}

/** Rebase a series to 100 at its own first point, for shape-vs-shape charts. */
export function indexed(bars: Bar[]): { date: string; value: number }[] {
  const base = bars[0]?.close;
  if (!base) return [];
  return bars.map((b) => ({ date: b.date, value: (b.close / base) * 100 }));
}

/**
 * Stats for the intraday chart. Takes minute bars (oldest-first) covering the
 * latest session plus at least one prior session; the change is versus the
 * prior session's final price, not the previous minute.
 */
export function intradayStats(bars: Bar[]): SymbolStats {
  if (bars.length === 0) return symbolStats([]);
  const lastDate = bars[bars.length - 1]!.date;
  const session = bars.filter((b) => b.date === lastDate);
  const priorSessions = bars.filter((b) => b.date < lastDate);

  // Day totals per prior session, for a like-for-like average volume.
  const totalsByDay = new Map<string, number>();
  for (const b of priorSessions) {
    totalsByDay.set(b.date, (totalsByDay.get(b.date) ?? 0) + b.volume);
  }
  const dayTotals = [...totalsByDay.values()];
  const sessionVolume = session.reduce((sum, b) => sum + b.volume, 0);

  const last = session[session.length - 1]!;
  // `bars` is oldest-first, so the last element of priorSessions is the prior
  // session's final minute.
  const prevClose = priorSessions.length
    ? priorSessions[priorSessions.length - 1]!.close
    : null;

  return {
    last: last.close,
    prevClose,
    change: prevClose !== null ? last.close - prevClose : null,
    changePct:
      prevClose !== null && prevClose !== 0
        ? ((last.close - prevClose) / prevClose) * 100
        : null,
    dayHigh: session.reduce((m, b) => Math.max(m, b.high), last.high),
    dayLow: session.reduce((m, b) => Math.min(m, b.low), last.low),
    volume: sessionVolume,
    avgVolume:
      dayTotals.length > 0
        ? dayTotals.reduce((sum, v) => sum + v, 0) / dayTotals.length
        : sessionVolume,
    periodHigh: session.reduce((m, b) => Math.max(m, b.high), -Infinity),
    periodLow: session.reduce((m, b) => Math.min(m, b.low), Infinity),
    periodChangePct:
      prevClose !== null && prevClose !== 0
        ? ((last.close - prevClose) / prevClose) * 100
        : null,
  };
}

/* ---------------------------------------------------------------------------
 * Corporate actions (dividends & splits)
 * ------------------------------------------------------------------------- */

export interface Dividend {
  /** ISO day (`YYYY-MM-DD`) the dividend went ex. */
  exDate: string;
  payDate: string | null;
  /** Cash per share, per declared dividend. */
  amountPerShare: number;
  special: boolean;
}

export interface SplitRecord {
  /** ISO day of the split's ex-date. */
  date: string;
  /** e.g. a 10-for-1 split is `{ from: 1, to: 10 }`. */
  from: number;
  to: number;
}

interface RawDividend {
  symbol?: string;
  ex_date?: string;
  payable_date?: string;
  rate?: string | number;
  special?: boolean;
}

interface RawForwardSplit {
  symbol?: string;
  ex_date?: string;
  old_rate?: string | number;
  new_rate?: string | number;
}

export interface RawCorpActionsResponse {
  corporate_actions?: {
    cash_dividends?: RawDividend[] | null;
    forward_splits?: RawForwardSplit[] | null;
  } | null;
}

export interface CorpActions {
  dividends: Dividend[];
  splits: SplitRecord[];
}

/** Newest-first dividends and splits from the corporate-actions endpoint. */
export function normalizeCorporateActions(
  raw: RawCorpActionsResponse | null,
): CorpActions {
  const dividends: Dividend[] = [];
  const splits: SplitRecord[] = [];

  for (const d of raw?.corporate_actions?.cash_dividends ?? []) {
    const amount = num(d?.rate);
    if (!d?.ex_date || amount === null || amount <= 0) continue;
    dividends.push({
      exDate: d.ex_date,
      payDate: d.payable_date ?? null,
      amountPerShare: amount,
      special: Boolean(d.special),
    });
  }

  for (const s of raw?.corporate_actions?.forward_splits ?? []) {
    const from = num(s?.old_rate);
    const to = num(s?.new_rate);
    if (!s?.ex_date || !from || !to) continue;
    splits.push({ date: s.ex_date, from, to });
  }

  dividends.sort((a, b) => b.exDate.localeCompare(a.exDate));
  splits.sort((a, b) => b.date.localeCompare(a.date));

  return { dividends, splits };
}

/**
 * Trailing-12-month dividend yield as a percent, given the latest price.
 * `now` is injectable so tests don't age out. Dividends must be normalized
 * records; only the last 365 days count.
 */
export function trailingYield(
  dividends: Dividend[],
  price: number | null,
  now: number = Date.now(),
): number | null {
  if (price === null || price <= 0) return null;
  const cutoff = new Date(now - 365 * 86_400_000).toISOString().slice(0, 10);
  const sum = dividends
    .filter((d) => d.exDate >= cutoff)
    .reduce((total, d) => total + d.amountPerShare, 0);
  if (sum <= 0) return null;
  return (sum / price) * 100;
}

/* ---------------------------------------------------------------------------
 * Options (snapshot endpoint keyed by OCC-style contract, e.g.
 * "AAPL260909C00330000": underlying + YYMMDD + C/P + strike × 1000.)
 * ------------------------------------------------------------------------- */

export interface OptionRow {
  /** Raw contract symbol from the snapshot key. */
  contract: string;
  underlying: string;
  /** ISO day (`YYYY-MM-DD`) of expiration. */
  expiry: string;
  type: "call" | "put";
  strike: number;
  last: number | null;
  /** Percent versus the previous session's option close. */
  changePct: number | null;
  bid: number | null;
  ask: number | null;
  /** Contracts traded in the latest session. */
  volume: number | null;
  /** Implied volatility as a percent, when the feed provides it. */
  ivPct: number | null;
}

interface RawOptionSnapshot {
  dailyBar?: { c?: string | number; v?: string | number } | null;
  prevDailyBar?: { c?: string | number } | null;
  latestTrade?: { p?: string | number } | null;
  latestQuote?: { bp?: string | number; ap?: string | number } | null;
  impliedVolatility?: string | number | null;
}

export interface RawOptionSnapshotsResponse {
  snapshots?: Record<string, RawOptionSnapshot> | null;
}

/**
 * Parse `AAPL260909C00330000` into its parts. Returns null for anything that
 * doesn't match the OCC pattern (index options with special prefixes, etc.).
 */
export function parseOptionContract(
  contract: string,
): {
  underlying: string;
  expiry: string;
  type: "call" | "put";
  strike: number;
} | null {
  const m = /^([A-Z.]+?)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/.exec(contract);
  if (!m) return null;
  const [, underlying, yy, mm, dd, side, strikeRaw] = m;
  const expiry = `20${yy}-${mm}-${dd}`;
  // Reject impossible months/days that slipped through the regex.
  if (Number(mm) < 1 || Number(mm) > 12 || Number(dd) < 1 || Number(dd) > 31) {
    return null;
  }
  const strike = Number(strikeRaw) / 1000;
  if (!Number.isFinite(strike) || strike <= 0) return null;
  return {
    underlying: underlying as string,
    expiry,
    type: side === "C" ? "call" : "put",
    strike,
  };
}

/** Newest snapshot shape is keyed by contract; parse and sort by strike. */
export function normalizeOptionSnapshots(
  raw: RawOptionSnapshotsResponse | null,
): OptionRow[] {
  const entries = Object.entries(raw?.snapshots ?? {});
  const out: OptionRow[] = [];
  for (const [contract, snap] of entries) {
    const parsed = parseOptionContract(contract);
    if (!parsed || !snap) continue;
    const last = num(snap.latestTrade?.p) ?? num(snap.dailyBar?.c);
    const prev = num(snap.prevDailyBar?.c);
    const iv = num(snap.impliedVolatility);
    out.push({
      contract,
      ...parsed,
      last,
      changePct:
        prev !== null && prev !== 0 && last !== null
          ? ((last - prev) / prev) * 100
          : null,
      bid: num(snap.latestQuote?.bp),
      ask: num(snap.latestQuote?.ap),
      volume: num(snap.dailyBar?.v),
      ivPct: iv === null ? null : iv * 100,
    });
  }
  out.sort((a, b) => a.strike - b.strike || a.contract.localeCompare(b.contract));
  return out;
}

/** Keep only the rows at the earliest expiration in the list. */
export function nearestExpiry(rows: OptionRow[]): {
  expiry: string | null;
  rows: OptionRow[];
} {
  if (rows.length === 0) return { expiry: null, rows: [] };
  const nearest = rows.reduce(
    (min, r) => (r.expiry < min ? r.expiry : min),
    rows[0]!.expiry,
  );
  return { expiry: nearest, rows: rows.filter((r) => r.expiry === nearest) };
}

/**
 * The `size` strikes closest to the underlying's price, returned in
 * ascending-strike order. Without a usable spot there is nothing to center
 * on, so the full list comes back untouched.
 */
export function selectOptionWindow(
  rows: OptionRow[],
  spot: number | null,
  size = 7,
): OptionRow[] {
  if (rows.length === 0 || spot === null || spot <= 0) return rows;
  const picked = [...rows]
    .sort(
      (a, b) =>
        Math.abs(a.strike - spot) - Math.abs(b.strike - spot) ||
        a.strike - b.strike,
    )
    .slice(0, size);
  picked.sort((a, b) => a.strike - b.strike);
  return picked;
}

/* ---------------------------------------------------------------------------
 * Formatting
 * ------------------------------------------------------------------------- */

const priceFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtPrice(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : priceFmt.format(n);
}

export function fmtPct(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/** 1_234_567 → "1.23M" */
export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

/** Market-hours clock label (Eastern), e.g. "4:08 PM". */
export function fmtTime(millis: number): string {
  return new Date(millis).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

export function fmtDate(millis: number | null, withYear = false): string {
  if (millis === null) return "—";
  const d = new Date(millis);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export function fmtDateTime(millis: number | null): string {
  if (millis === null) return "—";
  const d = new Date(millis);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ---------------------------------------------------------------------------
 * API payload shapes (what /api/market/* returns)
 * ------------------------------------------------------------------------- */

/** One line on the price chart. */
export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

/** One x-position on the price chart: `date` plus a numeric field per series. */
export type ChartRow = { date: string } & Record<string, number | string>;

export interface BarsPayload {
  symbol: string;
  range: RangeKey;
  bars: Bar[];
  stats: SymbolStats;
}

export interface QuotesPayload {
  quotes: Quote[];
}

export interface NewsPayload {
  news: NewsItem[];
}

export interface MoversPayload {
  movers: MoverRow[];
}

export interface SearchPayload {
  hits: SearchHit[];
}

export type AlpacaErrorKind =
  | "missing-config"
  | "unauthorized"
  | "plan-limit"
  | "rate-limit"
  | "not-found"
  | "upstream";

export interface ApiErrorBody {
  error: { kind: string; message: string };
}

/** Pull a friendly message out of a failed /api/market/* response. */
export async function readApiError(res: Response): Promise<{ kind: string; message: string }> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body?.error?.message) return body.error;
  } catch {
    // fall through
  }
  return {
    kind: "upstream",
    message: `Market data request failed (${res.status}).`,
  };
}

/** Copy-paste-ready hint when the server has no Alpaca keys. */
export const SETUP_HINT =
  "No market-data keys on this server. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY (a free Alpaca account works), then reload.";

/** "3h ago" / "yesterday" style stamp, tolerant of null. */
export function fmtRelative(millis: number | null): string {
  if (millis === null) return "—";
  const diff = Date.now() - millis;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(millis, true);
}

export function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}
