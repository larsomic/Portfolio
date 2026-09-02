<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import {
    CUBES,
    fmtCompact,
    queryData,
    type DataRow,
    type Member,
  } from "$lib/datausa.js";

  let {
    level,
    a,
    b,
  }: { level: "State" | "MSA" | "County"; a: Member; b: Member } = $props();

  let loading = $state(true);
  let popSeries = $state<TrendSeries[]>([]);
  let ageSeries = $state<TrendSeries[]>([]);
  const COLORS = ["#0ea5e9", "#f59e0b"];

  async function trend(cube: string, measure: string) {
    const places = [a, b];
    const lists = await Promise.all(
      places.map((p) =>
        queryData({
          cube,
          drilldowns: [level, "Year"],
          measures: [measure],
          filters: [[level, p.key]],
        }),
      ),
    );
    return lists.map((rows: DataRow[], i: number) => ({
      name: places[i].caption,
      color: COLORS[i],
      points: rows
        .map((r) => ({ x: Number(r.Year), y: Number(r[measure]) }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
        .sort((p, q) => p.x - q.x),
    }));
  }

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [pop, age] = await Promise.all([
          trend(CUBES.population, "Population"),
          trend(CUBES.medianAge, "Median Age"),
        ]);
        if (aborted) return;
        popSeries = pop;
        ageSeries = age;
      } finally {
        if (!aborted) loading = false;
      }
    })();
    return () => {
      aborted = true;
    };
  });

  function statCards(sList: TrendSeries[]) {
    return sList.map((s) => {
      const pts = s?.points ?? [];
      const first = pts[0];
      const last = pts[pts.length - 1];
      return {
        name: s?.name ?? "",
        latestY: last?.y ?? null,
        change: first && last && first.y ? last.y / first.y - 1 : null,
      };
    });
  }

  const popStats = $derived(statCards(popSeries));
  const ageStats = $derived(statCards(ageSeries));
</script>

{#if loading}
  <div class="grid gap-4 md:grid-cols-2">
    <Skeleton class="h-72 w-full rounded-lg" />
    <Skeleton class="h-72 w-full rounded-lg" />
  </div>
{:else}
  <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {#each popStats as st (st.name)}
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">{st.name} · latest population</p>
          <p class="text-xl font-bold tabular-nums">{fmtCompact(st.latestY)}</p>
          {#if st.change != null}
            <p class="text-muted-foreground text-xs">
              {st.change >= 0 ? "+" : ""}{(st.change * 100).toFixed(1)}% over the series
            </p>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
    {#each ageStats as st (st.name)}
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">{st.name} · median age</p>
          <p class="text-xl font-bold tabular-nums">{st.latestY?.toFixed(1) ?? "—"}</p>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Population over time</Card.Title>
        <Card.Description class="text-xs">
          ACS 5-year estimates, latest vintage
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <TrendChart series={popSeries} fmtY={fmtCompact} />
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Median age over time</Card.Title>
      </Card.Header>
      <Card.Content>
        <TrendChart series={ageSeries} fmtY={(n) => n.toFixed(0)} />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
