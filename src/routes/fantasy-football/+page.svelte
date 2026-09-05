<script lang="ts">
  import { IconRefresh, IconTrophy } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import TeamRosterDialog from "$lib/components/team-roster-dialog.svelte";
  import { invalidateAll } from "$app/navigation";
  import type { PageData } from "./$types.js";

  let { data }: { data: PageData } = $props();

  const members = $derived(data.members);
  const seasons = $derived(data.seasons);
  const leagueName = $derived(data.leagueName);

  let refreshing = $state(false);

  async function refresh() {
    refreshing = true;
    try {
      await invalidateAll();
    } finally {
      refreshing = false;
    }
  }
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
    <div class="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        href="/fantasy-football/weekly-scores"
      >
        Weekly Scores
      </Button>
      <Button variant="outline" size="sm" onclick={refresh} disabled={refreshing}>
        <IconRefresh class="size-4" />
        Refresh
      </Button>
    </div>
  </div>

  <div
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    {#each members as member (member.userId)}
      <TeamRosterDialog {member} {seasons} />
    {/each}
  </div>
</section>
