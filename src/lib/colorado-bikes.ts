/**
 * Client for "Bicycle and Pedestrian Counts in Colorado" (q2qp-xhnj) on
 * data.colorado.gov — CDOT counting stations, 2009–2015.
 *
 * Raw rows are one station-direction-day with 24 hourly text columns
 * (hr00..hr23). We aggregate server-side:
 *  - per station (+mode): 24 sums of counts → hourly profile + totals
 *  - per station+month: sums + days counted → seasonality
 */

const BASE = "https://data.colorado.gov/resource";
export const BIKE_DATASET = "q2qp-xhnj";

export interface BikeStation {
  id: string;
  name: string;
  county: string;
  lat: number;
  lon: number;
  days: number;
  hours: number[]; // counts per hour-of-day, summed across all count days
  total: number;
  hasBike: boolean;
  hasPed: boolean;
}

export interface StationMonth {
  id: string;
  month: number; // 1-12
  days: number;
  total: number;
}

interface RawStation {
  stationid: string;
  datacollected?: string;
  lat?: string;
  long?: string;
  county?: string;
  location?: string;
  days?: string;
  [hourKey: string]: string | undefined;
}

const HOUR_SUMS = Array.from(
  { length: 24 },
  (_, i) => `sum(hr${String(i).padStart(2, "0")}::number) as h${i}`,
).join(",");

async function soda<T>(
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<T[]> {
  const url = `${BASE}/${BIKE_DATASET}.json?${new URLSearchParams(params)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Data API error (${res.status})`);
  return res.json();
}

/** All stations with hourly totals, merged across count modes/years. */
export async function fetchStations(signal?: AbortSignal): Promise<BikeStation[]> {
  const rows = await soda<RawStation>(
    {
      $select: `stationid,datacollected,lat,long,county,location,count(*) as days,${HOUR_SUMS}`,
      $group: "stationid,datacollected,lat,long,county,location",
      $limit: "1000",
    },
    signal,
  );

  const merged = new Map<string, BikeStation>();
  for (const r of rows) {
    const lat = Number(r.lat);
    const lon = Number(r.long);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const dc = (r.datacollected ?? "").toUpperCase();
    const hasBike = dc.includes("BIKE");
    const hasPed = dc.includes("PED");
    const hours = Array.from({ length: 24 }, (_, i) =>
      Math.round(Number(r[`h${i}`]) || 0),
    );
    const days = Number(r.days) || 0;
    const existing = merged.get(r.stationid);
    if (existing) {
      existing.days += days;
      hours.forEach((h, i) => (existing.hours[i] += h));
      existing.total += hours.reduce((a, b) => a + b, 0);
      existing.hasBike ||= hasBike;
      existing.hasPed ||= hasPed;
    } else {
      merged.set(r.stationid, {
        id: r.stationid,
        name: r.location ?? `Station ${r.stationid}`,
        county: r.county ?? "",
        lat,
        lon,
        days,
        hours,
        total: hours.reduce((a, b) => a + b, 0),
        hasBike,
        hasPed,
      });
    }
  }
  return [...merged.values()].filter((s) => s.total > 0);
}

/** Per station+month totals (for seasonality charts). */
export async function fetchStationMonths(
  signal?: AbortSignal,
): Promise<StationMonth[]> {
  const rows = await soda<RawStation & { month?: string }>(
    {
      $select: `stationid,month,count(*) as days,${HOUR_SUMS}`,
      $group: "stationid,month",
      $limit: "50000",
    },
    signal,
  );
  return rows
    .map((r) => ({
      id: r.stationid,
      month: Math.round(Number(r.month)),
      days: Number(r.days) || 0,
      total: Object.keys(r)
        .filter((k) => /^h\d+$/.test(k))
        .reduce((a, k) => a + (Number(r[k]) || 0), 0),
    }))
    .filter((r) => r.month >= 1 && r.month <= 12);
}

/** Years covered by the dataset. */
export async function fetchYearsCovered(
  signal?: AbortSignal,
): Promise<number[]> {
  const rows = await soda<{ year: string; n: string }>(
    {
      $select: "year,count(*) as n",
      $group: "year",
      $order: "year",
    },
    signal,
  );
  return rows.map((r) => Math.round(Number(r.year))).filter(Number.isFinite);
}

export function modeLabel(s: { hasBike: boolean; hasPed: boolean }): string {
  if (s.hasBike && s.hasPed) return "Bikes & pedestrians";
  if (s.hasBike) return "Bikes";
  return "Pedestrians";
}

export const fmtInt = new Intl.NumberFormat("en-US");
