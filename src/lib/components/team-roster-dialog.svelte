<script lang="ts">
  import { IconChevronDown, IconUsersGroup } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import {
    fetchJson,
    loadPlayerMap,
    parseSeasonRoster,
    rostersUrl,
    type LeagueMember,
    type SeasonEntry,
    type SeasonRoster,
    type SleeperRoster,
  } from "$lib/sleeper.js";

  let {
    member,
    seasons,
  }: {
    member: LeagueMember;
    /** Most recent season first. */
    seasons: SeasonEntry[];
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  // Reactive so a new member (or a retried image) resets the fallback cleanly.
  let avatarFailed = $state(false);
  const avatarSrc = $derived(avatarFailed ? null : member.avatarUrl);

  // season -> fetched roster for this member, so re-picking a season is instant.
  const cache = new Map<string, SeasonRoster | null>();
  // Defaults to the most recent season; overridden once a roster is found or
  // the user picks a season. Reactive so a changed `seasons` prop is picked up.
  let selectedSeason = $state<SeasonEntry | null>(null);
  const selected = $derived(selectedSeason ?? seasons[0]);
  let roster = $state<SeasonRoster | null>(null);

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  async function fetchFor(entry: SeasonEntry): Promise<SeasonRoster | null> {
    const cached = cache.get(entry.season);
    if (cached !== undefined) return cached;
    const [rosters, playerMap] = await Promise.all([
      fetchJson<SleeperRoster[]>(rostersUrl(entry.leagueId)),
      loadPlayerMap(),
    ]);
    if (!rosters) return null; // don't cache failures
    const parsed = parseSeasonRoster(rosters, member.userId, playerMap);
    cache.set(entry.season, parsed);
    return parsed;
  }

  /**
   * Open on the most recent season this owner actually has a roster for —
   * the current season sits empty until the draft happens.
   */
  async function loadLatest() {
    loading = true;
    errorMessage = null;
    for (const entry of seasons) {
      const found = await fetchFor(entry);
      if (found && found.players.length > 0) {
        selectedSeason = entry;
        roster = found;
        loading = false;
        return;
      }
    }
    // Nothing found anywhere: show the newest season's (empty) state.
    selectedSeason = seasons[0] ?? null;
    roster = null;
    if (seasons.length === 0) {
      errorMessage = "Couldn't load league history from Sleeper.";
    }
    loading = false;
  }

  function onOpenChange(next: boolean) {
    open = next;
    if (next && roster === null && !loading) void loadLatest();
  }

  async function pickSeason(entry: SeasonEntry) {
    if (entry.season === selected?.season) return;
    loading = true;
    errorMessage = null;
    const found = await fetchFor(entry);
    selectedSeason = entry;
    roster = found;
    loading = false;
  }

  const recordLine = $derived.by(() => {
    if (!roster) return "";
    const parts: string[] = [];
    if (roster.wins !== null || roster.losses !== null) {
      parts.push(
        `${roster.wins ?? 0}-${roster.losses ?? 0}${roster.ties ? `-${roster.ties}` : ""}`,
      );
    }
    if (roster.pointsFor !== null) {
      parts.push(`${roster.pointsFor.toFixed(1)} pts`);
    }
    return parts.join(" · ");
  });
</script>

<Dialog.Root {open} onOpenChange={onOpenChange}>
  <Card.Root class="relative transition-shadow hover:shadow-md">
    <!-- Whole card opens the dialog; Sleeper team names are deliberately never shown. -->
    <Dialog.Trigger
      class="absolute inset-0 z-10 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`View ${member.displayName}'s roster`}
    />
    <Card.Content class="flex items-center gap-4">
      <span
        class="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
      >
        {#if avatarSrc}
          <img
            src={avatarSrc}
            alt=""
            class="size-14 rounded-full object-cover"
            onerror={() => (avatarFailed = true)}
          />
        {:else}
          {initials(member.displayName)}
        {/if}
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold">{member.displayName}</p>
        <p class="text-muted-foreground flex items-center gap-1 text-xs">
          <IconUsersGroup class="size-3.5" />
          View roster
        </p>
      </div>
    </Card.Content>
  </Card.Root>

  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content
      class="flex max-w-[calc(100%-2rem)] flex-col sm:max-w-2xl max-h-[85vh]"
    >
      <!-- Extra right padding so the season picker never sits under the X button. -->
      <Dialog.Header class="gap-3 pr-10">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Dialog.Title class="text-xl">{member.displayName}</Dialog.Title>

          <!-- Season picker built from the league's previous-league chain. -->
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="border bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors outline-none"
            >
              {selected ? `Season ${selected.season}` : "Season"}
              <IconChevronDown class="size-4 opacity-70" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content class="max-h-80 overflow-y-auto">
              {#each seasons as entry (entry.season)}
                <DropdownMenu.Item
                  class={selected && entry.season === selected.season
                    ? "text-primary font-semibold"
                    : ""}
                  onclick={() => pickSeason(entry)}
                >
                  {entry.season}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
        {#if roster && recordLine}
          <Badge variant="secondary" class="w-fit">{recordLine}</Badge>
        {/if}
      </Dialog.Header>

      {#if loading}
        <div class="space-y-2 overflow-y-auto px-6 pb-6">
          {#each [1, 2, 3, 4, 5, 6, 7, 8] as row (row)}
            <Skeleton class="h-8 w-full" />
          {/each}
        </div>
      {:else if errorMessage}
        <p
          class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
        >
          {errorMessage}
        </p>
      {:else if roster}
        <div class="flex min-h-0 flex-col gap-4 overflow-y-auto px-6 pb-6">
          <p class="text-muted-foreground text-sm">
            Final roster for the {selected.season} season ·
            {roster.players.length} players
          </p>
          <ul
            class="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2"
          >
            {#each roster.players as player (player.id)}
              <li class="flex items-center justify-between gap-3 text-sm">
                <span class="truncate">
                  {player.name}
                  {#if player.team && player.position !== "DEF"}
                    <span class="text-muted-foreground/70 text-xs">
                      ({player.team})</span
                    >
                  {/if}
                </span>
                <Badge variant="outline" class="shrink-0 font-mono text-xs">
                  {player.position}
                </Badge>
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <p class="text-muted-foreground px-6 pb-6 text-sm">
          No roster found for {member.displayName}. They may have joined the
          league after these seasons.
        </p>
      {/if}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
