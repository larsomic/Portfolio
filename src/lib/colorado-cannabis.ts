/**
 * Client for Colorado retail & medical marijuana sales,
 * "Marijuana Sales by County in Colorado" (j7a3-jgd3) on data.colorado.gov.
 *
 * Monthly rows per county since Dec 2014; a `county: "Total"` row carries
 * the statewide figure. All values are dollar amounts stored as text.
 */

const BASE = "https://data.colorado.gov/resource";
export const SALES_DATASET = "j7a3-jgd3";

export interface CountyMonthSales {
  /** Epoch ms for the first of the month (local). */
  dateMs: number;
  year: number;
  month: number; // 1-12
  county: string;
  medical: number;
  retail: number;
}

interface RawSale {
  month?: string;
  year?: string;
  county?: string;
  med_sales?: string;
  rec_sales?: string;
}

export async function fetchCannabisSales(
  signal?: AbortSignal,
): Promise<CountyMonthSales[]> {
  const params = new URLSearchParams({
    $select: "month,year,county,med_sales,rec_sales",
    $limit: "10000",
  });
  const res = await fetch(`${BASE}/${SALES_DATASET}.json?${params}`, {
    signal,
  });
  if (!res.ok) throw new Error(`Data API error (${res.status})`);
  const rows: RawSale[] = await res.json();
  return rows
    .map((r) => {
      const year = Math.round(Number(r.year));
      const month = Math.round(Number(r.month));
      if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
      return {
        dateMs: new Date(year, month - 1, 1).getTime(),
        year,
        month,
        county: r.county ?? "Unknown",
        medical: Number(r.med_sales) || 0,
        retail: Number(r.rec_sales) || 0,
      };
    })
    .filter((r): r is CountyMonthSales => r !== null)
    .sort((a, b) => a.dateMs - b.dateMs);
}

export const fmtMoney = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(abs >= 1e10 ? 1 : 2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(abs >= 1e7 ? 1 : 2)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n)}`;
};

export const fmtMonth = (dateMs: number, withYear = true): string => {
  const d = new Date(dateMs);
  const m = d.toLocaleString("en-US", { month: "short" });
  return withYear ? `${m} ${d.getFullYear()}` : m;
};
