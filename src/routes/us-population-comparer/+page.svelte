<script lang="ts">
  import { browser } from "$app/environment";
  import * as Card from "$lib/components/ui/card/index.js";
  import PlacePicker from "$lib/components/pulse/place-picker.svelte";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import { CUBES, fetchMembers, type Member } from "$lib/datausa.js";
  import PeopleTab from "./people-tab.svelte";
  import DiversityTab from "./diversity-tab.svelte";
  import IncomeTab from "./income-tab.svelte";
  import JobsTab from "./jobs-tab.svelte";
  import HealthTab from "./health-tab.svelte";
  import HousingCommuteTab from "./housing-commute-tab.svelte";

  type Level = "State" | "MSA" | "County";

  const LEVELS: { id: Level; label: string }[] = [
    { id: "State", label: "States" },
    { id: "MSA", label: "Metro areas" },
    { id: "County", label: "Counties" },
  ];

  const SEARCH_HINTS: Record<Level, string> = {
    State: "Search a state (e.g. Washington)…",
    MSA: "Search a metro area (e.g. Seattle-Tacoma)…",
    County: "Search a county (e.g. King)…",
  };

  /** tabs that render comparison bars (and thus honor the % toggle) */
  const BAR_TABS = ["diversity", "income", "health", "housing"];

  const COLOR_A = "#0ea5e9";
  const COLOR_B = "#f59e0b";

  let level = $state<Level>("State");
  let members = $state<Member[]>([]);
  let loadingMembers = $state(true);
  let activeTab = $state("people");
  let showPct = $state(false);
  let a = $state<Member | null>(null);
  let b = $state<Member | null>(null);

  async function loadMembers(next: Level) {
    loadingMembers = true;
    try {
      const list = await fetchMembers(CUBES.population, next);
      members = list;
      // pick sensible defaults when switching levels
      const wa = list.find((m) => m.caption === "Washington");
      const or = list.find((m) => m.caption === "Oregon");
      if (next === "State" && wa && or) {
        a = wa;
        b = or;
      } else if (!list.some((m) => m.key === a?.key)) {
        a = list[0] ?? null;
        b = list[1] ?? null;
      }
    } finally {
      loadingMembers = false;
    }
  }

  $effect(() => {
    if (browser) void loadMembers(level);
  });

  function setLevel(next: Level) {
    if (next === level) return;
    level = next;
    a = null;
    b = null;
  }
</script>

<svelte:head>
  <title>US Population Comparer | Compare Any Two Places</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">US Population Comparer</h1>
    <p class="text-muted-foreground">
      Pick any two places in America — states, metro areas, or counties — and
      see how they really compare: population, diversity, income, jobs, health
      coverage, housing, and commutes. Powered by the Data USA API (Census ACS
      5-year estimates).
    </p>
  </div>

  <Card.Root>
    <Card.Content class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          {#each LEVELS as l (l.id)}
            <Button
              variant={level === l.id ? "default" : "outline"}
              size="sm"
              onclick={() => setLevel(l.id)}
            >
              {l.label}
            </Button>
          {/each}
        </div>
        {#if BAR_TABS.includes(activeTab)}
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-xs">Bars:</span>
          <div class="flex gap-1">
            <Button
              variant={showPct ? "outline" : "default"}
              size="sm"
              onclick={() => (showPct = false)}>Counts</Button>
            <Button
              variant={showPct ? "default" : "outline"}
              size="sm"
              onclick={() => (showPct = true)}>% of place</Button>
          </div>
        </div>
        {/if}
      </div>

      {#if loadingMembers}
        <div class="grid gap-4 sm:grid-cols-2">
          <Skeleton class="h-16 w-full" />
          <Skeleton class="h-16 w-full" />
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2">
          <PlacePicker
            label="Place A"
            {members}
            bind:value={a}
            color={COLOR_A}
            placeholder={SEARCH_HINTS[level]}
          />
          <PlacePicker
            label="Place B"
            {members}
            bind:value={b}
            color={COLOR_B}
            placeholder={SEARCH_HINTS[level]}
          />
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  {#if a && b}
    <Tabs.Root bind:value={activeTab} class="w-full">
      <Tabs.List class="flex-wrap justify-start">
        <Tabs.Trigger value="people">People</Tabs.Trigger>
        <Tabs.Trigger value="diversity">Diversity</Tabs.Trigger>
        <Tabs.Trigger value="income">Income</Tabs.Trigger>
        <Tabs.Trigger value="jobs">Jobs</Tabs.Trigger>
        <Tabs.Trigger value="health">Health</Tabs.Trigger>
        <Tabs.Trigger value="housing">Housing &amp; Commute</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="people" class="pt-2">
        <PeopleTab {level} {a} {b} />
      </Tabs.Content>
      <Tabs.Content value="diversity" class="pt-2">
        <DiversityTab {level} {a} {b} asPercent={showPct} />
      </Tabs.Content>
      <Tabs.Content value="income" class="pt-2">
        <IncomeTab {level} {a} {b} asPercent={showPct} />
      </Tabs.Content>
      <Tabs.Content value="jobs" class="pt-2">
        <JobsTab {level} {a} {b} />
      </Tabs.Content>
      <Tabs.Content value="health" class="pt-2">
        <HealthTab {level} {a} {b} asPercent={showPct} />
      </Tabs.Content>
      <Tabs.Content value="housing" class="pt-2">
        <HousingCommuteTab {level} {a} {b} asPercent={showPct} />
      </Tabs.Content>
    </Tabs.Root>
  {:else if !loadingMembers}
    <p class={cn("text-muted-foreground text-sm")}>
      Pick two places above to start comparing.
    </p>
  {/if}

  <p class="text-muted-foreground text-xs">
    Source: Data USA (datausa.io) — American Community Survey 5-year estimates,
    US Census Bureau.
  </p>
</div>
