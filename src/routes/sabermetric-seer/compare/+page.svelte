<script lang="ts">
  import {
    IconCheck as Check,
    IconChartBar,
    IconChartLine,
    IconChevronDown as ChevronDown,
  } from "@tabler/icons-svelte";
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { page } from "$app/state";
  import { BarChart, LineChart } from "layerchart";
  import { scaleBand } from "d3-scale";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import PlayerPicker from "$lib/components/player-picker.svelte";
  import {
    aggregateStats,
    fetchJson,
    fetchPerson,
    formatInnings,
    type PersonProfile,
    seasonRows,
    seasonSpan,
    seasonTotals,
    type SeasonRow,
    type StatView,
    yearByYearUrl,
    type YearByYearResponse,
  } from "$lib/mlb-stats.js";
  import { metricsFor, type Metric } from "./metrics.js";

  type Slot = "a" | "b";
  type AxisMode = "season" | "careerYear";

  interface PlayerData {
    id: number;
    fullName: string;
    profile: PersonProfile | null;
    hitting: SeasonRow[];
    pitching: SeasonRow[];
    error: string | null;
  }

  interface Selection {
    id: number;
    fullName: string;
  }

  const SLOTS: Slot[] = ["a", "b"];
  // Deliberately not the theme's chart ramp — all five of those colors are the
  // same blue, which makes two series impossible to tell apart.
  const COLORS = ["var(--compare-a)", "var(--compare-b)"];
  const MAX_TICKS = 12; // axis labels before we start dropping every other one
  const YEAR_CAPS = [5, 10, 15];

  /* ------------------------------------------------------------------ state */
  let slots = $state<Record<Slot, PlayerData | null>>({ a: null, b: null });
  let view = $state<StatView>("hitting");
  let metricKey = $state("");
  let perGames = $state(false);
  let chartMode = $state<"bars" | "lines">("bars");
  let loading = $state(false);

  const controllers: Record<Slot, AbortController | null> = { a: null, b: null };
  // Set once the user chooses the chart type or x-axis by hand
  let chartModeTouched = $state(false);
  let axisTouched = $state(false);
  let axisMode = $state<AxisMode>("season");
  // How many career years to plot in career-year mode (`null` = all of them)
  let careerYears = $state<number | null>(null);

  // Seed from the URL once so a shared link restores the comparison as it was.
  // Read the incoming query once; these are plain values on purpose so the
  // restore effect below has no reactive dependencies and runs exactly once.
  const initialParams = new SvelteURLSearchParams(page.url.search);
  const seed = {
    a: initialParams.get("a"),
    b: initialParams.get("b"),
    view: initialParams.get("view"),
    metric: initialParams.get("metric"),
    perGames: initialParams.get("perGames") === "1",
    chart: initialParams.get("chart"),
    axis: initialParams.get("axis"),
    years: initialParams.get("years"),
  };

  /* -------------------------------------------------------------- selectors */
  const metrics = $derived(metricsFor(view));
  const metric = $derived(
    metrics.find((m) => m.key === metricKey) ?? metrics[0],
  );

  // Counting stats read best as bars and rate stats as lines, so the chart
  // follows the metric's kind until the user picks a mode by hand.
  const chartModeActive = $derived(
    chartModeTouched ? chartMode : metric?.kind === "rate" ? "lines" : "bars",
  );
  const selectionA = $derived(
    slots.a ? { id: slots.a.id, fullName: slots.a.fullName } : null,
  );
  const selectionB = $derived(
    slots.b ? { id: slots.b.id, fullName: slots.b.fullName } : null,
  );
  const hasHitting = $derived(rowCount("hitting") > 0);
  const hasPitching = $derived(rowCount("pitching") > 0);
  const canSwitch = $derived(hasHitting && hasPitching);

  /* ------------------------------------------------------------ data access */
  function rowsFor(slot: Slot, group: StatView): SeasonRow[] {
    const player = slots[slot];
    if (!player) return [];
    return group === "pitching" ? player.pitching : player.hitting;
  }

  function rowCount(group: StatView): number {
    return rowsFor("a", group).length + rowsFor("b", group).length;
  }

  /** One entry per season, oldest first, counting stats summed across teams. */
  const seasonsA = $derived(seasonTotals(rowsFor("a", view)));
  const seasonsB = $derived(seasonTotals(rowsFor("b", view)));

  /** Counting stats summed across every season the player has in this group. */
  function careerStats(
    slot: Slot,
    group: StatView,
  ): Record<string, number> {
    return aggregateStats(rowsFor(slot, group));
  }

  function statsIn(
    totals: { season: string; stats: Record<string, number> }[],
    season: string,
  ): Record<string, number> | undefined {
    for (const total of totals) {
      if (total.season === season) return total.stats;
    }
    return undefined;
  }

  function metricValue(
    m: Metric,
    stats: Record<string, number> | undefined | null,
  ): number | null {
    if (!stats) return null;
    const raw = m.value(stats);
    if (raw === null) return null;
    if (perGames && m.perGames && m.kind === "count") {
      const games = stats.gamesPlayed ?? stats.gamesPitched ?? 0;
      if (games <= 0) return null;
      return (raw / games) * 162;
    }
    return raw;
  }

  function display(m: Metric, value: number | null): string {
    if (value === null || !Number.isFinite(value)) return "—";
    if (m.format === "innings") return formatInnings(Math.round(value * 3));
    if (m.decimals !== undefined) return value.toFixed(m.decimals);
    return String(Math.round(value * 100) / 100);
  }

  function signed(text: string): string {
    return text.startsWith("—") ? text : `+${text}`;
  }

  /* ------------------------------------------------------------------ chart */
  const seasons = $derived.by(() => {
    const list = [
      ...seasonsA.map((t) => t.season),
      ...seasonsB.map((t) => t.season),
    ];
    return [...new Set(list)]
      .map(Number)
      .filter(Number.isFinite)
      .sort((x, y) => x - y)
      .map(String);
  });

  // Babe Ruth and Mike Trout share no seasons, so a calendar axis gives them
  // nothing in common. Without any overlap, compare year 1 to year 1 instead.
  const careersOverlap = $derived(
    seasonsA.some((a) => statsIn(seasonsB, a.season) !== undefined),
  );
  const axisActive = $derived(
    axisTouched ? axisMode : careersOverlap ? "season" : "careerYear",
  );

  const chartRows = $derived.by(() => {
    // Missing values must be `undefined`, never `null`: the chart tooltip
    // calls `value.toLocaleString()` on anything it considers defined.
    if (axisActive === "careerYear") {
      const longest = Math.min(
        careerYears ?? Number.MAX_SAFE_INTEGER,
        Math.max(seasonsA.length, seasonsB.length),
      );
      return Array.from({ length: longest }, (_, i) => ({
        season: `Year ${i + 1}`,
        a: metricValue(metric, seasonsA[i]?.stats) ?? undefined,
        b: metricValue(metric, seasonsB[i]?.stats) ?? undefined,
      }));
    }
    return seasons.map((season) => ({
      season,
      a:
        metricValue(metric, statsIn(seasonsA, season)) ?? undefined,
      b:
        metricValue(metric, statsIn(seasonsB, season)) ?? undefined,
    }));
  });

  const chartSeries = $derived(
    [
      { key: "a", label: slots.a?.fullName ?? "Player A", index: 0 },
      { key: "b", label: slots.b?.fullName ?? "Player B", index: 1 },
    ]
      .filter((s) => (s.key === "a" ? Boolean(slots.a) : Boolean(slots.b)))
      .map((s) => ({ key: s.key, label: s.label, color: COLORS[s.index] })),
  );

  const chartConfig = $derived(
    Object.fromEntries(
      chartSeries.map((series) => [
        series.key,
        { label: series.label, color: series.color },
      ]),
    ),
  );

  // Thin out labels when the axis is long so they don't collide
  const xTicks = $derived.by(() => {
    const labels = chartRows.map((row) => row.season);
    if (labels.length <= MAX_TICKS) return labels;
    const step = Math.ceil(labels.length / MAX_TICKS);
    const last = labels[labels.length - 1] as string;
    const picked = labels.filter((_, i) => i % step === 0);
    return picked[picked.length - 1] === last ? picked : [...picked, last];
  });

  /* ------------------------------------------------------------------- load */
  async function loadSlot(slot: Slot, picked: Selection | null) {
    controllers[slot]?.abort();
    if (!picked) {
      slots[slot] = null;
      return;
    }
    controllers[slot] = new AbortController();
    const controller = controllers[slot];
    slots[slot] = {
      id: picked.id,
      fullName: picked.fullName,
      profile: null,
      hitting: [],
      pitching: [],
      error: null,
    };
    loading = true;
    const [profile, hitting, pitching] = await Promise.all([
      fetchPerson(picked.id, controller.signal),
      fetchJson<YearByYearResponse>(
        yearByYearUrl(picked.id, "hitting"),
        controller.signal,
      ).catch(() => null),
      fetchJson<YearByYearResponse>(
        yearByYearUrl(picked.id, "pitching"),
        controller.signal,
      ).catch(() => null),
    ]);
    if (controller.signal.aborted) return;
    slots[slot] = {
      id: picked.id,
      fullName: picked.fullName,
      profile,
      hitting: seasonRows(hitting, "hitting"),
      pitching: seasonRows(pitching, "pitching"),
      error: hitting === null && pitching === null ? "Stats request failed." : null,
    };
    loading = false;
    applyDefaultView();
  }

  /** Pick a stat group that actually has data when the current one is empty. */
  function applyDefaultView() {
    if (hasHitting && !hasPitching) view = "hitting";
    else if (!hasHitting && hasPitching) view = "pitching";
  }

  function selectPlayer(slot: Slot, picked: Selection | null) {
    metricKey = "";
    loadSlot(slot, picked);
    void syncUrl();
  }

  function changeView(next: string) {
    if (next !== "hitting" && next !== "pitching") return;
    view = next;
    metricKey = "";
    void syncUrl();
  }

  function chooseMetric(key: string) {
    metricKey = key;
    void syncUrl();
  }

  function togglePerGames() {
    perGames = !perGames;
    void syncUrl();
  }

  function setChartMode(mode: "bars" | "lines") {
    chartModeTouched = true;
    chartMode = mode;
    void syncUrl();
  }

  function setAxisMode(mode: AxisMode) {
    axisTouched = true;
    axisMode = mode;
    void syncUrl();
  }

  function setCareerYears(years: number | null) {
    careerYears = years;
    void syncUrl();
  }

  async function syncUrl() {
    if (!browser) return;
    const params = new SvelteURLSearchParams();
    for (const slot of ["a", "b"] as Slot[]) {
      const player = slots[slot];
      if (player) params.set(slot, String(player.id));
    }
    params.set("view", view);
    if (metric) params.set("metric", metric.key);
    if (perGames) params.set("perGames", "1");
    params.set("chart", chartModeActive);
    params.set("axis", axisActive);
    if (careerYears) params.set("years", String(careerYears));
    await goto(`${page.url.pathname}?${params.toString()}`, {
      replaceState: true,
      noScroll: true,
      invalidateAll: false,
    });
  }

  // Restore a shared link: ?a=<id>&b=<id>
  $effect(() => {
    if (!browser) return;
    perGames = seed.perGames;
    if (seed.chart === "lines" || seed.chart === "bars") {
      chartMode = seed.chart;
      chartModeTouched = true;
    }
    if (seed.axis === "careerYear" || seed.axis === "season") {
      axisMode = seed.axis;
      axisTouched = true;
    }
    const seededYears = Number(seed.years);
    if (
      Number.isFinite(seededYears) &&
      YEAR_CAPS.some((cap) => cap === seededYears)
    ) {
      careerYears = seededYears;
    }
    metricKey = seed.metric ?? "";
    if (seed.view === "pitching" || seed.view === "hitting") {
      view = seed.view;
    }
    for (const slot of ["a", "b"] as Slot[]) {
      const raw = slot === "a" ? seed.a : seed.b;
      if (!raw) continue;
      const id = Number(raw);
      if (!Number.isFinite(id)) continue;
      void loadFromId(slot, id);
    }
  });

  async function loadFromId(slot: Slot, id: number) {
    const profile = await fetchPerson(id);
    if (!profile?.id) return;
    await loadSlot(slot, { id: profile.id, fullName: profile.fullName });
  }

  /* ------------------------------------------------------------- career rows */
  const careerRows = $derived(metrics.map((m) => {
    const a = metricValue(m, careerStats("a", view));
    const b = metricValue(m, careerStats("b", view));
    const better =
      a === null || b === null
        ? null
        : a === b
          ? "tie"
          : m.better === "high"
            ? (a > b ? "a" : "b")
            : (a < b ? "a" : "b");
    const delta = a === null || b === null ? null : a - b;
    return { metric: m, a, b, better, delta };
  }));

  function spanText(slot: Slot): string {
    return seasonSpan(rowsFor(slot, view));
  }

  function teamText(slot: Slot): string {
    return slots[slot]?.profile?.currentTeam?.name ?? "";
  }

  function batText(slot: Slot): string {
    return slots[slot]?.profile?.batSide?.description ?? "—";
  }

  function throwText(slot: Slot): string {
    return slots[slot]?.profile?.pitchHand?.description ?? "—";
  }
</script>

<div class="container flex flex-col gap-6 py-8">
  <header class="flex flex-col gap-2">
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
      Compare Players
    </h1>
    <p class="text-muted-foreground max-w-2xl text-sm">
      Pick two players and put their seasons on the same axis. Everything is
      computed from MLB's yearly stat splits, so rate stats come from the
      underlying counts instead of averaged averages.
    </p>
  </header>

  <Card.Root>
    <Card.Content class="flex flex-col gap-6 p-6 sm:p-8 md:flex-row">
      <div class="flex min-w-0 flex-1 flex-col">
        <PlayerPicker
          label="Player A"
          placeholder="Search any MLB player"
          selected={selectionA}
          onselectedchange={(picked) => selectPlayer("a", picked)}
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <PlayerPicker
          label="Player B"
          placeholder="Search any MLB player"
          align="end"
          selected={selectionB}
          onselectedchange={(picked) => selectPlayer("b", picked)}
        />
      </div>
    </Card.Content>
  </Card.Root>

  {#if loading}
    <div class="grid gap-2">
      {#each [1, 2, 3, 4, 5, 6] as row (row)}
        <Skeleton class="h-10 w-full" />
      {/each}
    </div>
  {:else if !slots.a && !slots.b}
    <p class="text-muted-foreground text-sm">
      Start typing a name above — try "Shohei Ohtani" or "Kyle Schwarber".
      Retired players are included, so "Albert Pujols" works too.
    </p>
  {:else}
    {#if slots.a?.error || slots.b?.error}
      <div
        class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
      >
        One of those stat requests failed. Try searching for the player again.
      </div>
    {/if}

    <!-- Player cards -->
    <div class="grid gap-4 sm:grid-cols-2">
      {#each SLOTS as slot (slot)}
        {#if slots[slot]}
          {@const color = COLORS[slot === "a" ? 0 : 1]}
          <Card.Root>
            <Card.Header>
              <Card.Title class="flex items-center gap-2">
                <span
                  class="size-2.5 shrink-0 rounded-full"
                  style:background={color}
                ></span>
                {slots[slot]?.fullName}
              </Card.Title>
              <Card.Description>
                {teamText(slot) || "Team unavailable"} ·
                {slots[slot]?.profile?.primaryPosition?.abbreviation ?? "—"}
              </Card.Description>
            </Card.Header>
            <Card.Content class="text-muted-foreground text-sm">
              <p class="capitalize">
                Bats: {batText(slot)} · Throws: {throwText(slot)}
              </p>
              <p class="mt-1">
                {view === "pitching" ? "Pitching" : "Hitting"} seasons:
                {spanText(slot)}
              </p>
            </Card.Content>
          </Card.Root>
        {/if}
      {/each}
    </div>

    <!-- Stat group -->
    {#if canSwitch}
      <Tabs.Root value={view} onValueChange={changeView}>
        <Tabs.List>
          <Tabs.Trigger value="hitting">Hitting</Tabs.Trigger>
          <Tabs.Trigger value="pitching">Pitching</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    {/if}

    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-2">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button {...props} variant="outline" class="min-w-52 justify-between font-normal">
              {metric?.label ?? "Metric"}
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content class="max-h-80 w-60 overflow-y-auto" align="start">
          <DropdownMenu.Group>
            <DropdownMenu.Label>{view === "pitching" ? "Pitching" : "Hitting"}</DropdownMenu.Label>
            {#each metrics as m (m.key)}
              <DropdownMenu.Item onSelect={() => chooseMetric(m.key)}>
                <span class="font-mono text-xs">{m.short}</span>
                <span class="ml-2">{m.label}</span>
                {#if metric?.key === m.key}
                  <span class="ml-auto text-xs">✓</span>
                {/if}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Button
        variant={perGames ? "secondary" : "outline"}
        onclick={togglePerGames}
        title="Scale counting stats to a full 162-game season"
      >
        Per 162 games
      </Button>

      {#if axisActive === "careerYear"}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                {...props}
                variant="outline"
                class="w-auto min-w-32 justify-between gap-2 font-normal"
              >
                {careerYears ? `First ${careerYears} years` : "Full career"}
                <ChevronDown />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-auto min-w-40" align="start">
            <DropdownMenu.Group>
              {#each YEAR_CAPS as cap (cap)}
                <DropdownMenu.Item onSelect={() => setCareerYears(cap)}>
                  First {cap} years
                  {#if careerYears === cap}
                    <Check />
                  {/if}
                </DropdownMenu.Item>
              {/each}
              <DropdownMenu.Item onSelect={() => setCareerYears(null)}>
                Full career
                {#if careerYears === null}
                  <Check />
                {/if}
              </DropdownMenu.Item>
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}

      <div class="ml-auto flex items-center gap-1">
        <Button
          variant={axisActive === "season" ? "secondary" : "ghost"}
          onclick={() => setAxisMode("season")}
          size="sm"
          title="Line the seasons up by the year they happened"
        >
          By season
        </Button>
        <Button
          variant={axisActive === "careerYear" ? "secondary" : "ghost"}
          onclick={() => setAxisMode("careerYear")}
          size="sm"
          title="Line the players up by seasons played: year 1 vs year 1"
        >
          By career year
        </Button>
      </div>

      <div class="flex items-center gap-1">
        <Button
          variant={chartModeActive === "bars" ? "secondary" : "ghost"}
          onclick={() => setChartMode("bars")}
          size="sm"
        >
          <IconChartBar />
          Bars
        </Button>
        <Button
          variant={chartModeActive === "lines" ? "secondary" : "ghost"}
          onclick={() => setChartMode("lines")}
          size="sm"
        >
          <IconChartLine />
          Lines
        </Button>
      </div>
    </div>

    <!-- Chart -->
    {#if chartSeries.length === 0 || seasons.length === 0}
      <p class="text-muted-foreground text-sm">
        No {view} seasons to plot for this selection.
      </p>
    {:else}
      <Card.Root>
        <Card.Header>
          <Card.Title>
            {metric?.label}
            {#if perGames && metric?.kind === "count"}
              <span class="text-muted-foreground text-sm font-normal">
                per 162 games
              </span>
            {/if}
          </Card.Title>
          <Card.Description>
            {#if axisActive === "careerYear"}
              Each player counted from their own first season, oldest first
              {#if careerYears} · first {careerYears} seasons only{/if}
            {:else}
              {seasons[0]}–{seasons[seasons.length - 1]} · one bar per season,
              teams combined
            {/if}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="h-80 w-full">
            <Chart.Container config={chartConfig} class="relative h-full w-full">
              {#if chartModeActive === "lines"}
                <LineChart
                  data={chartRows}
                  x="season"
                  axis="x"
                  series={chartSeries}
                  props={{
                    xAxis: { ticks: xTicks },
                    line: { strokeWidth: 2 },
                  }}
                >
                  {#snippet tooltip()}
                    <Chart.Tooltip />
                  {/snippet}
                </LineChart>
              {:else}
                <BarChart
                  data={chartRows}
                  x="season"
                  axis="x"
                  xScale={scaleBand().padding(0.25)}
                  x1Scale={scaleBand().paddingInner(0.2)}
                  seriesLayout="group"
                  series={chartSeries}
                  rule={false}
                  props={{
                    xAxis: { ticks: xTicks },
                    highlight: { area: { fill: "none" } },
                  }}
                >
                  {#snippet tooltip()}
                    <Chart.Tooltip indicator="dashed" />
                  {/snippet}
                </BarChart>
              {/if}
            </Chart.Container>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Career table -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Career {view}</Card.Title>
        <Card.Description>
          Totals over every MLB season in this stat group. Rate stats are
          derived from the summed counting stats{#if perGames}
            ; counting stats are scaled to 162 games{/if}.
        </Card.Description>
      </Card.Header>
      <Card.Content class="overflow-x-auto">
        <Table.Root>
          <thead>
            <tr>
              <th class="text-muted-foreground text-left text-xs uppercase">
                Stat
              </th>
              <th class="text-right">
                {slots.a?.fullName ?? "Player A"}
              </th>
              <th class="text-right">
                {slots.b?.fullName ?? "Player B"}
              </th>
              <th class="text-muted-foreground text-right text-xs uppercase">
                Δ A−B
              </th>
            </tr>
          </thead>
          <tbody>
            {#each careerRows as row (row.metric.key)}
              <tr>
                <td>
                  <span class="font-mono text-xs">{row.metric.short}</span>
                  <span class="text-muted-foreground ml-2 text-sm">
                    {row.metric.label}
                  </span>
                </td>
                <td
                  class="text-right font-mono tabular-nums"
                  class:font-semibold={row.better === "a"}
                >
                  {display(row.metric, row.a)}
                </td>
                <td
                  class="text-right font-mono tabular-nums"
                  class:font-semibold={row.better === "b"}
                >
                  {display(row.metric, row.b)}
                </td>
                <td
                  class="text-muted-foreground text-right font-mono text-xs tabular-nums"
                  class:text-emerald-600={row.better !== null &&
                    row.better !== "tie"}
                >
                  {#if row.delta === null}
                    —
                  {:else}
                    {signed(display(row.metric, Math.abs(row.delta)))}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
