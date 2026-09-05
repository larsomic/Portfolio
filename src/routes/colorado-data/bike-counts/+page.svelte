<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import StationMap from "$lib/components/traffic/station-map.svelte";
  import { modeLabel, fmtInt } from "$lib/colorado-bikes.js";
  import { cn } from "$lib/utils.js";
  import type { PageData } from "./$types.js";

  type ModeFilter = "all" | "bike" | "ped";

  const MODE_FILTERS: [ModeFilter, string][] = [
    ["all", "All"],
    ["bike", "Bikes"],
    ["ped", "Pedestrians"],
  ];

  // Datasets are fetched server-side in +page.ts and cached for an hour.
  let { data }: { data: PageData } = $props();
  const stations = $derived(data.stations);
  const stationMonths = $derived(data.stationMonths);
  const years = $derived(data.years);

  let modeFilter = $state<ModeFilter>("all");
  let selectedId = $state<string | null>(null);

  const filtered = $derived(
    stations.filter((s) =>
      modeFilter === "all"
        ? true
        : modeFilter === "bike"
          ? s.hasBike
          : s.hasPed,
    ),
  );

  const busiest = $derived(
    [...filtered].sort((a, b) => b.total - a.total)[0] ?? null,
  );

  // Default selection: the busiest station in the current filter.
  $effect(() => {
    const b = busiest;
    if (b && (!selectedId || !filtered.some((s) => s.id === selectedId))) {
      selectedId = b.id;
    }
  });

  const selected = $derived(
    filtered.find((s) => s.id === selectedId) ?? null,
  );

  const hourSeries = $derived.by((): TrendSeries[] => {
    if (!selected) return [];
    return [
      {
        name: "Counts",
        color: selected.hasBike && selected.hasPed ? "#f59e0b" : selected.hasBike ? "#10b981" : "#8b5cf6",
        points: selected.hours.map((n, h) => ({ x: h, y: n })),
      },
    ];
  });

  const seasonSeries = $derived.by((): TrendSeries[] => {
    if (!selected) return [];
    const rows = stationMonths.filter((m) => m.id === selected.id);
    const byMonth = new Map<number, { total: number; days: number }>();
    for (const r of rows) {
      const cur = byMonth.get(r.month) ?? { total: 0, days: 0 };
      cur.total += r.total;
      cur.days += r.days;
      byMonth.set(r.month, cur);
    }
    const color = selected.hasBike && selected.hasPed ? "#f59e0b" : selected.hasBike ? "#10b981" : "#8b5cf6";
    return [
      {
        name: "Avg per day",
        color,
        points: [...byMonth.entries()]
          .filter(([, v]) => v.days > 0)
          .map(([month, v]) => ({ x: month, y: v.total / v.days }))
          .sort((a, b) => a.x - b.x),
      },
    ];
  });

  const topStations = $derived(
    [...filtered].sort((a, b) => b.total - a.total).slice(0, 12),
  );

  const maxTop = $derived(
    topStations.length ? topStations[0].total : 1,
  );

  const totals = $derived.by(() => {
    let counts = 0;
    let days = 0;
    for (const s of filtered) {
      counts += s.total;
      days += s.days;
    }
    return { counts, days };
  });

  const yearsLabel = $derived(
    years.length ? `${years[0]}–${years[years.length - 1]}` : "—",
  );

  const fmtAvg = (n: number) => Math.round(n).toLocaleString("en-US");

  const rush = $derived.by(() => {
    const h = busiest?.hours ?? new Array(24).fill(0);
    return {
      am: h.slice(6, 9).reduce((a, b) => a + b, 0),
      pm: h.slice(15, 18).reduce((a, b) => a + b, 0),
    };
  });
</script>

<svelte:head>
  <title>Bike &amp; Ped Counts | Colorado Data</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Where Colorado Works Out</h1>
      <h2 class="text-muted-foreground mt-1 text-sm font-normal">
        CDOT bicycle &amp; pedestrian counting stations — every recorded count,
        {yearsLabel}. Dot size is total volume; color is what they were counting.
      </h2>
    </div>
    <div class="flex items-center gap-1">
      {#each MODE_FILTERS as [m, label] (m)}
        <Button
          size="sm"
          variant={modeFilter === m ? "secondary" : "ghost"}
          class={cn("text-muted-foreground hover:text-foreground")}
          onclick={() => (modeFilter = m)}>
          {label}
        </Button>
      {/each}
    </div>
  </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Counting stations</p>
          <p class="text-2xl font-bold tabular-nums">{fmtInt.format(filtered.length)}</p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">People counted</p>
          <p class="text-2xl font-bold tabular-nums">{fmtInt.format(totals.counts)}</p>
          <p class="text-muted-foreground text-xs">across {fmtInt.format(totals.days)} days recorded</p>
        </Card.Content>
      </Card.Root>
      {#if busiest}
        <Card.Root>
          <Card.Content class="py-3">
            <p class="text-muted-foreground text-xs">Busiest station</p>
            <p class="text-lg font-bold">{busiest.county} · {fmtInt.format(busiest.total)}</p>
            <p class="text-muted-foreground truncate text-xs">{busiest.name}</p>
          </Card.Content>
        </Card.Root>
      {/if}
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Morning vs evening rush</p>
          <p class="text-2xl font-bold tabular-nums">
            {fmtAvg(rush.am)} <span class="text-muted-foreground text-base font-normal">vs</span> {fmtAvg(rush.pm)}
          </p>
          <p class="text-muted-foreground text-xs">at the busiest spot (7–9am / 3–6pm)</p>
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <StationMap stations={filtered} bind:selectedId />

      <div class="flex flex-col gap-4">
        {#if selected}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-base">{selected.name}</Card.Title>
              <Card.Description class="text-xs">
                {modeLabel(selected)} · {selected.county} County ·
                {fmtInt.format(selected.days)} days recorded
              </Card.Description>
            </Card.Header>
          </Card.Root>
        {/if}

        <Card.Root class="flex-1">
          <Card.Header class="pb-2">
            <Card.Title class="text-base">Top spots</Card.Title>
            <Card.Description class="text-xs">
              Click to fly the map there
            </Card.Description>
          </Card.Header>
          <Card.Content class="flex flex-col gap-1.5">
            {#each topStations as s (s.id)}
              <button
                type="button"
                class={cn(
                  "hover:bg-muted w-full rounded-md px-2 py-1 text-left transition-colors",
                  selectedId === s.id && "bg-muted",
                )}
                onclick={() => (selectedId = s.id)}>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="truncate">{s.county} — {s.name}</span>
                  <span class="shrink-0 font-mono tabular-nums" style={`color:${s.hasBike && s.hasPed ? '#f59e0b' : s.hasBike ? '#10b981' : '#8b5cf6'}`}>
                    {fmtInt.format(s.total)}
                  </span>
                </div>
                <div class="bg-muted mt-1 h-1.5 overflow-hidden rounded-sm">
                  <div
                    class="h-full rounded-sm"
                    style={`width:${(s.total / maxTop) * 100}%;background:${s.hasBike && s.hasPed ? '#f59e0b' : s.hasBike ? '#10b981' : '#8b5cf6'}`}></div>
                </div>
              </button>
            {/each}
          </Card.Content>
        </Card.Root>
      </div>
    </div>

    {#if selected}
      <div class="grid gap-4 lg:grid-cols-2">
        <Card.Root>
          <Card.Header class="pb-1">
            <Card.Title class="text-base">Time of day</Card.Title>
            <Card.Description class="text-xs">
              Total counts by hour at {selected.county} — every recorded day
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <TrendChart series={hourSeries} height={260} fmtY={fmtAvg} />
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header class="pb-1">
            <Card.Title class="text-base">Seasonality</Card.Title>
            <Card.Description class="text-xs">
              Average counts per day in each month — Coloradans ride a lot more in July
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <TrendChart series={seasonSeries} height={260} fmtY={fmtAvg} />
          </Card.Content>
        </Card.Root>
      </div>

      <p class="text-muted-foreground text-xs">
        Source: "Bicycle and Pedestrian Counts in Colorado" (q2qp-xhnj), CDOT
        via data.colorado.gov. Counts are from tube/lever counters and manual
        surveys at {filtered.length} stations, {yearsLabel}. Most stations only
        counted for a season or two — the map shows where infrastructure and
        culture already put people on bikes and foot.
      </p>
    {/if}
</div>
