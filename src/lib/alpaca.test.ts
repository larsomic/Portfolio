import { describe, expect, it } from "vitest";

import {
  barsForRange,
  indexed,
  intParam,
  nearestExpiry,
  intradayStats,
  normalizeOptionSnapshots,
  parseOptionContract,
  selectOptionWindow,
  type OptionRow,
  normalizeBars,
  normalizeCorporateActions,
  normalizeMovers,
  normalizeNews,
  normalizeSearch,
  normalizeSnapshots,
  quoteFromBars,
  symbolStats,
  toMillis,
  trailingYield,
} from "$lib/alpaca.js";

describe("toMillis", () => {
  it("reads RFC-3339 strings and epoch values of any scale", () => {
    expect(toMillis("2026-01-02T05:00:00Z")).toBe(Date.parse("2026-01-02T05:00:00Z"));
    const millis = Date.parse("2026-01-02T05:00:00Z");
    expect(toMillis(millis)).toBe(millis);
    expect(toMillis(millis * 1000)).toBe(millis); // microseconds
    expect(toMillis(Math.round(millis * 1e6))).toBe(millis); // nanoseconds
    expect(toMillis("nope")).toBeNull();
  });
});

describe("normalizeBars", () => {
  it("coerces strings, drops unusable rows, and sorts oldest-first", () => {
    const bars = normalizeBars({
      bars: [
        { t: "2026-01-05T05:00:00Z", o: "4", h: "5", l: "4", c: "4.5", v: "100" },
        { t: "2026-01-02T05:00:00Z", o: 1, h: 2, l: 1, c: 2, v: 50 },
        { t: "2026-01-03T05:00:00Z", o: 3, h: 3, l: 3, v: 10 }, // no close → dropped
      ],
    });
    expect(bars.map((b) => b.date)).toEqual(["2026-01-02", "2026-01-05"]);
    expect(bars[1]?.close).toBe(4.5);
    expect(bars[1]?.volume).toBe(100);
  });

  it("returns nothing for a missing payload", () => {
    expect(normalizeBars(null)).toEqual([]);
  });
});

describe("quoteFromBars", () => {
  const bars = normalizeBars({
    bars: [
      { t: "2026-01-02T05:00:00Z", c: 10, o: 10, h: 10, l: 10, v: 1 },
      { t: "2026-01-03T05:00:00Z", c: 11, o: 10, h: 11, l: 10, v: 2 },
    ],
  });

  it("derives the day change from the last two sessions", () => {
    const quote = quoteFromBars("aapl", bars);
    expect(quote?.symbol).toBe("AAPL");
    expect(quote?.price).toBe(11);
    expect(quote?.change).toBeCloseTo(1, 10);
    expect(quote?.changePct).toBeCloseTo(10, 10);
    expect(quote?.source).toBe("bar");
  });

  it("has no change with a single session", () => {
    const one = quoteFromBars("SPY", bars.slice(1));
    expect(one?.changePct).toBeNull();
  });
});

describe("normalizeSnapshots", () => {
  it("prefers the latest trade price and leaves change null", () => {
    const quotes = normalizeSnapshots({
      snapshots: [
        { symbol: "aapl", latestTrade: { p: "201.5", t: 1767340800 } },
        { latestQuote: { ap: "9" } }, // no symbol → dropped
      ],
    });
    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.price).toBe(201.5);
    expect(quotes[0]?.changePct).toBeNull();
  });
});

describe("normalizeNews", () => {
  it("keeps only items with a headline and sorts newest first", () => {
    const news = normalizeNews({
      news: [
        {
          id: 2,
          headline: "Older story",
          published_at: "2026-01-01T00:00:00Z",
          source: "Wire",
          url: "https://example.com/2",
        },
        { headline: "Newer story", created_at: "2026-01-05T00:00:00Z" },
        { summary: "no headline" },
      ],
    });
    expect(news.map((n) => n.headline)).toEqual(["Newer story", "Older story"]);
    // The newer item had no source field; the older one did.
    expect(news[0]?.source).toBe("Alpaca");
    expect(news[1]?.source).toBe("Wire");
  });
});

describe("normalizeMovers", () => {
  it("treats a ratio change_rate as a percentage", () => {
    const movers = normalizeMovers({
      symbols: [
        { symbol: "nvda", latest_price: "120", change_rate: 0.1234, volume: "1234567" },
        { symbol: "den", change: -3.5 },
      ],
    });
    expect(movers[0]?.changePct).toBeCloseTo(12.34, 6);
    expect(movers[1]?.changePct).toBe(-3.5); // already percent, magnitude > 1
  });
});

describe("normalizeSearch", () => {
  it("reads the v2 metadata shape and the legacy assets shape", () => {
    const fromMetadata = normalizeSearch({
      datasets: { metadata: { entries: [{ symbol: "nvda", name: "NVIDIA Corp", type: "equity" }] } },
    });
    expect(fromMetadata[0]?.symbol).toBe("NVDA");

    const fromAssets = normalizeSearch({ assets: [{ symbol: "den", asset_class: "act" }] });
    expect(fromAssets[0]?.type).toBe("act");
  });

  it("returns nothing when Alpaca gives us nothing", () => {
    expect(normalizeSearch(null)).toEqual([]);
  });
});

describe("symbolStats", () => {
  const bars = normalizeBars({
    bars: [
      { t: "2026-01-02T05:00:00Z", o: 9, h: 10, l: 8, c: 10, v: 100 },
      { t: "2026-01-03T05:00:00Z", o: 10, h: 12, l: 10, c: 12, v: 300 },
      { t: "2026-01-04T05:00:00Z", o: 12, h: 12.5, l: 11, c: 11, v: 200 },
    ],
  });

  it("summarizes the last session and the whole window", () => {
    const stats = symbolStats(bars);
    expect(stats.last).toBe(11);
    expect(stats.change).toBe(-1);
    expect(stats.avgVolume).toBeCloseTo(200, 6);
    expect(stats.periodHigh).toBe(12.5);
    expect(stats.periodLow).toBe(8);
    expect(stats.periodChangePct).toBeCloseTo(10, 6);
  });

  it("degrades gracefully with no bars", () => {
    expect(symbolStats([]).last).toBeNull();
  });
});

describe("indexed", () => {
  it("rebases the series to 100 at its first close", () => {
    const bars = normalizeBars({
      bars: [
        { t: "2026-01-02T05:00:00Z", c: 50 },
        { t: "2026-01-03T05:00:00Z", c: 75 },
      ],
    });
    expect(indexed(bars)).toEqual([
      { date: "2026-01-02", value: 100 },
      { date: "2026-01-03", value: 150 },
    ]);
  });
});

describe("intParam", () => {
  it("clamps and falls back like the API routes need", () => {
    expect(intParam("7", 8, 1, 20)).toBe(7);
    expect(intParam("999", 8, 1, 20)).toBe(20);
    expect(intParam("abc", 8, 1, 20)).toBe(8);
    expect(intParam(null, 8, 1, 20)).toBe(8);
  });
});

describe("barsForRange", () => {
  it("maps each UI range to roughly that many trading sessions", () => {
    expect(barsForRange("1M")).toBeLessThan(40);
    expect(barsForRange("1Y")).toBeGreaterThan(250);
  });

  it("asks for more minute bars than a session has, so nothing is clipped", () => {
    expect(barsForRange("1D")).toBeGreaterThan(390);
  });
});

describe("intradayStats", () => {
  const m = (day: string, hhmm: string) =>
    Date.parse(`${day}T${hhmm}:00Z`);
  const minutes = normalizeBars({
    bars: [
      // Thursday session: two minutes.
      { t: m("2026-09-03", "15:00"), c: 100, h: 101, l: 99, v: 10 },
      { t: m("2026-09-03", "15:01"), c: 104, h: 105, l: 103, v: 20 },
      // Friday session (the latest): two minutes.
      { t: m("2026-09-04", "15:00"), c: 106, h: 107, l: 106, v: 30 },
      { t: m("2026-09-04", "15:01"), c: 108, h: 109, l: 107, v: 40 },
    ],
  });

  it("compares the latest session against the prior close, not the prior minute", () => {
    const stats = intradayStats(minutes);
    expect(stats.last).toBe(108);
    expect(stats.prevClose).toBe(104); // Thursday's final minute, not 106
    expect(stats.change).toBeCloseTo(4, 10);
    expect(stats.changePct).toBeCloseTo((4 / 104) * 100, 10);
  });

  it("sums the session's volume and averages prior day totals", () => {
    const stats = intradayStats(minutes);
    expect(stats.volume).toBe(70); // Friday's two minutes
    expect(stats.avgVolume).toBe(30); // Thursday totaled 30; one day of history
    expect(stats.dayHigh).toBe(109);
    expect(stats.dayLow).toBe(106);
  });

  it("has no change with only one session", () => {
    const stats = intradayStats(minutes.slice(2));
    expect(stats.changePct).toBeNull();
    expect(intradayStats([]).last).toBeNull();
  });
});

describe("normalizeCorporateActions", () => {
  it("keeps usable dividends and splits, newest-first", () => {
    const actions = normalizeCorporateActions({
      corporate_actions: {
        cash_dividends: [
          { ex_date: "2024-03-05", payable_date: "2024-03-27", rate: 0.04 },
          { ex_date: "2024-06-07", rate: "0.05", special: true },
          { ex_date: "2024-09-06", rate: 0 }, // dropped: not a positive rate
        ],
        forward_splits: [
          { ex_date: "2024-06-10", old_rate: 1, new_rate: 10 },
          { ex_date: "2024-01-01", old_rate: 0, new_rate: 5 }, // dropped
        ],
      },
    });
    expect(actions.dividends.map((d) => d.exDate)).toEqual([
      "2024-06-07",
      "2024-03-05",
    ]);
    expect(actions.dividends[0]?.special).toBe(true);
    expect(actions.splits).toEqual([{ date: "2024-06-10", from: 1, to: 10 }]);
  });

  it("survives empty and missing payloads", () => {
    expect(normalizeCorporateActions(null)).toEqual({
      dividends: [],
      splits: [],
    });
  });
});

describe("parseOptionContract", () => {
  it("parses a call contract into its parts", () => {
    expect(parseOptionContract("AAPL260909C00330000")).toEqual({
      underlying: "AAPL",
      expiry: "2026-09-09",
      type: "call",
      strike: 330,
    });
  });

  it("parses a put with an unusual underlying (dot in symbol)", () => {
    expect(parseOptionContract("BRK.B270101P00105000")).toEqual({
      underlying: "BRK.B",
      expiry: "2027-01-01",
      type: "put",
      strike: 105,
    });
  });

  it("rejects anything that is not an OCC symbol", () => {
    expect(parseOptionContract("NVDA")).toBeNull();
    expect(parseOptionContract("AAPL261399C00330000")).toBeNull(); // month 13
    expect(parseOptionContract("AAPL260909X00330000")).toBeNull(); // bad side
  });
});

describe("normalizeOptionSnapshots", () => {
  it("computes change vs the prior option close and sorts by strike", () => {
    const rows = normalizeOptionSnapshots({
      snapshots: {
        AAPL260909P00340000: {
          latestTrade: { p: "4.2" },
          prevDailyBar: { c: "3.5" },
          latestQuote: { bp: "4", ap: "4.4" },
          dailyBar: { v: 120 },
          impliedVolatility: 0.32,
        },
        AAPL260909C00320000: {
          latestTrade: { p: "8.1" },
          dailyBar: { c: "8", v: 5 },
        },
        NOPE: { latestTrade: { p: "1" } }, // unparseable key → dropped
      },
    });
    expect(rows.map((r) => r.strike)).toEqual([320, 340]);
    const put = rows.find((r) => r.type === "put")!;
    expect(put.changePct).toBeCloseTo((0.7 / 3.5) * 100, 10);
    expect(put.ivPct).toBeCloseTo(32, 10);
    // No prev close → no change; quote fields still parsed.
    const call = rows.find((r) => r.type === "call")!;
    expect(call.changePct).toBeNull();
    expect(call.bid).toBeNull();
  });

  it("survives empty payloads", () => {
    expect(normalizeOptionSnapshots(null)).toEqual([]);
  });
});

describe("nearestExpiry + selectOptionWindow", () => {
  const mk = (strike: number, expiry: string): OptionRow => ({
    contract: `X${expiry.replaceAll(/-/g, "").slice(2)}C${String(strike * 1000).padStart(8, "0")}`,
    underlying: "X",
    expiry,
    type: "call",
    strike,
    last: 1,
    changePct: null,
    bid: null,
    ask: null,
    volume: null,
    ivPct: null,
  });

  it("keeps only the earliest expiration", () => {
    const { expiry, rows } = nearestExpiry([
      mk(100, "2026-09-09"),
      mk(200, "2026-09-09"),
      mk(150, "2026-10-16"),
    ]);
    expect(expiry).toBe("2026-09-09");
    expect(rows.map((r) => r.strike)).toEqual([100, 200]);
  });

  it("centers the window on the spot and returns strikes ascending", () => {
    const rows = [90, 100, 110, 320, 330].map((s) => mk(s, "2026-09-09"));
    expect(selectOptionWindow(rows, 325, 2).map((r) => r.strike)).toEqual([
      320, 330,
    ]);
  });

  it("returns everything when there is no usable spot", () => {
    const rows = [100, 200].map((s) => mk(s, "2026-09-09"));
    expect(selectOptionWindow(rows, null, 1)).toEqual(rows);
  });
});

describe("trailingYield", () => {
  const now = Date.parse("2026-09-04T12:00:00Z");
  const dividends = [
    { exDate: "2025-12-01", payDate: null, amountPerShare: 0.5, special: false },
    { exDate: "2026-06-01", payDate: null, amountPerShare: 0.5, special: false },
    { exDate: "2024-06-01", payDate: null, amountPerShare: 9, special: false }, // stale
  ];

  it("sums the trailing 365 days over the price as a percent", () => {
    expect(trailingYield(dividends, 100, now)).toBeCloseTo(1.0, 10);
  });

  it("returns null without dividends or a usable price", () => {
    expect(trailingYield([], 100, now)).toBeNull();
    expect(trailingYield(dividends, null, now)).toBeNull();
  });
});
