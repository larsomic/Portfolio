/**
 * DATA USA API client (https://datausa.io/about/api/).
 *
 * Tesseract-style OLAP API:
 *   - /tesseract/cubes, /tesseract/cubes/{name}  → schema discovery
 *   - /tesseract/members?cube=&level=            → filter values (key + caption)
 *   - /tesseract/data.jsonrecords?cube=&drilldowns=&measures=&include=
 * `include` filters MUST use member keys (e.g. State:04000US53), not captions.
 */

export const DATAUSA_API = "https://api.datausa.io/tesseract";

/** Cube ids we use — all ACS 5-year unless noted. */
export const CUBES = {
  population: "acs_yg_total_population_5",
  medianAge: "acs_ygs_median_age_total_5",
  race: "acs_ygr_race_with_hispanic_5",
  foreignBorn: "acs_ygf_place_of_birth_for_foreign_born_5",
  householdIncome: "acs_yg_household_income_5",
  gini: "acs_yg_gini_5",
  industryEarnings: "acs_ygi_industry_for_median_earnings_5",
  occupationEarnings: "acs_ygo_occupation_for_median_earnings_5",
  healthCoverage: "acs_ygh_health_care_coverage_overall_5",
  housingValue: "acs_ygo_housing_value_bucket_5",
  tenure: "acs_ygo_tenure_5",
  commuteMeans: "acs_ygt_means_of_transportation_to_work_5",
} as const;

export interface Member {
  key: string;
  caption: string;
}

type Level = "State" | "MSA" | "County";

export interface DataRow {
  [column: string]: string | number | null;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`DATA USA request failed (${res.status})`);
  return (await res.json()) as T;
}

/** Distinct members for a level of a cube — used to populate pickers. */
export async function fetchMembers(
  cube: string,
  level: Level,
  signal?: AbortSignal,
): Promise<Member[]> {
  const url = `${DATAUSA_API}/members?cube=${cube}&level=${level}`;
  const data = await getJson<{ members?: Member[] }>(url, signal);
  return (data.members ?? []).filter((m) => m.key && m.caption);
}

export interface QuerySpec {
  cube: string;
  /** e.g. ["State", "Year"] */
  drilldowns: string[];
  /** measure names exactly as they appear in the cube schema */
  measures: string[];
  /** pairs of [column, memberKey] — joined with ';' server-side */
  filters?: [string, string][];
  limit?: number;
}

export async function queryData(
  spec: QuerySpec,
  signal?: AbortSignal,
): Promise<DataRow[]> {
  const params = new URLSearchParams();
  params.set("cube", spec.cube);
  params.set("drilldowns", spec.drilldowns.join(","));
  params.set("measures", spec.measures.join(","));
  if (spec.filters?.length) {
    params.set(
      "include",
      spec.filters.map(([col, key]) => `${col}:${key}`).join(";"),
    );
  }
  params.set("limit", String(spec.limit ?? 100000));
  const url = `${DATAUSA_API}/data.jsonrecords?${params.toString()}`;
  const data = await getJson<{ data?: DataRow[] }>(url, signal);
  return data.data ?? [];
}

/* --------------------------------- format --------------------------------- */

export function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString();
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return `${(n / 1e3).toFixed(0)}K`;
  return fmtInt(n);
}
