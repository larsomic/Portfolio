<script lang="ts">
  import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
  } from "lucide-svelte";
  import {
    CalendarDate,
    getLocalTimeZone,
    today,
    type CalendarDate as CalendarDateType,
  } from "@internationalized/date";
  import { browser } from "$app/environment";
  import { IconBroadcast, IconFlame } from "@tabler/icons-svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { cn } from "$lib/utils.js";
  import {
    fetchSchedule,
    formatGameTime,
    liveInningLabel,
    isLive,
    statusSort,
    teamLogo,
    type ScheduleGame,
  } from "$lib/mlb-games.js";
  import GameDetail from "./game-detail.svelte";
  import type { PageData } from "./$types.js";

  const id = $props.id();

  const maxDate = today(getLocalTimeZone());

  let open = $state(false);
  let selectedDate = $state<CalendarDateType>(maxDate);

  let { data }: { data: PageData } = $props();

  // Today's board is fetched server-side in +page.ts; the date picker and
  // live polling refetch client-side. Intentionally seeded from `data`.
  // svelte-ignore state_referenced_locally
  let games = $state<ScheduleGame[]>(data.games);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  let expandedPk = $state<number | null>(null);
  // svelte-ignore state_referenced_locally
  let autoRefreshOn = $state(data.games.some(isLive));

  let activeController: AbortController | null = null;
  // svelte-ignore state_referenced_locally
  let lastFetched = $state(data.date);
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  function fetchGames() {
    if (!browser) return;
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    loading = true;
    errorMessage = null;

    const dateParam = selectedDate.toString();
    fetchSchedule(dateParam, controller.signal)
      .then((list) => {
        games = list;
        lastFetched = dateParam;
        autoRefreshOn = list.some(isLive);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        errorMessage = "Failed to load the MLB schedule. Please try again.";
      })
      .finally(() => {
        loading = false;
      });
  }

  // Refetch when the picked date differs from what the server provided.
  $effect(() => {
    void selectedDate;
    if (!browser) return;
    if (selectedDate.toString() === lastFetched) return;
    fetchGames();
  });

  // While any game on this date is live, keep the board fresh every minute.
  $effect(() => {
    const anyLive = games.some(isLive);
    if (!browser) return;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (anyLive) {
      pollTimer = setInterval(() => fetchGames(), 60_000);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  });

  function previousDay() {
    selectedDate = selectedDate.subtract({ days: 1 });
  }

  function nextDay() {
    if (selectedDate.compare(maxDate) >= 0) return;
    selectedDate = selectedDate.add({ days: 1 });
  }

  const isToday = $derived(selectedDate.compare(maxDate) === 0);

  const sortedGames = $derived.by(() => {
    return [...games].sort((a, b) => {
      const [ka, kb] = [statusSort(a), statusSort(b)];
      return ka[0] - kb[0] || ka[1] - kb[1];
    });
  });

  const liveGames = $derived(games.filter(isLive));
  const upcomingGames = $derived(
    games.filter((g) => g.status.abstractGameState === "Preview"),
  );
  const finalGames = $derived(
    games.filter(
      (g) =>
        g.status.abstractGameState === "Final" ||
        g.status.abstractGameState === "Complete",
    ),
  );

  function statusLine(g: ScheduleGame): string {
    const s = g.status;
    if (s.abstractGameState === "Live") {
      return liveInningLabel(g.linescore);
    }
    if (s.abstractGameState === "Preview") {
      if (s.startTimeTBD) return "TBD";
      return `${formatGameTime(g.gameDate)} ${g.dayNight === "D" ? "(day)" : "(night)"}`;
    }
    if (s.detailedState.startsWith("Postponed")) return "Postponed";
    return s.detailedState.includes("Suspended") ? "Suspended" : "Final";
  }

  function probableName(g: ScheduleGame, side: "away" | "home"): string {
    const pp = g.teams[side].probablePitcher;
    return pp?.fullName ?? "TBD";
  }
</script>

<svelte:head>
  <title>MLB Games | Sabermetric Seer</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">MLB Game Center</h1>
    <p class="text-muted-foreground">
      Every game on
      {selectedDate.toDate(getLocalTimeZone()).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      — scores, linescores, boxscores, win probability, weather and umpires.
    </p>
  </div>

  <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
    <div class="flex flex-col gap-3">
      <Label for="{id}-date" class="px-1">Game date</Label>
      <Popover.Root bind:open>
        <Popover.Trigger id="{id}-date">
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              class="w-48 justify-between font-normal"
            >
              {selectedDate.toDate(getLocalTimeZone()).toLocaleDateString()}
              <ChevronDown />
            </Button>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-auto overflow-hidden p-0" align="start">
          <Calendar
            type="single"
            bind:value={selectedDate}
            captionLayout="dropdown"
            maxValue={maxDate}
            minValue={new CalendarDate(2021, 3, 30)}
            onValueChange={() => {
              if (!selectedDate) selectedDate = maxDate;
              open = false;
            }}
          />
        </Popover.Content>
      </Popover.Root>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={previousDay}
        title="Previous day"
        disabled={loading}
      >
        <ChevronLeft />
        <span class="sr-only">Previous day</span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onclick={nextDay}
        title="Next day"
        disabled={loading || isToday}
      >
        <ChevronRight />
        <span class="sr-only">Next day</span>
      </Button>
      <Button variant="secondary" onclick={fetchGames} disabled={loading}>
        <RefreshCw class={cn(loading && "animate-spin")} />
        Refresh
      </Button>
    </div>

    {#if autoRefreshOn || liveGames.length > 0}
      <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconFlame class="size-4 text-red-500" />
        Auto-refreshing every 60s while games are live
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="space-y-3">
      {#each [1, 2, 3, 4, 5, 6] as row (row)}
        <Skeleton class="h-28 w-full rounded-lg" />
      {/each}
    </div>
  {:else if errorMessage}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {errorMessage}
    </div>
  {:else if games.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        No MLB games scheduled on this date. Try another day — the regular
        season runs late March through September, with October baseball after.
      </Card.Content>
    </Card.Root>
  {:else}
    <p class="text-muted-foreground text-sm">
      {games.length} game{games.length === 1 ? "" : "s"} ·
      {liveGames.length} live · {upcomingGames.length} upcoming ·
      {finalGames.length} final
    </p>

    <div class="flex flex-col gap-3">
      {#each sortedGames as game (`${game.gamePk}-${game.status.detailedState}`)}
        {@const expanded = expandedPk === game.gamePk}
        <Card.Root>
          <Card.Content class="p-0">
            <button
              type="button"
              class="hover:bg-muted/40 flex w-full cursor-pointer flex-col gap-3 p-4 text-left transition-colors sm:flex-row sm:items-center"
              onclick={() => {
                expandedPk = expanded ? null : game.gamePk;
              }}
              aria-expanded={expanded}
            >
              <!-- Scores / status column -->
              <div class="w-full shrink-0 sm:w-64">
                {#each [game.teams.away, game.teams.home] as side (`row-${side.team.id}`)}
                  <div class="flex items-center gap-2 py-0.5">
                    <img
                      src={teamLogo(side.team.id)}
                      alt="{side.team.name} logo"
                      class="size-7 shrink-0"
                    />
                    <span class={cn(
                          "flex-1 font-medium",
                          side.isWinner && "font-bold",
                        )}>
                      {side.team.abbreviation ?? side.team.teamName ?? side.team.name}
                      {#if side.leagueRecord}
                        <span class="text-muted-foreground text-xs">
                          ({side.leagueRecord.wins}-{side.leagueRecord.losses})
                        </span>
                      {/if}
                    </span>
                    {#if side.score != null}
                      <span class={cn("tabular-nums", side.isWinner ? "text-lg font-bold" : "text-base")}>
                        {side.score}
                      </span>
                    {/if}
                  </div>
                {/each}
                <p class="text-muted-foreground mt-1 text-xs">
                  ⚾ {probableName(game, "away")} · {probableName(game, "home")}
                </p>
              </div>

              <!-- Meta column -->
              <div class="flex flex-1 flex-col items-start gap-1 sm:items-end sm:text-right">
                {#if isLive(game)}
                  <Badge variant="destructive" class="animate-pulse gap-1">
                    <IconBroadcast class="size-3" /> LIVE
                  </Badge>
                {:else if game.status.abstractGameState === "Preview"}
                  <Badge variant="outline">{statusLine(game)}</Badge>
                {:else}
                  <Badge variant="secondary">{statusLine(game)}</Badge>
                {/if}
                <p class="text-muted-foreground text-xs">
                  {game.venue?.name ?? ""}
                  {#if game.doubleHeader === "Y"}
                    · DH Game {game.gameNumber}
                  {/if}
                  {#if game.seriesDescription && game.gamesInSeries && game.gamesInSeries > 1}
                    · {game.seriesDescription}, game {game.seriesGameNumber}
                  {/if}
                </p>
                <p class="text-muted-foreground text-xs italic">
                  {expanded ? "Hide details" : "Tap for boxscore, win probability & more"}
                </p>
              </div>
            </button>

            {#if expanded}
              <GameDetail {game} />
            {/if}
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
