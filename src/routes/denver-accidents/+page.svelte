<script lang="ts">
  import { SvelteDate } from "svelte/reactivity";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { IconChevronLeft, IconChevronRight } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import AccidentMap from "$lib/components/traffic/accident-map.svelte";
  import { cn } from "$lib/utils.js";
  import { fmtTime, summarize, todayStr } from "$lib/denver-traffic.js";
  import type { PageData } from "./$types.js";

  // The day's accidents are fetched server-side in +page.ts; the day picker
  // is a URL param so every day deep-links and back/forward work.
  let { data }: { data: PageData } = $props();
  const date = $derived(data.date);
  const accidents = $derived(data.accidents);

  let selectedId = $state<string | null>(null);

  // Clear the selected accident whenever the day changes.
  $effect(() => {
    void data.date;
    selectedId = null;
  });

  const summary = $derived(summarize(accidents));

  function selectDate(value: string) {
    if (!value || value === date) return;
    void goto(`${page.url.pathname}?date=${value}`, { noScroll: true });
  }

  function shiftDay(days: number) {
    const d = new SvelteDate(`${date}T12:00:00`);
    d.setDate(d.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, "0");
    const next = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (next === date || next > todayStr()) return;
    void goto(`${page.url.pathname}?date=${next}`, { noScroll: true });
  }

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
          onchange={(e) => selectDate((e.currentTarget as HTMLInputElement).value)} />
        <Button
          variant="outline"
          size="icon"
          aria-label="Next day"
          disabled={!date || date >= todayStr()}
          onclick={() => shiftDay(1)}>
          <IconChevronRight />
        </Button>
      </div>
      <span class="text-muted-foreground text-sm">
        {accidents.length} accident{accidents.length === 1 ? "" : "s"} reported
      </span>
    </Card.Content>
  </Card.Root>

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
</div>
