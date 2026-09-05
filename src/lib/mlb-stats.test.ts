import { describe, expect, it } from "vitest";

import {
  aggregateStats,
  careerTotal,
  fmt,
  formatInnings,
  inningsOuts,
  isPrimaryPitcher,
  num,
  preferredView,
  seasonRows,
  seasonSpan,
  seasonTotals,
  type SeasonRow,
  type StatSplit,
  type YearByYearResponse,
} from "$lib/mlb-stats.js";

const row = (
  season: string,
  teamId: number | null,
  stat: Record<string, number | string>,
): SeasonRow => ({
  season,
  team: teamId === null ? undefined : { id: teamId, name: `Team ${teamId}` },
  stat,
  key: `${season}-${teamId ?? "total"}`,
});

describe("seasonTotals", () => {
  it("sums counting stats across teams and skips averages", () => {
    const totals = seasonTotals([
      row("2024", 1, { gamesPlayed: 80, homeRuns: 20, avg: 0.300 }),
      row("2024", 2, { gamesPlayed: 70, homeRuns: 15, avg: 0.250 }),
      row("2025", 2, { gamesPlayed: 150, homeRuns: 30 }),
    ]);
    expect(totals).toHaveLength(2);
    // Oldest season first.
    expect(totals[0].season).toBe("2024");
    expect(totals[0].stats.homeRuns).toBe(35);
    expect(totals[0].stats.gamesPlayed).toBe(150);
    // Ratios are never summable, so they must not appear at all.
    expect(totals[0].stats.avg).toBeUndefined();
  });

  it("drops rows without a season", () => {
    const totals = seasonTotals([row("", 1, { homeRuns: 9 })]);
    expect(totals).toEqual([]);
  });
});

describe("aggregateStats", () => {
  it("sums counting stats over every row and parses numeric strings", () => {
    const totals = aggregateStats([
      row("2024", 1, { gamesPlayed: 100, homeRuns: "12.5" }),
      row("2025", 1, { gamesPlayed: 50, homeRuns: 8 }),
    ]);
    expect(totals.gamesPlayed).toBe(150);
    expect(totals.homeRuns).toBe(20.5);
  });

  it("ignores non-numeric values", () => {
    const totals = aggregateStats([row("2024", 1, { note: "n/a" })]);
    expect(totals.note).toBeUndefined();
  });
});

describe("innings handling", () => {
  it("reads outs from the stats bag", () => {
    expect(inningsOuts({ outs: 292 })).toBe(292);
    expect(inningsOuts({})).toBe(0);
  });

  it("renders outs the way baseball writes innings", () => {
    expect(formatInnings(0)).toBe("0");
    expect(formatInnings(291)).toBe("97");
    expect(formatInnings(292)).toBe("97.1");
    expect(formatInnings(293)).toBe("97.2");
  });
});

describe("seasonRows", () => {
  const makeResp = (splits: StatSplit[]): YearByYearResponse => ({
    stats: [{ splits }],
  });

  it("filters minors splits and keeps one row per season/team, newest first", () => {
    const resp = makeResp([
      { season: "2023", team: { id: 5 }, sport: { abbreviation: "AAA" }, stat: { gamesPlayed: 140 } },
      { season: "2024", team: { id: 10 }, sport: { abbreviation: "MLB" }, stat: { gamesPlayed: 160 } },
      { season: "2023", team: { id: 10 }, sport: { abbreviation: "MLB" }, stat: { gamesPlayed: 150 } },
    ]);
    const rows = seasonRows(resp, "h");
    expect(rows.map((r) => r.key)).toEqual(["h:2024-10", "h:2023-10"]);
  });

  it("drops combined season-total rows when per-team rows exist", () => {
    const resp = makeResp([
      { season: "2024", team: { id: 10 }, sport: { abbreviation: "MLB" }, stat: { gamesPlayed: 100 } },
      { season: "2024", stat: { gamesPlayed: 160 } }, // combined total, no team
    ]);
    const rows = seasonRows(resp, "h");
    expect(rows).toHaveLength(1);
    expect(rows[0].stat?.gamesPlayed).toBe(100);
  });

  it("keeps the duplicate with more games played when keys collide", () => {
    const resp = makeResp([
      { season: "2024", team: { id: 10 }, stat: { gamesPlayed: 90 } },
      { season: "2024", team: { id: 10 }, stat: { gamesPlayed: 130 } },
    ]);
    const rows = seasonRows(resp, "h");
    expect(rows).toHaveLength(1);
    expect(rows[0].stat?.gamesPlayed).toBe(130);
  });

  it("handles null responses", () => {
    expect(seasonRows(null, "h")).toEqual([]);
  });
});

describe("careerTotal", () => {
  it("reads stats from the top-level entry", () => {
    const resp = { stats: [{ stats: { homeRuns: 300 } }] };
    expect(careerTotal(resp)).toEqual({ homeRuns: 300 });
  });

  it("falls back to the first split", () => {
    const resp = { stats: [{ splits: [{ stat: { homeRuns: 250 } }] }] };
    expect(careerTotal(resp)).toEqual({ homeRuns: 250 });
  });

  it("returns null when there is nothing", () => {
    expect(careerTotal(null)).toBeNull();
  });
});

describe("seasonSpan", () => {
  it("returns an empty string for no rows", () => {
    expect(seasonSpan([])).toBe("");
  });

  it("collapses a single season", () => {
    expect(seasonSpan([row("2024", 1, {})])).toBe("2024");
  });

  it("spans oldest to newest with an en dash", () => {
    expect(seasonSpan([row("2024", 1, {}), row("2014", 1, {}), row("2026", 1, {})])).toBe(
      "2014\u20132026",
    );
  });
});

describe("isPrimaryPitcher", () => {
  it("is false without a profile", () => {
    expect(isPrimaryPitcher(null)).toBe(false);
  });

  it("recognizes pitchers via each API shape", () => {
    expect(isPrimaryPitcher({ id: 1, fullName: "P", isPitcher: true })).toBe(true);
    expect(
      isPrimaryPitcher({ id: 2, fullName: "P", primaryPosition: { code: 1 } }),
    ).toBe(true);
    expect(
      isPrimaryPitcher({ id: 3, fullName: "P", primaryPosition: { abbreviation: "P" } }),
    ).toBe(true);
  });

  it("is false for position players", () => {
    expect(isPrimaryPitcher({ id: 4, fullName: "B", primaryPosition: { code: 5 } })).toBe(false);
  });
});

describe("preferredView", () => {
  const pitcher = { id: 1, fullName: "P", isPitcher: true };
  const batter = { id: 2, fullName: "B" };

  it("opens on pitching for pitchers with pitching data", () => {
    expect(preferredView(pitcher, [], [{ season: "2024", key: "x" }])).toBe("pitching");
  });

  it("falls back to hitting rows when a pitcher has no pitching splits", () => {
    expect(preferredView(pitcher, [{ season: "2024", key: "x" }], [])).toBe("hitting");
  });

  it("opens on hitting for position players", () => {
    expect(preferredView(batter, [{ season: "2024", key: "x" }], [])).toBe("hitting");
  });

  it("falls back to pitching when there is no data at all", () => {
    expect(preferredView(null, [], [])).toBe("pitching");
  });
});

describe("fmt / num", () => {
  it("renders missing values as em dashes but keeps zero", () => {
    expect(fmt(null)).toBe("\u2014");
    expect(fmt(undefined)).toBe("\u2014");
    expect(fmt("")).toBe("\u2014");
    expect(fmt(0)).toBe("0");
  });

  it("parses numeric stats and rejects junk", () => {
    expect(num("12.5")).toBe(12.5);
    expect(num(7)).toBe(7);
    expect(num("abc")).toBeNull();
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
  });
});
