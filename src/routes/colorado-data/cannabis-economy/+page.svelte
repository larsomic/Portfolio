<script lang="ts">
  import {
    IconPlayerPause,
    IconPlayerPlay,
    IconTrendingUp,
  } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import {
    fetchCannabisSales,
    fmtMoney,
    fmtMonth,
    type CountyMonthSales,
  } from "$lib/colorado-cannabis.js";
  import { cn } from "$lib/utils.js";

  const COLOR_RETAIL = "#10b981"; // emerald
  const COLOR_MEDICAL = "#8b5cf6"; // violet
  const TOP_N = 12;
  const ROW_H = 34;

  type Mode = "retail" | "medical" | "combined";

  let rows = $state<CountyMonthSales[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let mode = $state<Mode>("retail");
  let cumulative = $state(true);
  let idx = $state(0);
  let playing = $state(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    let aborted = false;
    (async () => {
      try {
        const data = await fetchCannabisSales();
        if (!aborted) rows = data;
      } catch (e) {
        if (!aborted)
          error = e instanceof Error ? e.message : "Failed to load data";
      } finally {
        if (!aborted) loading = false;
      }
    })();
    return () => {
      aborted = true;
      stop();
    };
  });

  const stateRows = $derived(rows.filter((r) => r.county === "Total"));
  const countyRows = $derived(rows.filter((r) => r.county !== "Total"));

  /** Sorted unique month timestamps. */
  const months = $derived.by(() => {
    const set = new Set<number>();
    for (const r of rows) set.add(r.dateMs);
    return [...set].sort((a, b) => a - b);
  });

  /** Value accessor for the current mode. */
  function valueOf(r: CountyMonthSales, m: Mode): number {
    if (m === "retail") return r.retail;
    if (m === "medical") return r.medical;
    return r.retail + r.medical;
  }

  /** Per-month county values: months[i] -> Map(county -> value). */
  const monthlyByCounty = $derived.by(() => {
    const out = new Map<number, Map<string, number>>();
    for (const r of countyRows) {
      let m = out.get(r.dateMs);
      if (!m) out.set(r.dateMs, (m = new Map()));
      m.set(r.county, (m.get(r.county) ?? 0) + valueOf(r, mode));
    }
    return out;
  });

  /** Cumulative sums per county through each month. */
  const cumulativeByCounty = $derived.by(() => {
    const out: Map<string, number>[] = [];
    const running = new Map<string, number>();
    for (const ms of months) {
      const m = monthlyByCounty.get(ms);
      if (m) for (const [county, v] of m) running.set(county, (running.get(county) ?? 0) + v);
      out.push(new Map(running));
    }
    return out;
  });

  /** Values at the current index, per selected mode/cumulative flag. */
  const currentVals = $derived.by(() => {
    if (!months.length) return new Map<string, number>();
    return cumulative
      ? (cumulativeByCounty[idx] ?? new Map<string, number>())
      : (monthlyByCounty.get(months[idx]) ?? new Map<string, number>());
  });

  const maxVal = $derived(
    Math.max(...[...currentVals.values()], 1),
  );

  /** Rank map: county -> rank (0-based). Counties outside top set get high ranks. */
  const ranked = $derived.by(() => {
    const entries = [...currentVals.entries()].sort((a, b) => b[1] - a[1]);
    const rankOf = new Map<string, number>();
    entries.forEach(([county], i) => rankOf.set(county, i));
    return rankOf;
  });

  /** All counties get a row so bars glide in/out of the top set. */
  const raceRows = $derived.by(() => {
    const list = [...currentVals.entries()]
      .filter(([county]) => county !== "Total")
      .map(([county, value]) => ({
        county,
        value,
        rank: ranked.get(county) ?? TOP_N + 1,
      }))
      .sort((a, b) => a.rank - b.rank);
    return list;
  });

  const raceHeight = $derived(
    Math.min(raceRows.length, TOP_N + 2) * ROW_H + 8,
  );

  function hue(county: string): number {
    let h = 0;
    for (const ch of county) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return Math.round(((h * 137.508) % 360) / 3) * 3;
  }

  // ---- playback -----------------------------------------------------------

  function tick() {
    if (idx >= months.length - 1) {
      stop();
      return;
    }
    idx += 1;
  }

  function start() {
    stop();
    if (idx >= months.length - 1) idx = 0;
    playing = true;
    timer = setInterval(tick, 550);
  }

  function stop() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = null;
  }

  function toggle() {
    playing ? stop() : start();
  }

  // ---- annual aggregates for charts ---------------------------------------

  /** Full calendar years only (drop the in-progress year). */
  const completeYears = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const r of stateRows) counts.set(r.year, (counts.get(r.year) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([year, n]) => n === 12 || year < new Date().getFullYear())
      .map(([year]) => year)
      .sort((a, b) => a - b);
  });

  const annualSeries = $derived.by((): TrendSeries[] => {
    const byYear = new Map<number, { med: number; rec: number }>();
    for (const r of stateRows) {
      let y = byYear.get(r.year);
      if (!y) byYear.set(r.year, (y = { med: 0, rec: 0 }));
      y.med += r.medical;
      y.rec += r.retail;
    }
    const years = completeYears.filter((y) => byYear.has(y));
    return [
      {
        name: "Retail",
        color: COLOR_RETAIL,
        points: years.map((y) => ({ x: y, y: byYear.get(y)!.rec })),
      },
      {
        name: "Medical",
        color: COLOR_MEDICAL,
        points: years.map((y) => ({ x: y, y: byYear.get(y)!.med })),
      },
    ];
  });

  const shareSeries = $derived.by((): TrendSeries[] => {
    const byYear = new Map<number, { med: number; rec: number }>();
    for (const r of stateRows) {
      let y = byYear.get(r.year);
      if (!y) byYear.set(r.year, (y = { med: 0, rec: 0 }));
      y.med += r.medical;
      y.rec += r.retail;
    }
    const years = completeYears.filter((y) => byYear.has(y));
    return [
      {
        name: "Medical share",
        color: COLOR_MEDICAL,
        points: years.map((y) => {
          const v = byYear.get(y)!;
          const total = v.med + v.rec;
          return { x: y, y: total > 0 ? (v.med / total) * 100 : 0 };
        }),
      },
    ];
  });

  // ---- headline stats ------------------------------------------------------

  const grandTotal = $derived(
    stateRows.reduce((n, r) => n + r.medical + r.retail, 0),
  );

  const peakMonth = $derived.by(() => {
    let best: { ms: number; county: string; value: number } | null = null;
    for (const r of countyRows) {
      const v = r.retail;
      if (!best || v > best.value)
        best = { ms: r.dateMs, county: r.county, value: v };
    }
    return best;
  });

  const firstVsNow = $derived.by(() => {
    const years = completeYears;
    if (years.length < 2) return null;
    const sumYear = (y: number) =>
      stateRows
        .filter((r) => r.year === y)
        .reduce((n, r) => n + r.medical + r.retail, 0);
    const first = sumYear(years[0]);
    const last = sumYear(years[years.length - 1]);
    return { firstYear: years[0], lastYear: years[years.length - 1], first, last };
  });

  function setIdx(v: number) {
    stop();
    idx = v;
  }

  const MODES: [Mode, string][] = [
    ["retail", "Retail"],
    ["medical", "Medical"],
    ["combined", "Combined"],
  ];
  const VALUE_MODES: [boolean, string][] = [
    [true, "Cumulative"],
    [false, "Per month"],
  ];
</script>

<svelte:head>
  <title>Cannabis Economy | Colorado Data</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">
      Colorado's Cannabis Economy
    </h1>
    <p class="text-muted-foreground max-w-3xl">
      Colorado was the first state in the U.S. to legalize retail marijuana in
      2014. This is every dollar of sales reported to the Department of Revenue
      since December 2014 — by month, by county.
    </p>
  </div>

  {#if error}
    <Card.Root class="border-destructive">
      <Card.Content>
        <p class="text-destructive text-sm">{error}</p>
      </Card.Content>
    </Card.Root>
  {:else if loading}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {#each [0, 1, 2, 3] as i (i)}
        <Skeleton class="h-24 w-full rounded-lg" />
      {/each}
    </div>
    <Skeleton class="h-[520px] w-full rounded-lg" />
    <div class="grid gap-4 md:grid-cols-2">
      <Skeleton class="h-80 w-full rounded-lg" />
      <Skeleton class="h-80 w-full rounded-lg" />
    </div>
  {:else}
    <!-- Headline stats -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Total sales since 2014</p>
          <p class="text-2xl font-bold tabular-nums">{fmtMoney(grandTotal)}</p>
        </Card.Content>
      </Card.Root>
      {#if firstVsNow}
        <Card.Root>
          <Card.Content class="py-3">
            <p class="text-muted-foreground text-xs">
              {firstVsNow.firstYear} → {firstVsNow.lastYear} annual sales
            </p>
            <p class="text-2xl font-bold tabular-nums">
              {fmtMoney(firstVsNow.first)}
              <span class="text-muted-foreground text-base font-normal">→</span>
              {fmtMoney(firstVsNow.last)}
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
      {#if peakMonth}
        <Card.Root>
          <Card.Content class="py-3">
            <p class="text-muted-foreground text-xs">Biggest retail month ever</p>
            <p class="text-2xl font-bold tabular-nums">
              {fmtMoney(peakMonth.value)}
            </p>
            <p class="text-muted-foreground text-xs">
              {peakMonth.county} · {fmtMonth(peakMonth.ms)}
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Data range</p>
          <p class="text-lg font-bold tabular-nums">
            {months.length ? fmtMonth(months[0]) : "—"} –
            {months.length ? fmtMonth(months[months.length - 1]) : ""}
          </p>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Animated county race -->
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-base">County leaderboard race</Card.Title>
        <Card.Description class="text-xs">
          {cumulative
            ? "Cumulative sales since Dec 2014"
            : "Sales in the selected month"}
          · {mode === "retail"
            ? "retail weed"
            : mode === "medical"
              ? "medical marijuana"
              : "retail + medical"}
        </Card.Description>
      </Card.Header>
      <Card.Content class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={playing ? "outline" : "default"}
            onclick={toggle}>
            {#if playing}
              <IconPlayerPause /> Pause
            {:else}
              <IconPlayerPlay /> Play
            {/if}
          </Button>
          <div class="flex items-center gap-1">
            {#each MODES as [m, label] (m)}
              <Button
                size="sm"
                variant={mode === m ? "secondary" : "ghost"}
                class="text-muted-foreground hover:text-foreground"
                onclick={() => (mode = m)}>
                {label}
              </Button>
            {/each}
          </div>
          <div class="flex items-center gap-1">
            {#each VALUE_MODES as [c, label] (String(c))}
              <Button
                size="sm"
                variant={cumulative === c ? "secondary" : "ghost"}
                class="text-muted-foreground hover:text-foreground"
                onclick={() => (cumulative = c)}>
                {label}
              </Button>
            {/each}
          </div>
        </div>

        <div
          class="bg-muted/30 relative overflow-hidden rounded-lg"
          style={`height:${Math.min(raceHeight, (TOP_N + 2) * ROW_H + 8)}px`}>
          {#each raceRows as row (row.county)}
            {@const y = row.rank * ROW_H}
            {@const visible = row.rank < TOP_N && row.value > 0}
            <div
              class="absolute right-2 left-2 flex items-center transition-all duration-700 ease-out"
              style={`transform:translateY(${y}px);opacity:${visible ? 1 : 0};`}>
              <span
                class="text-muted-foreground w-6 shrink-0 text-right font-mono text-xs">
                {row.rank + 1}
              </span>
              <span
                class="w-28 shrink-0 truncate pl-2 text-sm font-medium">
                {row.county}
              </span>
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <div
                  class="h-6 rounded-r-md transition-all duration-700 ease-out"
                  style={`width:${Math.max((row.value / maxVal) * 100, row.value > 0 && visible ? 1.5 : 0)}%;background:hsl(${hue(row.county)} 70% 55% / ${visible ? 1 : 0.3});`}></div>
                <span
                  class="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                  {fmtMoney(row.value)}
                </span>
              </div>
            </div>
          {/each}
        </div>

        <div class="flex items-center gap-3">
          <span
            class="bg-foreground text-background rounded-md px-2.5 py-1 font-mono text-sm font-bold tabular-nums">
            {months.length ? fmtMonth(months[idx]) : "—"}
          </span>
          <input
            type="range"
            class="flex-1 accent-emerald-500"
            min={0}
            max={Math.max(months.length - 1, 0)}
            value={idx}
            oninput={(e) => setIdx(Number(e.currentTarget.value))} />
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Annual charts -->
    <div class="grid gap-4 lg:grid-cols-2">
      <Card.Root>
        <Card.Header class="pb-1">
          <Card.Title class="text-base">Annual sales by market</Card.Title>
          <Card.Description class="text-xs">
            Statewide, full calendar years only
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <TrendChart series={annualSeries} height={280} fmtY={fmtMoney} />
          <div class="mt-2 flex gap-4 text-xs">
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-2.5 rounded-full" style={`background:${COLOR_RETAIL}`}></span>
              Retail
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-2.5 rounded-full" style={`background:${COLOR_MEDICAL}`}></span>
              Medical
            </span>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-1">
          <Card.Title class="text-base">
            The long collapse of medical marijuana
          </Card.Title>
          <Card.Description class="text-xs">
            Medical weed's share of total Colorado sales — {Math.round(shareSeries[0]?.points[0]?.y ?? 0)}%
            in {completeYears[0]} down to
            {Math.round(shareSeries[0]?.points[shareSeries[0].points.length - 1]?.y ?? 0)}%
            in {completeYears[completeYears.length - 1]}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <TrendChart
            series={shareSeries}
            height={280}
            fmtY={(n) => `${Math.round(n)}%`} />
          <p class="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <IconTrendingUp class="size-3.5" />
            Once retail licenses opened in 2014, medical sales never recovered
            their share.
          </p>
        </Card.Content>
      </Card.Root>
    </div>

    <p class={cn("text-muted-foreground text-xs")}>
      Source: "Marijuana Sales by County in Colorado" (j7a3-jgd3), Colorado
      Department of Revenue via data.colorado.gov. Sales are gross dollar
      amounts; counties with zero reported sales in a month are omitted from
      that month upstream.
    </p>
  {/if}
</div>
