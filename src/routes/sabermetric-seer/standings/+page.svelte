<script lang="ts">
  import { RefreshCw } from "lucide-svelte";
  import { invalidateAll } from "$app/navigation";
  import { Button } from "$lib/components/ui/button/index.js";
  import DataTable from "../../data-table.svelte";
  import { columns } from "./columns.js";

  let { data } = $props();

  const leagues = $derived(data.leagues);
  const season = $derived(data.season);

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
      onclick={refresh}
      disabled={refreshing}
      class="shrink-0"
    >
      <RefreshCw />
      Refresh
    </Button>
  </div>

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
</div>
