<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import CompareBars, { type CompareRow } from "$lib/components/pulse/compare-bars.svelte";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import { CUBES, fmtInt, queryData } from "$lib/datausa.js";
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
  let incomeRows = $state<CompareRow[]>([]);
  let giniSeries = $state<TrendSeries[]>([]);

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [inc, ginis] = await Promise.all([
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.householdIncome,
            "Household Income",
            ["Household Income Bucket"],
          ),
          Promise.all(
            [a, b].map(async (p, i) => {
              const rows = await queryData({
                cube: CUBES.gini,
                drilldowns: [level, "Year"],
                measures: ["Wage GINI"],
                filters: [[level, p.key]],
              });
              return {
                name: p.caption,
                color: COLORS[i],
                points: rows
                  .map((r) => ({
                    x: Number(r.Year),
                    y: Number(r["Wage GINI"]),
                  }))
                  .filter((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y))
                  .sort((x, y) => x.x - y.x),
              } satisfies TrendSeries;
            }),
          ),
        ]);
        if (aborted) return;
        year = inc.year;
        incomeRows = pairRows(
          aggregate(
            inc.rowsA,
            (r) => String(r["Household Income Bucket"] ?? ""),
            "Household Income",
          ),
          aggregate(
            inc.rowsB,
            (r) => String(r["Household Income Bucket"] ?? ""),
            "Household Income",
          ),
        );
        giniSeries = ginis;
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
    <Skeleton class="h-96 w-full rounded-lg" />
    <Skeleton class="h-72 w-full rounded-lg" />
  </div>
{:else}
  <div class="grid gap-4 lg:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Household income distribution</Card.Title>
        <Card.Description class="text-xs">
          Households per income bracket, {year} · {asPercent ? "share of each place’s households" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={incomeRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtInt}
          percent={asPercent}
          maxRows={18} />
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Income inequality (Gini index)</Card.Title>
        <Card.Description class="text-xs">
          Wage GINI, 0 = perfect equality, 1 = total inequality
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <TrendChart
          series={giniSeries}
          fmtY={(n) => n.toFixed(3)}
          yLabel="GINI" />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
