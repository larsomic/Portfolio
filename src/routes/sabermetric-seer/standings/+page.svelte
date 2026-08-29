<script lang="ts">
  import { RefreshCw } from "lucide-svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import DataTable from "../../data-table.svelte";
  import { columns, type TeamStanding } from "./columns.js";

  interface MlbStandingsResponse {
    records: Array<{
      league: { id: number };
      division: { id: number };
      teamRecords: Array<{
        team: { id: number; name: string };
        wins: number;
        losses: number;
        gamesPlayed: number;
        winningPercentage: string;
        streak?: { streakCode?: string };
        gamesBack: string | null;
        runDifferential: number;
      }>;
    }>;
  }

  type Division = {
    id: number;
    name: string;
    teams: TeamStanding[];
  };

  type League = {
    id: number;
    name: string;
    divisions: Division[];
  };

  const API_BASE = "https://statsapi.mlb.com/api/v1/standings";

  const season = new Date().getFullYear();

  const divisionNames: Record<number, string> = {
    200: "AL West",
    201: "AL East",
    202: "AL Central",
    203: "NL West",
    204: "NL East",
    205: "NL Central",
  };

  const leagueNames: Record<number, string> = {
    103: "American League",
    104: "National League",
  };

  let leagues = $state<League[]>([]);
  // Start as loading so SSR shows the skeleton until data arrives
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  let activeController: AbortController | null = null;

  function fetchStandings() {
    if (!browser) return;

    // Cancel any in-flight request so refreshes don't race
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    loading = true;
    errorMessage = null;

    fetch(
      `${API_BASE}?leagueId=103,104&season=${season}&standingsTypes=regularSeason`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<MlbStandingsResponse>;
      })
      .then((data) => {
        const leagueGroups: Record<number, League> = {};

        for (const record of data.records ?? []) {
          const leagueId = record.league.id;
          const divisionId = record.division.id;

          let league = leagueGroups[leagueId];
          if (!league) {
            league = {
              id: leagueId,
              name: leagueNames[leagueId] ?? `League ${leagueId}`,
              divisions: [],
            };
            leagueGroups[leagueId] = league;
          }

          const division: Division = {
            id: divisionId,
            name: divisionNames[divisionId] ?? `Division ${divisionId}`,
            teams: (record.teamRecords ?? []).map((team) => ({
              teamId: team.team.id,
              teamName: team.team.name,
              wins: team.wins,
              losses: team.losses,
              gamesPlayed: team.gamesPlayed,
              winningPct: team.winningPercentage,
              streakCode: team.streak?.streakCode ?? "—",
              gamesBack: team.gamesBack === "-" ? null : team.gamesBack,
              runDifferential: team.runDifferential,
            })),
          };
          league.divisions.push(division);
        }

        leagues = Object.values(leagueGroups)
          .sort((a, b) => a.id - b.id)
          .map((league) => ({
            ...league,
            divisions: league.divisions.sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          }));
        loading = false;
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        errorMessage = "Failed to load standings. Please try again.";
        loading = false;
      });
  }

  $effect(() => {
    if (browser) fetchStandings();
  });
</script>

<svelte:head>
  <title>MLB Standings | Sabermetric Seer</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">MLB Standings</h1>
      <p class="text-muted-foreground">
        Regular season standings for the {season} season, split by league and
        division
      </p>
    </div>
    <Button
      variant="secondary"
      onclick={fetchStandings}
      disabled={loading}
      class="shrink-0"
    >
      <RefreshCw />
      Refresh
    </Button>
  </div>

  {#if loading}
    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {#each [1, 2, 3, 4, 5, 6] as division (division)}
        <div class="space-y-2">
          <Skeleton class="h-6 w-32" />
          {#each [1, 2, 3, 4, 5] as row (row)}
            <Skeleton class="h-10 w-full" />
          {/each}
        </div>
      {/each}
    </div>
  {:else if errorMessage}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive"
    >
      {errorMessage}
    </div>
  {:else}
    {#each leagues as league (league.id)}
      <section class="flex flex-col gap-4">
        <h2 class="text-2xl font-bold">{league.name}</h2>

        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {#each league.divisions as division (division.id)}
            <div class="flex flex-col gap-2">
              <h3 class="text-lg font-semibold text-muted-foreground">
                {division.name}
              </h3>
              <DataTable data={division.teams} {columns} />
            </div>
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</div>
