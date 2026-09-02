<script lang="ts">
  import { SvelteDate } from "svelte/reactivity";
  import { IconChevronLeft, IconChevronRight } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import AccidentMap from "$lib/components/traffic/accident-map.svelte";
  import { cn } from "$lib/utils.js";
  import {
    fetchAccidentsForDay,
    fetchLatestAccidentDate,
    fmtTime,
    summarize,
    todayStr,
    type Accident,
  } from "$lib/denver-traffic.js";

  // Start on the most recent day that actually has data; reporting lags,
  // so "today" (and often yesterday) is empty.
  let date = $state<string | null>(null);
  let accidents = $state<Accident[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let selectedId = $state<string | null>(null);

  const summary = $derived(summarize(accidents));

  function shiftDay(days: number) {
    if (!date) return;
    const d = new SvelteDate(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // Bootstrap: find the latest day with data once, before any day fetch.
  $effect(() => {
    if (date !== null) return;
    const ctrl = new AbortController();
    fetchLatestAccidentDate(ctrl.signal)
      .then((d) => (date = d ?? todayStr(-1)))
      .catch(() => (date = todayStr(-1)));
    return () => ctrl.abort();
  });

  $effect(() => {
    if (date === null) return;
    let aborted = false;
    (async () => {
      loading = true;
      error = null;
      selectedId = null;
      try {
        const rows = await fetchAccidentsForDay(date);
        if (!aborted) accidents = rows;
      } catch (e) {
        if (!aborted)
          error = e instanceof Error ? e.message : "Failed to load data";
      } finally {
        if (!aborted) loading = false;
      }
    })();
    return () => {
      aborted = true;
    };
  });

  function select(id: string) {
    selectedId = id;
  }
</script>

<svelte:head>
  <title>Denver Accidents | Traffic Map</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Denver Traffic Accidents</h1>
    <p class="text-muted-foreground">
      Every reported traffic accident in Denver for a chosen day, plotted on a
      map. Red markers are accidents with fatalities. Data: Denver Police
      Department via data.colorado.gov.
    </p>
  </div>

  <Card.Root>
    <Card.Content class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous day"
          onclick={() => shiftDay(-1)}>
          <IconChevronLeft />
        </Button>
        <input
          type="date"
          class="border-input bg-background focus-visible:ring-ring/50 h-10 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
          value={date ?? ""}
          max={todayStr()}
          onchange={(e) => {
            date = (e.currentTarget as HTMLInputElement).value;
          }} />
        <Button
          variant="outline"
          size="icon"
          aria-label="Next day"
          disabled={!date || date >= todayStr()}
          onclick={() => shiftDay(1)}>
          <IconChevronRight />
        </Button>
      </div>
      {#if loading}
        <span class="text-muted-foreground animate-pulse text-sm">Loading…</span>
      {:else if !error}
        <span class="text-muted-foreground text-sm">
          {accidents.length} accident{accidents.length === 1 ? "" : "s"} reported
        </span>
      {/if}
    </Card.Content>
  </Card.Root>

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
    <Skeleton class="h-[480px] w-full rounded-lg" />
  {:else}
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Accidents</p>
          <p class="text-2xl font-bold tabular-nums">{accidents.length}</p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Fatalities</p>
          <p class={cn('text-2xl font-bold tabular-nums', summary.fatalities > 0 && 'text-red-600')}>
            {summary.fatalities}
          </p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground text-xs">Pedestrians injured</p>
          <p class={cn('text-2xl font-bold tabular-nums', summary.pedInjured > 0 && 'text-amber-600')}>
            {summary.pedInjured}
          </p>
        </Card.Content>
      </Card.Root>
      <Card.Root>
        <Card.Content class="py-3">
          <p class="text-muted-foreground mb-1 text-xs">Busiest neighborhoods</p>
          <div class="flex flex-wrap gap-1">
            {#each summary.topHoods as [hood, count] (hood)}
              <Badge variant="secondary" class="font-normal">
                {hood} · {count}
              </Badge>
            {:else}
              <span class="text-muted-foreground text-sm">—</span>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <AccidentMap {accidents} bind:selectedId />

      <Card.Root class="flex max-h-[530px] flex-col">
        <Card.Header class="pb-2">
          <Card.Title class="text-base">That day's accidents</Card.Title>
          <Card.Description class="text-xs">
            Click one to fly the map to it. Red = fatal.
          </Card.Description>
        </Card.Header>
        <div class="flex-1 overflow-y-auto">
          <ul class="flex flex-col gap-1 p-4 pt-0">
            {#each accidents as a (a.id)}
              <li>
                <button
                  type="button"
                  class={cn(
                    'hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    selectedId === a.id && 'bg-muted',
                  )}
                  onclick={() => select(a.id)}>
                  <span class="flex items-center justify-between gap-2">
                    <span class="truncate">
                      {a.intersection ?? "Unknown location"}
                    </span>
                    <span class="text-muted-foreground shrink-0 font-mono text-xs">
                      {fmtTime(a.timeMs)}
                    </span>
                  </span>
                  <span class="text-muted-foreground block truncate text-xs">
                    {a.neighborhood ?? "—"}
                    {#if a.collisionType}· {a.collisionType}{/if}
                    {#if a.fatalities > 0}
                      · <span class="font-semibold text-red-600">{a.fatalities} fatal</span>
                    {/if}
                  </span>
                </button>
              </li>
            {:else}
              <li class="text-muted-foreground py-4 text-center text-sm">
                No accidents reported on this day — records usually lag a day
                or two, so try going back further.
              </li>
            {/each}
          </ul>
        </div>
      </Card.Root>
    </div>
  {/if}
</div>
