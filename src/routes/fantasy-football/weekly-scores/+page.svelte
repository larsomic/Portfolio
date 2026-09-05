<script lang="ts">
  import { browser } from "$app/environment";
  import {
    IconCalendarEvent,
    IconChevronDown,
    IconRefresh,
    IconStethoscope,
    IconTrophy,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import { fetchWeekGames, type TeamGame } from "$lib/nfl-games.js";
  import {
    buildSeasonHistory,
    fetchJson,
    loadPlayerMap,
    matchupsUrl,
    nflStateUrl,
    positionRank,
    resolvePlayer,
    rostersUrl,
    usersForLeagueUrl,
    type NflState,
    type RawLeagueUser,
    type SeasonEntry,
    type SleeperMatchup,
    type SleeperRoster,
  } from "$lib/sleeper.js";

  const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

  interface ScoreRow {
    rosterId: number;
    ownerName: string;
    userId: string;
    points: number | null;
    wins: number;
    losses: number;
    starters: Array<{
      id: string;
      name: string;
      position: string;
      team: string;
      points: number | null;
      injuryStatus: string | null;
      game: TeamGame | null;
    }>;
  }

  let history = $state<SeasonEntry[]>([]);
  let selectedSeason = $state<SeasonEntry | null>(null);
  let selectedWeek = $state(1);
  let nflState = $state<NflState | null>(null);

  let rows = $state<ScoreRow[]>([]);
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);
  let hasLiveGames = $state(false);
  /** True when the season we're looking at hasn't had its rosters drafted yet. */
  let preRosters = $state(false);

  async function loadHistory() {
    const [state, seasons] = await Promise.all([
      fetchJson<NflState>(nflStateUrl()),
      buildSeasonHistory(),
    ]);
    nflState = state;
    history = seasons.seasons;
    selectedSeason = history[0] ?? null;

    // Default to the live/first week; future season still shows week 1.
    const week = state?.week ?? 1;
    selectedWeek = Math.min(Math.max(week, 1), 18);
  }

  async function loadScores() {
    if (!browser || !selectedSeason) return;
    loading = true;
    errorMessage = null;
    preRosters = false;

    const seasonYear = parseInt(selectedSeason.season, 10);
    const [matchups, rostersRaw, usersRaw, playerMap, games] =
      await Promise.all([
        fetchJson<SleeperMatchup[]>(
          matchupsUrl(selectedSeason.leagueId, selectedWeek),
        ),
        fetchJson<SleeperRoster[]>(rostersUrl(selectedSeason.leagueId)),
        fetchJson<RawLeagueUser[]>(usersForLeagueUrl(selectedSeason.leagueId)),
        loadPlayerMap(),
        fetchWeekGames(seasonYear, selectedWeek),
      ]);

    if (!rostersRaw) {
      errorMessage = "Couldn't reach Sleeper. Try again in a moment.";
      loading = false;
      return;
    }

    const namesById = new Map(
      (usersRaw ?? []).map((u) => [u.user_id, u.display_name ?? "Unknown"]),
    );
    const ownersByRoster = new Map(
      rostersRaw.map((r) => [
        r.roster_id,
        {
          userId: r.owner_id ?? "",
          name: namesById.get(r.owner_id ?? "") ?? "Former member",
        },
      ]),
    );

    // Only show injuries for the season Sleeper's injury data describes.
    const showInjuries =
      nflState?.season != null && selectedSeason.season === nflState.season;

    const buildStarters = (
      ids: string[],
      pointsMap: Record<string, number> | null | undefined,
    ) =>
      // Pre-draft rosters use "0" placeholders for empty starter slots.
      [...ids].filter((id) => id && id !== "0")
        .map((id) => {
          const player = resolvePlayer(id, playerMap);
          return {
            id,
            name: player.name,
            position: player.position,
            team: player.team || (id.length === 3 ? id : ""),
            points: pointsMap?.[id] ?? null,
            injuryStatus: showInjuries
              ? (player.injuryStatus ?? null)
              : null,
            game: games.get(player.team || id) ?? null,
          };
        })
        .sort(
          (a, b) =>
            positionRank(a.position) - positionRank(b.position) ||
            a.name.localeCompare(b.name),
        );

    let built: Omit<ScoreRow, "wins" | "losses">[];
    if (matchups && matchups.length > 0) {
      built = matchups.map((m) => ({
        rosterId: m.roster_id,
        userId: ownersByRoster.get(m.roster_id)?.userId ?? "",
        ownerName: ownersByRoster.get(m.roster_id)?.name ?? "Former member",
        points: m.points ?? null,
        starters: buildStarters(m.starters ?? [], m.players_points),
      }));
    } else {
      // No matchups yet (future week): show projected starters from rosters.
      if (rostersRaw.length === 0) preRosters = true;
      built = rostersRaw.map((r) => ({
        rosterId: r.roster_id,
        userId: r.owner_id ?? "",
        ownerName: namesById.get(r.owner_id ?? "") ?? "Former member",
        points: null,
        starters: buildStarters(r.starters ?? [], null),
      }));
    }

    // Round-robin scoring: every team "plays" every other team each week.
    // Ties count as half wins / half losses against each other.
    const scored = built.map((r) => ({ ...r, points: r.points ?? 0 }));
    rows = built.map((row, i) => {
      let wins = 0;
      let losses = 0;
      for (const other of scored) {
        if (other.rosterId === row.rosterId) continue;
        if (other.points < scored[i].points) wins += 1;
        else if (other.points > scored[i].points) losses += 1;
        else {
          wins += 0.5;
          losses += 0.5;
        }
      }
      return { ...row, wins, losses };
    });

    // Biggest scores first.
    rows.sort((a, b) => (b.points ?? -1) - (a.points ?? -1));

    hasLiveGames = [...games.values()].some((g) => g.status === "live");
    loading = false;
  }

  $effect(() => {
    if (!browser) return;
    void (async () => {
      await loadHistory();
      await loadScores();
    })();
  });

  // Refresh live games once a minute while something is on the field.
  $effect(() => {
    if (!browser || !hasLiveGames) return;
    const id = setInterval(() => void loadScores(), 60_000);
    return () => clearInterval(id);
  });

  function pickSeason(entry: SeasonEntry) {
    selectedSeason = entry;
    preRosters = false;
    // Keep the same week when switching seasons where possible.
    void loadScores();
  }

  const isCurrentView = $derived(
    nflState?.season != null &&
      selectedSeason?.season === nflState.season &&
      selectedWeek === (nflState.week ?? 1),
  );

  function fmt(n: number): string {
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }
</script>

<svelte:head>
  <title>Weekly Scores · Michael Larson</title>
</svelte:head>

<section class="flex flex-col gap-6">
  <div class="flex flex-wrap items-end justify-between gap-2">
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <IconTrophy class="text-primary size-6" />
        Weekly Scores
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Every owner plays every other owner each week: the high scorer goes
        9&ndash;0, the worst goes 0&ndash;9. Pick a season and week to rewind.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        href="/fantasy-football"
      >
        League Members
      </Button>
      {#if hasLiveGames}
        <Badge variant="destructive" class="animate-pulse">LIVE</Badge>
      {/if}

      {#if selectedSeason && history.length > 0}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="border bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none"
          >
            <IconCalendarEvent class="size-4 opacity-70" />
            {selectedSeason.season}
            <IconChevronDown class="size-4 opacity-70" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {#each history as entry (entry.season)}
              <DropdownMenu.Item
                class={entry.season === selectedSeason?.season
                  ? "text-primary font-semibold"
                  : ""}
                onclick={() => pickSeason(entry)}
              >
                {entry.season}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class="border bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none"
          >
            Week {selectedWeek}
            <IconChevronDown class="size-4 opacity-70" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="max-h-80 overflow-y-auto">
            {#each WEEKS as week (week)}
              <DropdownMenu.Item
                class={week === selectedWeek ? "text-primary font-semibold" : ""}
                onclick={() => {
                  selectedWeek = week;
                  preRosters = false;
                  void loadScores();
                }}
              >
                Week {week}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}

      <Button variant="outline" size="sm" onclick={() => void loadScores()}>
        <IconRefresh class="size-4" />
        Refresh
      </Button>
    </div>
  </div>

  {#if loading}
    <div class="flex flex-col gap-4">
      {#each Array.from({ length: 4 }) as _, i (i)}
        <Card.Root>
          <Card.Content class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <Skeleton class="h-6 w-40" />
              <Skeleton class="h-6 w-24" />
            </div>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {#each Array.from({ length: 5 }) as _, j (j)}
                <Skeleton class="h-12 w-full" />
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else if errorMessage}
    <p
      class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
    >
      {errorMessage}
    </p>
  {:else if preRosters}
    <p class="text-muted-foreground rounded-md border p-6 text-sm">
      The {selectedSeason?.season} season hasn't been drafted yet — rosters
      will appear once the draft completes.
    </p>
  {:else}
    <div class="flex flex-col gap-4">
      {#each rows as row (row.rosterId)}
        <Card.Root>
          <Card.Content class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <span class="font-semibold text-lg">{row.ownerName}</span>
                {#if row.points !== null}
                  <Badge variant="secondary" class="font-mono">
                    {row.wins % 1 === 0 ? row.wins : row.wins.toFixed(1)}-{row.losses % 1 === 0 ? row.losses : row.losses.toFixed(1)}
                  </Badge>
                {/if}
              </div>
              <span class="font-mono text-2xl font-bold tabular-nums">
                {row.points !== null ? fmt(row.points) : "—"}
              </span>
            </div>

            {#if row.starters.length > 0}
              <ul
                class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5"
              >
                {#each row.starters as player (player.id)}
                  {@const gameStatus = player.game?.status ?? "pre"}
                  <li>
                    <div
                      class={cn(
                        "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
                        gameStatus === "live" &&
                          "border-green-500/60 bg-green-500/10",
                        gameStatus === "pre" && "opacity-45",
                      )}
                      title={gameStatus === "pre"
                        ? "Game hasn't started"
                        : gameStatus === "live"
                          ? `Live: ${player.game?.detail ?? ""}`
                          : undefined}
                    >
                      <span class="flex min-w-0 items-center gap-1.5">
                        <span
                          class="text-muted-foreground w-7 shrink-0 font-mono text-xs uppercase"
                        >
                          {player.position}
                        </span>
                        <span class="truncate">{player.name}</span>
                        {#if player.injuryStatus}
                          <span
                            class="text-destructive shrink-0"
                            title={player.injuryStatus}
                          >
                            <IconStethoscope class="size-3.5" />
                          </span>
                        {/if}
                        {#if gameStatus === "live"}
                          <span
                            class="bg-green-500/20 text-green-700 dark:text-green-300 shrink-0 rounded-sm px-1 font-mono text-[10px]"
                          >
                            LIVE
                          </span>
                        {/if}
                      </span>
                      <span class="font-mono tabular-nums shrink-0">
                        {player.points !== null ? fmt(player.points) : ""}
                      </span>
                    </div>
                  </li>
                {/each}
              </ul>
            {:else if !loading}
              <p class="text-muted-foreground text-sm">
                No lineup set for this week.
              </p>
            {/if}
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}

  <!-- Legend -->
  {#if !loading && rows.length > 0}
    <div class="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
      <span class="flex items-center gap-1.5">
        <span
          class="inline-block size-3 rounded-sm border border-green-500/60 bg-green-500/10"
        ></span>
        Game live
      </span>
      <span class="flex items-center gap-1.5">
        <span class="inline-block size-3 rounded-sm border opacity-45"></span>
        Not started yet
      </span>
      {#if nflState?.season && selectedSeason?.season === nflState.season}
        <span class="flex items-center gap-1.5">
          <IconStethoscope class="text-destructive size-3.5" />
          Injured (current)
        </span>
      {/if}
      {#if isCurrentView}
        <span>Auto-refreshes every minute while a game is live.</span>
      {/if}
    </div>
  {/if}
</section>
