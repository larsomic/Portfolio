<script lang="ts">
  import { Check, ChevronDown, RefreshCw } from "lucide-svelte";
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import DataTable from "../../data-table.svelte";
  import { columns, type Leader } from "./columns.js";

  type StatGroup = "hitting" | "pitching";

  interface CategoryDef {
    id: string;
    label: string;
    group: StatGroup;
  }

  const CATEGORIES: CategoryDef[] = [
    // Hitting
    { id: "homeRuns", label: "Home Runs", group: "hitting" },
    { id: "battingAverage", label: "Batting Average", group: "hitting" },
    { id: "onBasePlusSlugging", label: "OPS", group: "hitting" },
    { id: "runsBattedIn", label: "RBI", group: "hitting" },
    { id: "hits", label: "Hits", group: "hitting" },
    { id: "doubles", label: "Doubles", group: "hitting" },
    { id: "triples", label: "Triples", group: "hitting" },
    { id: "stolenBase", label: "Stolen Bases", group: "hitting" },
    { id: "walks", label: "Walks", group: "hitting" },
    { id: "hitByPitch", label: "Hit By Pitch", group: "hitting" },
    { id: "grandSlam", label: "Grand Slams", group: "hitting" },
    // Pitching
    { id: "earnedRunAverage", label: "ERA", group: "pitching" },
    { id: "winsLosing", label: "Wins", group: "pitching" },
    { id: "saves", label: "Saves", group: "pitching" },
    { id: "strikeouts", label: "Strikeouts", group: "pitching" },
    { id: "completeGames", label: "Complete Games", group: "pitching" },
    { id: "shutouts", label: "Shutouts", group: "pitching" },
  ];

  const currentSeason = new Date().getFullYear();
  const SEASONS = Array.from({ length: currentSeason - 1919 }, (_, i) =>
    String(currentSeason - i),
  );

  const API_BASE = "https://statsapi.mlb.com/api/v1/stats/leaders";

  let group = $state<StatGroup>("hitting");
  let category = $state<CategoryDef>(CATEGORIES[0]);
  let season = $state(String(currentSeason));

  let leadersOpen = $state(false);
  let seasonOpen = $state(false);

  let leaders = $state<Leader[]>([]);
  // Start as loading so SSR shows the skeleton until data arrives
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  let activeController: AbortController | null = null;

  function fetchLeaders() {
    if (!browser) return;

    // Cancel any in-flight request so rapid selections don't race
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    loading = true;
    errorMessage = null;

    const url = `${API_BASE}?leaderCategories=${category.id}&season=${season}&limit=25`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok)
          throw new Error(`Request failed with status ${res.status}`);
        return res.json() as Promise<{
          leagueLeaders: Array<{
            leaders: Array<{
              rank: number;
              value: string;
              person?: { id: number; fullName: string };
              team?: { name: string };
              league?: { name: string };
            }>;
          }>;
        }>;
      })
      .then((data) => {
        const allLeaders = (data.leagueLeaders ?? []).flatMap(
          (entry) => entry.leaders ?? [],
        );
        leaders = allLeaders.map((l) => ({
          rank: l.rank,
          personId: l.person?.id ?? 0,
          player: l.person?.fullName ?? "Unknown",
          team: l.team?.name ?? "—",
          league: l.league?.name ?? "—",
          value: l.value,
          valueNum: Number.parseFloat(l.value) || 0,
        }));
        loading = false;
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        errorMessage = "Failed to load leaders. Please try again.";
        loading = false;
      });
  }

  // Refetch whenever category or season changes
  $effect(() => {
    void category.id;
    void season;
    if (browser) fetchLeaders();
  });

  function selectGroup(next: StatGroup) {
    group = next;
    // Keep the selected category if it belongs to the new group, else default
    if (category.group !== next) {
      const firstInGroup = CATEGORIES.find((c) => c.group === next);
      if (firstInGroup) selectCategory(firstInGroup);
    }
  }

  function selectCategory(next: CategoryDef) {
    category = next;
    group = next.group;
  }
</script>

<svelte:head>
  <title>League Leaders | Sabermetric Seer</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div class="flex items-start justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">League Leaders</h1>
      <p class="text-muted-foreground">
        {season} MLB {group} leaders — {category.label}
      </p>
    </div>
    <Button
      variant="secondary"
      onclick={fetchLeaders}
      disabled={loading}
      class="shrink-0"
    >
      <RefreshCw />
      Refresh
    </Button>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <div class="flex gap-1 rounded-md border p-1">
      <Button
        variant={group === "hitting" ? "default" : "ghost"}
        size="sm"
        onclick={() => selectGroup("hitting")}
      >
        Hitting
      </Button>
      <Button
        variant={group === "pitching" ? "default" : "ghost"}
        size="sm"
        onclick={() => selectGroup("pitching")}
      >
        Pitching
      </Button>
    </div>

    <DropdownMenu.Root bind:open={leadersOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" class="w-48 justify-between font-normal">
          {category.label}
          <ChevronDown />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="max-h-72 w-48 overflow-y-auto"
        align="start"
      >
        <DropdownMenu.Group>
          <DropdownMenu.Label>
            {group === "hitting" ? "Hitting" : "Pitching"}
          </DropdownMenu.Label>
          {#each CATEGORIES.filter((c) => c.group === group) as cat (cat.id)}
            <DropdownMenu.Item onSelect={() => selectCategory(cat)}>
              {cat.label}
              {#if cat.id === category.id}
                <Check />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>

    <DropdownMenu.Root bind:open={seasonOpen}>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" class="w-32 justify-between font-normal">
          {season}
          <ChevronDown />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="max-h-72 w-32 overflow-y-auto"
        align="start"
      >
        <DropdownMenu.Group>
          {#each SEASONS as s (s)}
            <DropdownMenu.Item onSelect={() => (season = s)}>
              {s}
              {#if s === season}
                <Check />
              {/if}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  {#if loading}
    <div class="space-y-2">
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as row (row)}
        <Skeleton class="h-10 w-full" />
      {/each}
    </div>
  {:else if errorMessage}
    <div
      class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive"
    >
      {errorMessage}
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">
      Showing top {leaders.length} {category.label.toLowerCase()} leaders for
      the {season} season
    </p>
    <DataTable data={leaders} {columns} />
  {/if}
</div>
