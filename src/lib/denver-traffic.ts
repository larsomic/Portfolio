/**
 * Client for the City of Denver Traffic Accidents dataset
 * (Socrata SODA on data.colorado.gov, dataset cpwf-cznk).
 *
 * Quirks discovered:
 * - Every column is stored as TEXT, so numeric/date comparisons need a
 *   `::number` cast in the $where clause.
 * - Column names are truncated upstream and don't always match their values;
 *   we decode them here into a clean shape.
 */

export const DATASET = "cpwf-cznk";
const BASE = "https://data.colorado.gov/resource";

export interface TrafficVehicle {
  type: string | null;
  direction: string | null;
  action: string | null;
  factor: string | null;
}

export interface Accident {
  id: string;
  caseNumber: string | null;
  timeMs: number;
  lng: number;
  lat: number;
  intersection: string | null;
  neighborhood: string | null;
  precinct: string | null;
  collisionType: string | null;
  roadway: string | null;
  intersectionRelated: string | null;
  alignment: string | null;
  weather: string | null;
  lighting: string | null;
  vehicle1: TrafficVehicle | null;
  vehicle2: TrafficVehicle | null;
  fatalities: number;
  pedestriansInjured: number;
}

interface RawRow {
  incident_i?: string;
  offense_id?: string;
  reported_d?: string;
  geo_lat?: string; // actually longitude (truncation mishmash)
  district_i?: string; // actually latitude
  geo_x?: string; // intersection / street description
  bicycle_in?: string; // neighborhood name
  precinct_i?: string;
  harmful__1?: string; // collision type
  road_descr?: string; // on/off roadway
  road_conto?: string; // intersection related flag
  road_condi?: string; // road alignment
  light_cond?: string; // weather condition
  tu1_vehicl?: string; // lighting condition
  tu1_travel?: string;
  tu1_vehi_1?: string;
  tu1_driver?: string;
  tu1_driv_1?: string;
  tu2_travel?: string;
  tu2_vehi_1?: string;
  tu2_driver?: string;
  tu2_driv_1?: string;
  fatalities?: string;
  pedestrian?: string;
}

const TITLE = (s: string | null): string | null => {
  if (!s) return null;
  // normalize the ALL-CAPS / lowercase legacy records
  if (s === s.toUpperCase() || s === s.toLowerCase()) {
    return s
      .toLowerCase()
      .split(" ")
      .map((w) => (/^(nb|sb|eb|wb)$/.test(w) ? w.toUpperCase() : w.replace(/^\w/, (c) => c.toUpperCase())))
      .join(" ");
  }
  return s;
};

function decode(r: RawRow): Accident | null {
  const lng = Number(r.geo_lat);
  const lat = Number(r.district_i);
  const timeMs = Number(r.reported_d);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng === 0 || lat === 0 || !Number.isFinite(timeMs)) return null;

  const v1 =
    r.tu1_travel || r.tu1_driver
      ? {
          type: r.tu1_travel ?? null,
          direction: r.tu1_vehi_1 ?? null,
          action: TITLE(r.tu1_driver ?? null),
          factor: TITLE(r.tu1_driv_1 ?? null),
        }
      : null;
  const v2 =
    r.tu2_travel || r.tu2_driver
      ? {
          type: r.tu2_travel ?? null,
          direction: r.tu2_vehi_1 ?? null,
          action: TITLE(r.tu2_driver ?? null),
          factor: TITLE(r.tu2_driv_1 ?? null),
        }
      : null;

  return {
    id: r.incident_i ?? Math.random().toString(36).slice(2),
    caseNumber: r.offense_id ?? null,
    timeMs,
    lng,
    lat,
    intersection: TITLE(r.geo_x ?? null),
    neighborhood: r.bicycle_in ?? null,
    precinct: r.precinct_i ?? null,
    collisionType: TITLE(r.harmful__1 ?? null),
    roadway: TITLE(r.road_descr ?? null),
    intersectionRelated: TITLE(r.road_conto ?? null),
    alignment: TITLE(r.road_condi ?? null),
    weather: TITLE(r.light_cond ?? null),
    lighting: TITLE(r.tu1_vehicl ?? null),
    vehicle1: v1,
    vehicle2: v2,
    fatalities: Number(r.fatalities) || 0,
    pedestriansInjured: Number(r.pedestrian) || 0,
  };
}

/** Epoch-ms window for a local calendar day (YYYY-MM-DD). */
export function dayWindow(dateStr: string): { start: number; end: number } {
  const start = Date.parse(`${dateStr}T00:00:00`);
  return { start, end: start + 86_400_000 };
}

export function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Fetch all reported accidents for a local calendar day.
 * Uses the `::number` cast because every column is TEXT upstream.
 */
export async function fetchAccidentsForDay(
  dateStr: string,
  signal?: AbortSignal,
): Promise<Accident[]> {
  const { start, end } = dayWindow(dateStr);
  const params = new URLSearchParams({
    $where: `reported_d::number >= ${start} AND reported_d::number < ${end}`,
    $limit: "2000",
  });
  const res = await fetch(`${BASE}/${DATASET}.json?${params}`, { signal });
  if (!res.ok) throw new Error(`Data API error (${res.status})`);
  const rows: RawRow[] = await res.json();
  return rows
    .map(decode)
    .filter((a): a is Accident => a !== null)
    .sort((a, b) => a.timeMs - b.timeMs);
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Total accidents + fatalities per day summary. */
export function summarize(accidents: Accident[]) {
  const fatalities = accidents.reduce((n, a) => n + a.fatalities, 0);
  const pedInjured = accidents.reduce((n, a) => n + a.pedestriansInjured, 0);
  const hoodCounts = new Map<string, number>();
  for (const a of accidents) {
    if (a.neighborhood) {
      hoodCounts.set(
        a.neighborhood,
        (hoodCounts.get(a.neighborhood) ?? 0) + 1,
      );
    }
  }
  const topHoods = [...hoodCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .slice(0, 5);
  return { fatalities, pedInjured, topHoods };
}
