/**
 * Metric definitions for the player comparison page.
 *
 * Every metric reads from a summed counting-stat record (see `seasonTotals` /
 * `aggregateStats` in `$lib/mlb-stats`), so rate stats are derived from their
 * underlying counts rather than averaged from the API's per-team rates.
 */
import type { StatView } from "$lib/mlb-stats.js";

export interface Metric {
  /** Stable id used in the URL. */
  key: string;
  /** Short label used on axes and column headers (e.g. "HR"). */
  short: string;
  /** Full name for headings and tooltips. */
  label: string;
  view: StatView;
  kind: "count" | "rate";
  /** Higher is better, except for stats like strikeouts or losses. */
  better: "high" | "low";
  /** Scales with playing time, so "per 162 games" is meaningful. */
  perGames?: boolean;
  /** Decimal places to show. */
  decimals?: number;
  /** `ip` renders innings the baseball way (97.2). */
  format?: "innings";
  value: (stats: Record<string, number>) => number | null;
}

const ratio = (numerator: number, denominator: number, epsilon = 0) =>
  denominator <= epsilon ? null : numerator / denominator;

function innings(stats: Record<string, number>): number {
  return (stats.outs ?? 0) / 3;
}

export const METRICS: Metric[] = [
  // ---------------------------------------------------------------- hitting
  {
    key: "gamesPlayed",
    short: "G",
    label: "Games Played",
    view: "hitting",
    kind: "count",
    better: "high",
    value: (s) => s.gamesPlayed ?? null,
  },
  {
    key: "atBats",
    short: "AB",
    label: "At Bats",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.atBats ?? null,
  },
  {
    key: "hits",
    short: "H",
    label: "Hits",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.hits ?? null,
  },
  {
    key: "doubles",
    short: "2B",
    label: "Doubles",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.doubles ?? null,
  },
  {
    key: "homeRuns",
    short: "HR",
    label: "Home Runs",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.homeRuns ?? null,
  },
  {
    key: "rbi",
    short: "RBI",
    label: "Runs Batted In",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.rbi ?? null,
  },
  {
    key: "stolenBases",
    short: "SB",
    label: "Stolen Bases",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.stolenBases ?? null,
  },
  {
    key: "baseOnBalls",
    short: "BB",
    label: "Walks",
    view: "hitting",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.baseOnBalls ?? null,
  },
  {
    key: "strikeOutsBatter",
    short: "SO",
    label: "Strikeouts",
    view: "hitting",
    kind: "count",
    better: "low",
    perGames: true,
    value: (s) => s.strikeOuts ?? null,
  },
  {
    key: "avg",
    short: "AVG",
    label: "Batting Average",
    view: "hitting",
    kind: "rate",
    better: "high",
    decimals: 3,
    value: (s) => ratio(s.hits ?? 0, s.atBats ?? 0),
  },
  {
    key: "obp",
    short: "OBP",
    label: "On-Base Percentage",
    view: "hitting",
    kind: "rate",
    better: "high",
    decimals: 3,
    value: (s) =>
      ratio(
        (s.hits ?? 0) + (s.baseOnBalls ?? 0) + (s.hitByPitch ?? 0),
        (s.atBats ?? 0) +
          (s.baseOnBalls ?? 0) +
          (s.hitByPitch ?? 0) +
          (s.sacFlies ?? 0),
      ),
  },
  {
    key: "slg",
    short: "SLG",
    label: "Slugging Percentage",
    view: "hitting",
    kind: "rate",
    better: "high",
    decimals: 3,
    value: (s) => ratio(s.totalBases ?? 0, s.atBats ?? 0),
  },
  {
    key: "ops",
    short: "OPS",
    label: "On-base Plus Slugging",
    view: "hitting",
    kind: "rate",
    better: "high",
    decimals: 3,
    value: (s) => {
      const avg = ratio(s.hits ?? 0, s.atBats ?? 0);
      const slg = ratio(s.totalBases ?? 0, s.atBats ?? 0);
      return avg === null || slg === null ? null : avg + slg;
    },
  },

  // -------------------------------------------------------------- pitching
  {
    key: "gamesPitched",
    short: "G",
    label: "Games Pitched",
    view: "pitching",
    kind: "count",
    better: "high",
    value: (s) => s.gamesPitched ?? null,
  },
  {
    key: "gamesStarted",
    short: "GS",
    label: "Games Started",
    view: "pitching",
    kind: "count",
    better: "high",
    value: (s) => s.gamesStarted ?? null,
  },
  {
    key: "inningsPitched",
    short: "IP",
    label: "Innings Pitched",
    view: "pitching",
    kind: "count",
    better: "high",
    perGames: true,
    format: "innings",
    value: (s) => innings(s),
  },
  {
    key: "winsPitcher",
    short: "W",
    label: "Wins",
    view: "pitching",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.wins ?? null,
  },
  {
    key: "lossesPitcher",
    short: "L",
    label: "Losses",
    view: "pitching",
    kind: "count",
    better: "low",
    perGames: true,
    value: (s) => s.losses ?? null,
  },
  {
    key: "saves",
    short: "SV",
    label: "Saves",
    view: "pitching",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.saves ?? null,
  },
  {
    key: "strikeOutsPitcher",
    short: "K",
    label: "Strikeouts",
    view: "pitching",
    kind: "count",
    better: "high",
    perGames: true,
    value: (s) => s.strikeOuts ?? null,
  },
  {
    key: "completeGames",
    short: "CG",
    label: "Complete Games",
    view: "pitching",
    kind: "count",
    better: "high",
    value: (s) => s.completeGames ?? null,
  },
  {
    key: "shutouts",
    short: "SHO",
    label: "Shutouts",
    view: "pitching",
    kind: "count",
    better: "high",
    value: (s) => s.shutouts ?? null,
  },
  {
    key: "era",
    short: "ERA",
    label: "Earned Run Average",
    view: "pitching",
    kind: "rate",
    better: "low",
    decimals: 2,
    value: (s) => ratio((s.earnedRuns ?? 0) * 27, s.outs ?? 0, 1),
  },
  {
    key: "whip",
    short: "WHIP",
    label: "Walks + Hits per Inning Pitched",
    view: "pitching",
    kind: "rate",
    better: "low",
    decimals: 2,
    value: (s) => {
      const ip = innings(s);
      return ip <= 0
        ? null
        : ((s.hits ?? 0) + (s.baseOnBalls ?? 0)) / ip;
    },
  },
  {
    key: "k9",
    short: "K/9",
    label: "Strikeouts per 9 Innings",
    view: "pitching",
    kind: "rate",
    better: "high",
    decimals: 1,
    value: (s) => ratio((s.strikeOuts ?? 0) * 27, s.outs ?? 0, 1),
  },
];

/** Metrics that belong to a stat group. */
export function metricsFor(view: StatView): Metric[] {
  return METRICS.filter((m) => m.view === view);
}
