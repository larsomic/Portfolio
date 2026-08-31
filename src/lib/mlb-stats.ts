/**
 * Shared MLB Stats API helpers.
 *
 * The statsapi responses need a little care before they are usable in keyed
 * `#each` blocks or side-by-side comparisons, so the parsing lives here and is
 * used by both the player dialog and the player comparison page.
 */

export const API_BASE = "https://statsapi.mlb.com/api/v1";

export type StatView = "hitting" | "pitching";

export interface PersonProfile {
  id: number;
  fullName: string;
  primaryNumber?: string | null;
  birthDate?: string;
  birthCity?: string;
  birthStateProvince?: string | null;
  birthCountry?: string;
  height?: string;
  weight?: number;
  active?: boolean;
  isPitcher?: boolean;
  currentTeam?: { id?: number; name?: string };
  primaryPosition?: {
    code?: string | number;
    abbreviation?: string;
    name?: string;
  };
  batSide?: { description?: string };
  pitchHand?: { description?: string };
  mlbDebutDate?: string;
}

export interface StatSplit {
  season?: string;
  team?: { id?: number; name?: string; abbreviation?: string };
  sport?: { abbreviation?: string };
  stat?: Record<string, number | string>;
}

/** A stat split with a unique key (season + team) for keyed each blocks. */
export type SeasonRow = StatSplit & { key: string };

export interface YearByYearResponse {
  stats?: Array<{ splits?: StatSplit[] }>;
}

export interface SeasonTotal {
  season: string;
  stats: Record<string, number>;
}

export interface CareerResponse {
  stats?: Array<{
    stats?: Record<string, number | string>;
    splits?: Array<{ stat?: Record<string, number | string> }>;
  }>;
}

/** GET `url` and parse JSON, returning `null` instead of throwing. */
export async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function personUrl(id: number): string {
  return `${API_BASE}/people/${id}?hydrate=currentTeam`;
}

export function yearByYearUrl(id: number, group: StatView): string {
  return `${API_BASE}/people/${id}/stats?stats=yearByYear&group=${group}`;
}

/**
 * Fetch one player's profile. `/people/{id}` wraps the result in `people`, so
 * callers should not have to remember that.
 */
export async function fetchPerson(
  id: number,
  signal?: AbortSignal,
): Promise<PersonProfile | null> {
  const data = await fetchJson<{ people?: PersonProfile[] }>(
    personUrl(id),
    signal,
  );
  return data?.people?.[0] ?? null;
}

export function careerUrl(id: number, group: StatView): string {
  return `${API_BASE}/people/${id}/stats?stats=career&group=${group}`;
}

function gamesOf(stat?: Record<string, number | string>): number {
  return Number(stat?.gamesPlayed) || 0;
}

/** Stat keys that are averages or ratios — never summable across teams/seasons. */
const NON_ADDITIVE_KEYS = new Set([
  "avg",
  "obp",
  "slg",
  "ops",
  "era",
  "whip",
  "babip",
  "winPercentage",
  "hitsPer9Inn",
  "homeRunsPer9",
  "strikeoutsPer9Inn",
  "walksPer9Inn",
  "runsScoredPer9",
  "pitchesPerInning",
  "strikePercentage",
  "strikeoutWalkRatio",
  "groundOutsToAirouts",
  "caughtStealingPercentage",
  "stolenBasePercentage",
  "atBatsPerHomeRun",
  // Pitching innings are stored as decimal thirds (97.1 means 97 1/3), so they
  // are summed through the `outs` field instead.
  "inningsPitched",
]);

function addStats(
  target: Record<string, number>,
  stat?: Record<string, number | string>,
): void {
  for (const [key, value] of Object.entries(stat ?? {})) {
    if (NON_ADDITIVE_KEYS.has(key)) continue;
    const parsed = typeof value === "number" ? value : Number.parseFloat(`${value}`);
    if (!Number.isFinite(parsed)) continue;
    target[key] = (target[key] ?? 0) + parsed;
  }
}

/**
 * One entry per season with counting stats summed across teams, oldest first.
 * Used for charts, where one point per season is what matters.
 */
export function seasonTotals(rows: SeasonRow[]): SeasonTotal[] {
  const map = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const season = row.season ?? "";
    if (!season) continue;
    const totals = map.get(season) ?? {};
    addStats(totals, row.stat);
    map.set(season, totals);
  }
  return [...map.entries()]
    .map(([season, stats]) => ({ season, stats }))
    .sort((a, b) => Number(a.season) - Number(b.season));
}

/** Counting stats summed over every season of the rows given. */
export function aggregateStats(rows: SeasonRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) addStats(totals, row.stat);
  return totals;
}

/** Pitching innings as a whole number of outs (the API's `outs` field). */
export function inningsOuts(stats: Record<string, number>): number {
  return stats.outs ?? 0;
}

/** Render an innings count (in outs) the way baseball writes it: "97.2". */
export function formatInnings(outsCount: number): string {
  const full = Math.floor(outsCount / 3);
  const remainder = outsCount % 3;
  return remainder === 0 ? `${full}` : `${full}.${remainder}`;
}

/**
 * Year-by-year splits contain one entry per team plus a combined season-total
 * entry (no team), so the same season shows up several times for traded
 * players. Keep the per-team entries and collapse any duplicates so every
 * season of the player's MLB career gets exactly one row per team.
 *
 * `prefix` keeps keys unique when two groups' rows share a namespace.
 */
export function seasonRows(
  resp: YearByYearResponse | null,
  prefix: string,
): SeasonRow[] {
  const splits = (resp?.stats?.[0]?.splits ?? [])
    .filter(
      (s) =>
        s.stat &&
        /^\d{4}$/.test(s.season ?? "") &&
        (s.sport?.abbreviation ?? "MLB") === "MLB",
    )
    // Newest season first. Array#sort is stable, so teams keep API order.
    .sort((a, b) => Number(b.season) - Number(a.season));

  const perTeam = splits.filter((s) => s.team?.id);
  const rows: SeasonRow[] = [];
  for (const split of perTeam.length ? perTeam : splits) {
    const key = `${prefix}:${split.season}-${split.team?.id ?? "total"}`;
    const existing = rows.find((row) => row.key === key);
    if (!existing) {
      rows.push({ ...split, key });
    } else if (gamesOf(split.stat) > gamesOf(existing.stat)) {
      Object.assign(existing, split);
    }
  }
  return rows;
}

/** Career totals: the API puts them either on the stat entry or first split. */
export function careerTotal(
  resp: CareerResponse | null,
): Record<string, number | string> | null {
  return (
    resp?.stats?.[0]?.stats ??
    resp?.stats?.[0]?.splits?.[0]?.stat ??
    null
  );
}

/** "2014–2026" span covered by the given rows. */
export function seasonSpan(rows: SeasonRow[]): string {
  let oldest = "";
  let newest = "";
  for (const row of rows) {
    const season = row.season ?? "";
    if (!oldest || season < oldest) oldest = season;
    if (!newest || season > newest) newest = season;
  }
  if (!oldest) return "";
  return oldest === newest ? oldest : `${oldest}–${newest}`;
}

/** True when the player's primary position is pitcher. */
export function isPrimaryPitcher(profile: PersonProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.isPitcher === true ||
    String(profile.primaryPosition?.code ?? "") === "1" ||
    profile.primaryPosition?.abbreviation === "P"
  );
}

/**
 * Stat group to open on: pitching for pitchers, otherwise hitting. Falls back
 * to whichever group actually has data.
 */
export function preferredView(
  profile: PersonProfile | null,
  hittingRows: SeasonRow[],
  pitchingRows: SeasonRow[],
): StatView {
  if (isPrimaryPitcher(profile) && pitchingRows.length > 0) return "pitching";
  if (hittingRows.length > 0) return "hitting";
  return "pitching";
}

/** Display helper: em dash for missing values. */
export function fmt(value: number | string | undefined | null): string {
  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}

/** Numeric value of a stat, or `null` when it is missing/not a number. */
export function num(value: number | string | undefined | null): number | null {
  const parsed = typeof value === "number" ? value : Number.parseFloat(`${value}`);
  return Number.isFinite(parsed) ? parsed : null;
}
