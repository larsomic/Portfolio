<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { IconTrophy, IconAlertTriangle, IconMapPin } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { ROUNDS, type NcaaGame, type Round } from "$lib/ncaa.js";
  import { cn } from "$lib/utils.js";
  import type { PageData } from "./$types.js";

  let { data }: { data: PageData } = $props();

  const season = $derived(data.season);
  const games = $derived(data.games);

  const championGame = $derived(
    games.find((g) => g.round === "Championship") ?? null,
  );

  /** Games grouped by bracket round, in chronological order. */
  const byRound = $derived.by(() => {
    const map = new Map<Round, NcaaGame[]>();
    for (const g of games) {
      const list = map.get(g.round) ?? [];
      list.push(g);
      map.set(g.round, list);
    }
    return ROUNDS.filter((r) => map.has(r)).map(
      (round) => [round, map.get(round)!] as const,
    );
  });

  const seasonOptions = $derived.by(() => {
    const newest = new Date().getUTCMonth() >= 3
      ? new Date().getUTCFullYear()
      : new Date().getUTCFullYear() - 1;
    const out: number[] = [];
    for (let s = newest; s >= 1939; s -= 1) out.push(s);
    if (!out.includes(season)) out.unshift(season);
    return out;
  });

  function selectSeason(ev: Event) {
    const value = (ev.currentTarget as HTMLSelectElement).value;
    goto(`${page.url.pathname}?season=${value}`);
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
</script>

<SEO title="Tournament Results · March Madness · Michael Larson" description="Replay any NCAA tournament bracket back to 1939 — seeds, scores, venues, attendance, and Elo swings on every game." />

<section class="flex flex-col gap-6">
  <div class="flex flex-wrap items-end justify-between gap-2">
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <IconTrophy class="text-primary size-6" />
        Road to the Championship
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Every NCAA tournament game, round by round — seeds, scores, venues,
        and Elo swings. Pulled from College Basketball Data.
      </p>
    </div>

    <label class="flex items-center gap-2 text-sm font-medium">
      Season
      <select
        class="bg-background border-input text-foreground focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm outline-none"
        value={season}
        onchange={selectSeason}
      >
        {#each seasonOptions as s (s)}
          <option value={s}>{s}</option>
        {/each}
      </select>
    </label>
  </div>

  {#if championGame}
    <Card.Root class="border-amber-500/40 bg-linear-to-br from-background via-background to-amber-500/10">
      <Card.Content class="flex flex-col items-center gap-2 py-6 text-center">
        <Badge variant="secondary" class="gap-1.5 rounded-full">
          <IconTrophy class="size-3.5 fill-amber-500 text-amber-500" />
          {season} National Champions
        </Badge>
        <p class="font-serif text-3xl font-bold">{championGame.winner}</p>
        <p class="text-muted-foreground text-sm">
          beat {championGame.loser}
          {Math.max(championGame.scoreA, championGame.scoreB)}–{Math.min(championGame.scoreA, championGame.scoreB)}
          · {fmtDate(championGame.date)}, {championGame.venue}
          <span class="hidden sm:inline">· {championGame.city}</span>
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <p class="text-muted-foreground text-sm">
      The {season} championship game hasn't been played (or found) yet —
      here's everything through the rounds that are complete.
    </p>
  {/if}

  {#each byRound as [round, roundGames] (round)}
    <Card.Root>
      <Card.Header class="pb-2">
        <div class="flex items-center justify-between">
          <Card.Title class="text-base">{round}</Card.Title>
          <span class="text-muted-foreground text-xs">
            {roundGames.length} game{roundGames.length === 1 ? "" : "s"}
          </span>
        </div>
      </Card.Header>
      <Card.Content class="flex flex-col gap-1.5">
        {#each roundGames as game (game.id)}
          <div
            class={cn(
              "flex flex-col gap-1 rounded-md px-2 py-1.5 sm:flex-row sm:items-center sm:gap-3",
              game.upset ? "bg-destructive/5 border-destructive/20 border" : "bg-muted/40",
            )}
          >
            <span class="text-muted-foreground w-14 shrink-0 font-mono text-xs">
              {fmtDate(game.date)}
            </span>
            <div class="flex flex-1 flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
              <!-- Winner first -->
              <span class="font-semibold">
                {#if game.winnerSeed != null}
                  <span class="text-muted-foreground font-mono text-xs">{game.winnerSeed}</span>
                {/if}
                {game.winner}
              </span>
              <span class="font-mono tabular-nums">
                {Math.max(game.scoreA, game.scoreB)}
                <span class="text-muted-foreground">–</span>
                {Math.min(game.scoreA, game.scoreB)}
              </span>
              <span class="text-muted-foreground">
                {#if game.loserSeed != null}
                  <span class="font-mono text-xs">{game.loserSeed}</span>
                {/if}
                {game.loser}
              </span>
              {#if game.upset}
                <Badge variant="destructive" class="gap-1 text-[10px]">
                  <IconAlertTriangle class="size-3" />
                  Upset{game.winnerSeed != null && game.winnerSeed >= 10 ? ` · ${game.winnerSeed}-seed` : ""}
                </Badge>
              {/if}
            </div>
            <div class="flex items-center gap-3 text-xs text-muted-foreground">
              {#if game.eloWinner != null}
                <span class={cn("font-mono", game.eloWinner > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  Elo {game.eloWinner > 0 ? "+" : ""}{Math.round(game.eloWinner)}
                </span>
              {/if}
              {#if game.venue}
                <span class="hidden items-center gap-1 lg:flex">
                  <IconMapPin class="size-3" />
                  {game.city}
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </Card.Content>
    </Card.Root>
  {/each}
</section>
