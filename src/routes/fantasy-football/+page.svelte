<script lang="ts">
  import { browser } from "$app/environment";
  import { IconRefresh, IconTrophy } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import TeamRosterDialog from "$lib/components/team-roster-dialog.svelte";
  import {
    buildSeasonHistory,
    fetchJson,
    membersUrl,
    parseMembers,
    type LeagueMember,
    type RawLeagueUser,
    type SeasonEntry,
  } from "$lib/sleeper.js";

  let members = $state<LeagueMember[]>([]);
  let seasons = $state<SeasonEntry[]>([]);
  let leagueName = $state("");
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  async function loadLeague() {
    if (!browser) return;
    loading = true;
    errorMessage = null;

    const [history, usersRaw] = await Promise.all([
      buildSeasonHistory(),
      fetchJson<RawLeagueUser[]>(membersUrl()),
    ]);

    if (!usersRaw) {
      errorMessage = "Couldn't reach Sleeper. Try again in a moment.";
      loading = false;
      return;
    }

    members = parseMembers(usersRaw);
    seasons = history.seasons;
    leagueName = history.name;
    loading = false;
  }

  $effect(() => {
    if (browser) loadLeague();
  });
</script>

<svelte:head>
  <title>Fantasy Football · Michael Larson</title>
</svelte:head>

<section class="flex flex-col gap-6">
  <div class="flex flex-wrap items-end justify-between gap-2">
    <div>
      <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <IconTrophy class="text-primary size-6" />
        Fantasy Football
      </h1>
      <p class="text-muted-foreground mt-1 text-sm">
        {#if leagueName}
          {leagueName} &middot;
        {/if}
        Every member of the league, pulled live from Sleeper. Click a card to see
        that team's roster — pick any season to go back in time.
      </p>
    </div>
    {#if !loading}
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          href="/fantasy-football/weekly-scores"
        >
          Weekly Scores
        </Button>
        <Button variant="outline" size="sm" onclick={loadLeague}>
          <IconRefresh class="size-4" />
          Refresh
        </Button>
      </div>
    {/if}
  </div>

  {#if loading}
    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {#each Array.from({ length: 8 }) as _, i (i)}
        <Card.Root>
          <Card.Content class="flex items-center gap-4">
            <Skeleton class="size-14 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {:else if errorMessage}
    <p class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm">
      {errorMessage}
    </p>
  {:else}
    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {#each members as member (member.userId)}
        <TeamRosterDialog {member} {seasons} />
      {/each}
    </div>
  {/if}
</section>
