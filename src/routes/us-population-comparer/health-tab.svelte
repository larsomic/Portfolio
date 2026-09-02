<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import CompareBars, { type CompareRow } from "$lib/components/pulse/compare-bars.svelte";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import { CUBES, fmtCompact, queryData, type DataRow } from "$lib/datausa.js";
  import { aggregate, fetchLatestDist, pairRows, type Level } from "./helpers.js";
  import type { Member } from "$lib/datausa.js";

  let {
    level,
    a,
    b,
    asPercent = false,
  }: { level: Level; a: Member; b: Member; asPercent?: boolean } = $props();

  const COLORS = ["#0ea5e9", "#f59e0b"];
  let loading = $state(true);
  let year = $state(0);
  let coverageRows = $state<CompareRow[]>([]);
  let uninsuredSeries = $state<TrendSeries[]>([]);

  function shortCoverage(r: DataRow): string | null {
    const s = String(r["Health Coverage"] ?? "");
    if (/No Health Insurance/i.test(s)) return "Uninsured";
    if (/More Than One/i.test(s)) return "Multiple coverage types";
    if (/Employer/i.test(s)) return "Employer-based only";
    if (/Direct.Purchase|Private/i.test(s)) return "Direct purchase only";
    if (/Medicare/i.test(s)) return "Medicare only";
    if (/Medicaid|Means.Tested/i.test(s)) return "Public (Medicaid etc.) only";
    if (/Military|TRICARE/i.test(s)) return "Military only";
    return null;
  }

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [cov, allRows] = await Promise.all([
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.healthCoverage,
            "Health Insurance Policies",
            ["Health Coverage"],
          ),
          Promise.all(
            [a, b].map((p) =>
              queryData({
                cube: CUBES.healthCoverage,
                drilldowns: [level, "Health Coverage", "Year"],
                measures: ["Health Insurance Policies"],
                filters: [[level, p.key]],
              }),
            ),
          ),
        ]);
        if (aborted) return;
        year = cov.year;
        coverageRows = pairRows(
          aggregate(cov.rowsA, shortCoverage, "Health Insurance Policies"),
          aggregate(cov.rowsB, shortCoverage, "Health Insurance Policies"),
        );
        uninsuredSeries = allRows.map((rows, idx) => {
          const totals: Record<number, { total: number; uninsured: number }> = {};
          for (const r of rows) {
            const y = Number(r.Year);
            const v = Number(r["Health Insurance Policies"]) || 0;
            if (!Number.isFinite(y)) continue;
            const rec = (totals[y] ??= { total: 0, uninsured: 0 });
            rec.total += v;
            if (/No Health Insurance/i.test(String(r["Health Coverage"] ?? "")))
              rec.uninsured += v;
          }
          return {
            name: [a, b][idx].caption,
            color: COLORS[idx],
            points: Object.entries(totals)
              .filter(([, rec]) => rec.total > 0)
              .map(([yStr, rec]) => ({
                x: Number(yStr),
                y: (rec.uninsured / rec.total) * 100,
              }))
              .sort((p, q) => p.x - q.x),
          } satisfies TrendSeries;
        });
      } finally {
        if (!aborted) loading = false;
      }
    })();
    return () => {
      aborted = true;
    };
  });
</script>

{#if loading}
  <div class="grid gap-4 md:grid-cols-2">
    <Skeleton class="h-80 w-full rounded-lg" />
    <Skeleton class="h-72 w-full rounded-lg" />
  </div>
{:else}
  <div class="grid gap-4 lg:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Health insurance coverage</Card.Title>
        <Card.Description class="text-xs">
          People with each coverage type, {year} · {asPercent ? "share of each place’s population" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={coverageRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={9} />
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Uninsured rate over time</Card.Title>
        <Card.Description class="text-xs">
          Share of population with no health insurance
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <TrendChart
          series={uninsuredSeries}
          fmtY={(n) => `${n.toFixed(1)}%`}
          yLabel="uninsured %" />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
