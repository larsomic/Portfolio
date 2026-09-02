/**
 * Shared fetch helpers for the USA Pulse tabs.
 */
import { queryData, type DataRow, type Member } from "$lib/datausa.js";

export type Level = "State" | "MSA" | "County";

/**
 * Fetch a distribution cube for both places (all years), then keep only the
 * latest year available — one request per place, no global year picker needed.
 */
export async function fetchLatestDist(
  level: Level,
  a: Member,
  b: Member,
  cube: string,
  measure: string,
  extraDrills: string[],
): Promise<{ year: number; rowsA: DataRow[]; rowsB: DataRow[] }> {
  const lists = await Promise.all(
    [a, b].map((p) =>
      queryData({
        cube,
        drilldowns: [level, ...extraDrills, "Year"],
        measures: [measure],
        filters: [[level, p.key]],
      }),
    ),
  );
  const years = lists
    .flat()
    .map((r) => Number(r.Year) || 0)
    .filter(Number.isFinite);
  const year = years.length ? Math.max(...years) : 0;
  return {
    year,
    rowsA: lists[0].filter((r) => Number(r.Year) === year),
    rowsB: lists[1].filter((r) => Number(r.Year) === year),
  };
}

/** Aggregate rows into label → value using a labelOf function. */
export function aggregate(
  rows: DataRow[],
  labelOf: (r: DataRow) => string | null,
  measure: string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const label = labelOf(r);
    if (!label) continue;
    const v = Number(r[measure]);
    if (!Number.isFinite(v)) continue;
    map.set(label, (map.get(label) ?? 0) + v);
  }
  return map;
}

/** Union two label→value maps into paired rows for compare-bars. */
export function pairRows(
  a: Map<string, number>,
  b: Map<string, number>,
): { label: string; a: number | null; b: number | null }[] {
  const labels = new Set([...a.keys(), ...b.keys()]);
  return [...labels].map((label) => ({
    label,
    a: a.get(label) ?? null,
    b: b.get(label) ?? null,
  }));
}
