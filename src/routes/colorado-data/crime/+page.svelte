<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import TrendChart, { type TrendSeries } from "$lib/components/pulse/trend-chart.svelte";
  import RankedList from "$lib/components/pulse/ranked-list.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { fmtInt, fmtCompact, YEARS } from "$lib/colorado-crime.js";
  import type { PageData } from "./$types.js";

  const PALETTE = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];
  const OTHER_COLOR = "#94a3b8";

  // Everything is fetched server-side in +page.ts; the agency picker is a
  // URL param so switching agencies re-runs load (and deep-links work).
  let { data }: { data: PageData } = $props();
  const agencies = $derived(data.agencies);
  const agency = $derived(data.agency);
  const totals = $derived(data.totals);
  const yearCats = $derived(data.yearCats);
  const daily = $derived(data.daily);
  const hourly = $derived(data.hourly);

  function selectAgency(value: string) {
    if (value === agency) return;
    void goto(
      `${page.url.pathname}?agency=${encodeURIComponent(value)}`,
      { noScroll: true },
    );
  }

  // ---- derived views -------------------------------------------------------

  const grandTotal = $derived(totals.reduce((n, r) => n + r.n, 0));

  const topCats = $derived(totals.slice(0, PALETTE.length).map((r) => r.cat));

  const trendSeries = $derived.by((): TrendSeries[] => {
    const series: TrendSeries[] = topCats.map((cat, i) => ({
      name: cat.replace(/ Offenses$/, "").replace("/Theft", ""),
      color: PALETTE[i],
      points: YEARS.filter((y) => yearCats.some((r) => r.year === y)).map(
        (year) => ({
          x: year,
          y:
            yearCats
              .filter((r) => r.year === year && r.cat === cat)
              .reduce((n, r) => n + r.n, 0),
        }),
      ),
    }));
    // "All other" bucket per year
    const years = [...new Set(yearCats.map((r) => r.year))].sort();
    series.push({
      name: "All other",
      color: OTHER_COLOR,
      points: years.map((year) => ({
        x: year,
        y: yearCats
          .filter((r) => r.year === year && !topCats.includes(r.cat))
          .reduce((n, r) => n + r.n, 0),
      })),
    });
    return series;
  });

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dowBars = $derived.by(() => {
    const sums = new Array(7).fill(0);
    const counts = new Array(7).fill(0);
    for (const r of daily) {
      const dow = new Date(r.dateMs).getDay();
      sums[dow] += r.n;
      counts[dow] += 1;
    }
    const avgs = sums.map((s, i) => (counts[i] ? s / counts[i] : 0));
    const max = Math.max(...avgs, 1);
    return avgs.map((v, i) => ({
      label: DOW_LABELS[i],
      value: v,
      pct: (v / max) * 100,
    }));
  });

  const monthSeries = $derived.by((): TrendSeries[] => {
    const sums = new Array(12).fill(0);
    const counts = new Array(12).fill(0);
    for (const r of daily) {
      const m = new Date(r.dateMs).getMonth();
      sums[m] += r.n;
      counts[m] += 1;
    }
    return [
      {
        name: "Avg incidents",
        color: "#3b82f6",
        points: sums
          .map((s, i) => ({ x: i + 1, y: counts[i] ? s / counts[i] : 0 }))
          .filter((p) => p.y > 0),
      },
    ];
  });

  const hourSeries = $derived.by((): TrendSeries[] => [
    {
      name: "Incidents",
      color: "#f59e0b",
      points: hourly.map((r) => ({ x: r.hour, y: r.n })),
    },
  ]);

  const peakDay = $derived.by(() => {
    let best: { dateMs: number; n: number } | null = null;
    for (const r of daily) if (!best || r.n > best.n) best = r;
    return best;
  });

  const avgPerDay = $derived(
    daily.length ? grandTotal / daily.length : 0,
  );

  const topShare = $derived(
    totals.length && grandTotal
      ? `${Math.round((totals[0].n / grandTotal) * 100)}%`
      : "—",
  );

  const agencyLabel = $derived(agency || "Statewide (all agencies)");
</script>

<svelte:head>
  <title>Crime in Colorado | Colorado Data</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Crime in Colorado</h1>
      <p class="text-muted-foreground max-w-2xl">
        Every incident reported to state and local law enforcement (NIBRS),
        2016–2024 — by agency, offense category, day, month, and hour.
        Records carry no coordinates, so this explorer leans on aggregates.
      </p>
    </div>
    <label class="flex flex-col gap-1 text-sm">
      <span class="text-muted-foreground text-xs">Reporting agency</span>
      <select
        class="border-input bg-background focus-visible:ring-ring/50 h-10 w-64 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        value={agency}
        onchange={(e) => selectAgency((e.currentTarget as HTMLSelectElement).value)}>
        <option value="">Statewide (all agencies)</option>
        {#each agencies as name (name)}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </label>
  </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Incidents · {agencyLabel}</p>
          <p class="text-2xl font-bold tabular-nums">{fmtInt.format(grandTotal)}</p>
          <p class="text-muted-foreground text-xs">2016–2024</p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Average per reporting day</p>
          <p class="text-2xl font-bold tabular-nums">
            {fmtInt.format(Math.round(avgPerDay))}
          </p>
        </Card.Content>
      </Card.Root>
      {#if totals[0]}
        <Card.Root>
          <Card.Content class="py-3">
            <p class="text-muted-foreground text-xs">Most common category</p>
            <p class="text-lg font-bold">{totals[0].cat}</p>
            <p class="text-muted-foreground text-xs">
              {topShare} of all incidents
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
      {#if peakDay}
        <Card.Root>
          <Card.Content class="py-3">
            <p class="text-muted-foreground text-xs">Busiest single day</p>
            <p class="text-2xl font-bold tabular-nums">{fmtInt.format(peakDay.n)}</p>
            <p class="text-muted-foreground text-xs">
              {new Date(peakDay.dateMs).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">
          Yearly trend · top offense categories, {agencyLabel}
        </Card.Title>
        <Card.Description class="text-xs">
          Incidents reported per calendar year
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <TrendChart series={trendSeries} height={340} fmtY={fmtCompact} />
        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {#each trendSeries as s (s.name)}
            <span class="flex items-center gap-1.5">
              <span class="inline-block size-2.5 rounded-full" style={`background:${s.color}`}></span>
              {s.name}
            </span>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card.Root>
        <Card.Header class="pb-1">
          <Card.Title class="text-base">When crime happens · weekday</Card.Title>
          <Card.Description class="text-xs">
            Average incidents per day of week, {agencyLabel}
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-2">
          {#each dowBars as bar (bar.label)}
            <div class="flex items-center gap-3">
              <span class="text-muted-foreground w-10 font-mono text-xs">{bar.label}</span>
              <div class="bg-muted h-5 flex-1 overflow-hidden rounded-sm">
                <div
                  class="h-full rounded-sm bg-sky-500"
                  style={`width:${Math.max(bar.pct, 2)}%`}></div>
              </div>
              <span class="w-16 text-right font-mono text-xs tabular-nums">
                {Math.round(bar.value)}
              </span>
            </div>
          {/each}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="pb-1">
          <Card.Title class="text-base">Seasonality by month</Card.Title>
          <Card.Description class="text-xs">
            Average incidents per day in each month (summer speaks for itself)
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <TrendChart
            series={monthSeries}
            height={230}
            fmtY={(n) => String(Math.round(n))} />
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card.Root>
        <Card.Header class="pb-1">
          <Card.Title class="text-base">Hour of day</Card.Title>
          <Card.Description class="text-xs">
            All reported incidents by hour, 2016–2024 — the overnight-to-2am
            spike is real
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <TrendChart
            series={hourSeries}
            height={250}
            fmtY={fmtCompact} />
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Content class="pt-4">
          <RankedList
            title="Top offense categories"
            label={`${fmtInt.format(grandTotal)} incidents · ${agencyLabel}`}
            items={totals.map((r) => ({ label: r.cat, value: r.n }))}
            color="#ef4444" />
        </Card.Content>
      </Card.Root>
    </div>

    <p class="text-muted-foreground text-xs">
      Source: "Crimes in Colorado" (j6g4-gayk), Colorado Bureau of
      Investigation via data.colorado.gov. Counts reflect incidents reported by
      participating agencies; coverage varies by year. No locations are
      published, hence no map — that's what the accidents page is for.
    </p>
</div>
