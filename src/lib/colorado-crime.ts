/**
 * Client for "Crimes in Colorado" (j6g4-gayk) on data.colorado.gov.
 *
 * NIBRS-style incident records, 2016–2024, from ~200 reporting agencies.
 * Quirks: no coordinates (agency + county only), so all aggregation is done
 * server-side with SoQL group-bys and small result sets.
 */

const BASE = "https://data.colorado.gov/resource";
export const CRIME_DATASET = "j6g4-gayk";

export const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

const esc = (s: string) => s.replace(/'/g, "''");

async function soda<T>(
  params: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<T[]> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, v);
  }
  const url = `${BASE}/${CRIME_DATASET}.json?${search}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Data API error (${res.status})`);
  return res.json();
}

function whereFor(agency: string | null, extra?: string): string | undefined {
  const parts: string[] = [];
  if (agency) parts.push(`pub_agency_name='${esc(agency)}'`);
  if (extra) parts.push(extra);
  return parts.length ? parts.join(" AND ") : undefined;
}

export interface AgencyRow {
  name: string;
  count: number;
}

/** Reporting agencies, biggest first. */
export async function fetchAgencies(signal?: AbortSignal): Promise<AgencyRow[]> {
  const rows = await soda<{ pub_agency_name: string; n: string }>(
    {
      $select: "pub_agency_name,count(*) as n",
      $group: "pub_agency_name",
      $order: "n DESC",
      $limit: "250",
    },
    signal,
  );
  return rows
    .map((r) => ({ name: r.pub_agency_name, count: Number(r.n) }))
    .filter((r) => r.count >= 500);
}

/** Incident totals per offense category (optionally within a date range). */
export async function fetchCategoryTotals(
  agency: string | null,
  signal?: AbortSignal,
): Promise<{ cat: string; n: number }[]> {
  const rows = await soda<{ cat: string; n: string }>(
    {
      $where: whereFor(agency),
      $select: "offense_category_name as cat,count(*) as n",
      $group: "cat",
      $order: "n DESC",
      $limit: "100",
    },
    signal,
  );
  return rows.map((r) => ({ cat: r.cat, n: Number(r.n) }));
}

/** Incident totals per offense category for one calendar year. */
export async function fetchYearCategories(
  agency: string | null,
  year: number,
  signal?: AbortSignal,
): Promise<{ cat: string; n: number }[]> {
  const rows = await soda<{ cat: string; n: string }>(
    {
      $where: whereFor(
        agency,
        `incident_date between '${year}-01-01' and '${year}-12-31'`,
      ),
      $select: "offense_category_name as cat,count(*) as n",
      $group: "cat",
      $limit: "100",
    },
    signal,
  );
  return rows.map((r) => ({ cat: r.cat, n: Number(r.n) }));
}

/** One row per calendar day with incident counts (for dow/seasonal math). */
export async function fetchDailyCounts(
  agency: string | null,
  signal?: AbortSignal,
): Promise<{ dateMs: number; n: number }[]> {
  const rows = await soda<{ incident_date: string; n: string }>(
    {
      $where: whereFor(agency),
      $select: "incident_date,count(*) as n",
      $group: "incident_date",
      $limit: "50000",
    },
    signal,
  );
  return rows
    .map((r) => ({ dateMs: new Date(r.incident_date).getTime(), n: Number(r.n) }))
    .filter((r) => Number.isFinite(r.dateMs));
}

/** Incident counts by hour of day (0–23), across all years. */
export async function fetchHourlyCounts(
  agency: string | null,
  signal?: AbortSignal,
): Promise<{ hour: number; n: number }[]> {
  const rows = await soda<{ hr: string; n: string }>(
    {
      $where: whereFor(agency, "incident_hour is not null"),
      $select: "incident_hour as hr,count(*) as n",
      $group: "hr",
      $limit: "30",
    },
    signal,
  );
  return rows
    .map((r) => ({ hour: Math.round(Number(r.hr)), n: Number(r.n) }))
    .filter((r) => Number.isFinite(r.hour) && r.hour >= 0 && r.hour <= 23)
    .sort((a, b) => a.hour - b.hour);
}

export const fmtInt = new Intl.NumberFormat("en-US");

export const fmtCompact = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(Math.round(n));
