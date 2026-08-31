<script lang="ts">
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import {
    careerTotal,
    careerUrl,
    type CareerResponse,
    fetchJson,
    fmt,
    type PersonProfile,
    preferredView,
    personUrl,
    seasonRows,
    seasonSpan,
    type SeasonRow,
    type StatView,
    yearByYearUrl,
    type YearByYearResponse,
  } from "$lib/mlb-stats.js";

  let {
    personId = null,
    fullName = "",
  }: {
    personId: number | null;
    fullName: string;
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);

  let profile = $state<PersonProfile | null>(null);
  // Every MLB season in the year-by-year data, most recent first
  let hittingSeasons = $state<SeasonRow[]>([]);
  let pitchingSeasons = $state<SeasonRow[]>([]);
  let hittingCareer = $state<Record<string, number | string> | null>(null);
  let pitchingCareer = $state<Record<string, number | string> | null>(null);

  // Pitchers also have batting splits, so the dialog shows one stat group at a
  // time and opens on whichever matches the player's primary role.
  let view = $state<StatView>("hitting");

  async function loadPlayer() {
    if (!browser || personId === null || personId === 0) return;
    loading = true;
    errorMessage = null;

    const [profileData, hittingYby, pitchingYby, hittingCar, pitchingCar] =
      await Promise.all([
        fetchJson<{ people: PersonProfile[] }>(personUrl(personId)),
        fetchJson<YearByYearResponse>(yearByYearUrl(personId, "hitting")),
        fetchJson<YearByYearResponse>(yearByYearUrl(personId, "pitching")),
        fetchJson<CareerResponse>(careerUrl(personId, "hitting")),
        fetchJson<CareerResponse>(careerUrl(personId, "pitching")),
      ]);

    const person = profileData?.people?.[0];
    if (!person) {
      errorMessage = "Failed to load player info. Please try again.";
      loading = false;
      return;
    }
    profile = person;

    hittingSeasons = seasonRows(hittingYby, "h");
    pitchingSeasons = seasonRows(pitchingYby, "p");
    hittingCareer = careerTotal(hittingCar);
    pitchingCareer = careerTotal(pitchingCar);

    view = preferredView(profile, hittingSeasons, pitchingSeasons);

    loading = false;
  }

  /** Only show the switch when the player has both kinds of stats. */
  const canSwitch = $derived(
    hittingSeasons.length > 0 && pitchingSeasons.length > 0,
  );

  function onOpenChange(next: boolean) {
    open = next;
    if (next && !profile && !loading) loadPlayer();
  }

  const birthPlace = $derived(
    profile
      ? [profile.birthCity, profile.birthStateProvince, profile.birthCountry]
          .filter(Boolean)
          .join(", ")
      : "",
  );
</script>

{#if personId === null || personId === 0}
  <span>{fullName}</span>
{:else}
  <Dialog.Root {open} onOpenChange={onOpenChange}>
    <Dialog.Trigger
      class="font-medium text-primary decoration-1 underline-offset-4 hover:underline"
    >
      {fullName}
    </Dialog.Trigger>
    <Dialog.Content
      class="flex max-w-[calc(100%-2rem)] flex-col sm:max-w-4xl max-h-[85vh]"
    >
      <Dialog.Header>
        <Dialog.Title>{fullName}</Dialog.Title>
        {#if profile}
          <p
            class="text-muted-foreground text-sm"
          >
            {[
              profile.currentTeam?.name,
              profile.primaryPosition?.abbreviation
                ? `#${profile.primaryNumber ?? "-"} ${profile.primaryPosition.abbreviation}`
                : null,
              profile.active ? "Active" : null,
            ]
              .filter(Boolean)
              .join(" · ") || ""}
          </p>
        {/if}
      </Dialog.Header>

      {#if loading}
        <div class="space-y-2 min-h-0 flex-1 overflow-y-auto">
          {#each [1, 2, 3, 4, 5, 6] as row (row)}
            <Skeleton class="h-8 w-full" />
          {/each}
        </div>
      {:else if errorMessage}
        <p
          class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
        >
          {errorMessage}
        </p>
      {:else if profile}
        <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <!-- Player info -->
        <section class="flex flex-col gap-2">
          <h3 class="text-foreground text-sm font-semibold">Player Info</h3>
          <div
            class="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4"
          >
            {#if profile.birthDate}
              <div>
                <span class="text-muted-foreground/70">Born:</span>
                {profile.birthDate}
                {#if birthPlace}
                  <br />
                  <span class="text-xs">{birthPlace}</span>
                {/if}
              </div>
            {/if}
            {#if profile.height || profile.weight}
              <div>
                <span class="text-muted-foreground/70">HT/WT:</span>
                {profile.height ?? "—"} / {profile.weight
                  ? `${profile.weight} lbs`
                  : "—"}
              </div>
            {/if}
            {#if profile.batSide || profile.pitchHand}
              <div>
                <span class="text-muted-foreground/70">Bats/Throws:</span>
                {profile.batSide?.description ?? "—"} / {profile.pitchHand
                  ?.description ?? "—"}
              </div>
            {/if}
            {#if profile.mlbDebutDate}
              <div>
                <span class="text-muted-foreground/70">MLB Debut:</span>
                {profile.mlbDebutDate}
              </div>
            {/if}
          </div>
        </section>

        <Tabs.Root bind:value={view} class="flex flex-col gap-4">
          {#if canSwitch}
            <Tabs.List class="w-fit self-start">
              <Tabs.Trigger value="hitting">Hitting</Tabs.Trigger>
              <Tabs.Trigger value="pitching">Pitching</Tabs.Trigger>
            </Tabs.List>
          {/if}

          <!-- Hitting stats -->
          {#if hittingSeasons.length > 0 && view === "hitting"}
            <section class="flex flex-col gap-2">
              <h3 class="text-foreground text-sm font-semibold">
                {#if canSwitch}
                  {seasonSpan(hittingSeasons)}
                {:else}
                  Hitting ({seasonSpan(hittingSeasons)})
                {/if}
              </h3>
              <div class="max-h-[45vh] overflow-auto">
                <table class="w-full caption-bottom text-xs">
                  <Table.Header class="sticky top-0 z-10 bg-popover">
                    <Table.Row>
                      <Table.Head class="whitespace-nowrap">Season</Table.Head>
                      <Table.Head class="whitespace-nowrap">Team</Table.Head>
                      <Table.Head class="text-right">GP</Table.Head>
                      <Table.Head class="text-right">AB</Table.Head>
                      <Table.Head class="text-right">R</Table.Head>
                      <Table.Head class="text-right">H</Table.Head>
                      <Table.Head class="text-right">2B</Table.Head>
                      <Table.Head class="text-right">3B</Table.Head>
                      <Table.Head class="text-right">HR</Table.Head>
                      <Table.Head class="text-right">RBI</Table.Head>
                      <Table.Head class="text-right">BB</Table.Head>
                      <Table.Head class="text-right">SO</Table.Head>
                      <Table.Head class="text-right">AVG</Table.Head>
                      <Table.Head class="text-right">OBP</Table.Head>
                      <Table.Head class="text-right">SLG</Table.Head>
                      <Table.Head class="text-right">OPS</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each hittingSeasons as season (season.key)}
                      <Table.Row>
                        <Table.Cell>{season.season}</Table.Cell>
                        <Table.Cell class="max-w-24 truncate">
                          {season.team?.name ?? "—"}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.gamesPlayed)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.atBats)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.runs)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.hits)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.doubles)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.triples)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.homeRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.rbi)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.baseOnBalls)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.strikeOuts)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.avg)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.obp)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.slg)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.ops)}
                        </Table.Cell>
                      </Table.Row>
                    {/each}
                    {#if hittingCareer}
                      <Table.Row class="bg-muted/50 font-semibold">
                        <Table.Cell>Career</Table.Cell>
                        <Table.Cell>—</Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.gamesPlayed)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.atBats)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.runs)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.hits)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.doubles)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.triples)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.homeRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.rbi)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.baseOnBalls)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.strikeOuts)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.avg)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.obp)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.slg)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(hittingCareer.ops)}
                        </Table.Cell>
                      </Table.Row>
                    {/if}
                  </Table.Body>
                </table>
              </div>
            </section>
          {/if}

          <!-- Pitching stats -->
          {#if pitchingSeasons.length > 0 && view === "pitching"}
            <section class="flex flex-col gap-2">
              <h3 class="text-foreground text-sm font-semibold">
                {#if canSwitch}
                  {seasonSpan(pitchingSeasons)}
                {:else}
                  Pitching ({seasonSpan(pitchingSeasons)})
                {/if}
              </h3>
              <div class="max-h-[45vh] overflow-auto">
                <table class="w-full caption-bottom text-xs">
                  <Table.Header class="sticky top-0 z-10 bg-popover">
                    <Table.Row>
                      <Table.Head class="whitespace-nowrap">Season</Table.Head>
                      <Table.Head class="whitespace-nowrap">Team</Table.Head>
                      <Table.Head class="text-right">G</Table.Head>
                      <Table.Head class="text-right">W</Table.Head>
                      <Table.Head class="text-right">L</Table.Head>
                      <Table.Head class="text-right">ERA</Table.Head>
                      <Table.Head class="text-right">SV</Table.Head>
                      <Table.Head class="text-right">IP</Table.Head>
                      <Table.Head class="text-right">H</Table.Head>
                      <Table.Head class="text-right">ER</Table.Head>
                      <Table.Head class="text-right">HR</Table.Head>
                      <Table.Head class="text-right">BB</Table.Head>
                      <Table.Head class="text-right">SO</Table.Head>
                      <Table.Head class="text-right">WHIP</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {#each pitchingSeasons as season (season.key)}
                      <Table.Row>
                        <Table.Cell>{season.season}</Table.Cell>
                        <Table.Cell class="max-w-24 truncate">
                          {season.team?.name ?? "—"}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.gamesPlayed)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.wins)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.losses)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.era)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.saves)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.inningsPitched)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.hits)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.earnedRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.homeRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.baseOnBalls)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.strikeOuts)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(season.stat?.whip)}
                        </Table.Cell>
                      </Table.Row>
                    {/each}
                    {#if pitchingCareer}
                      <Table.Row class="bg-muted/50 font-semibold">
                        <Table.Cell>Career</Table.Cell>
                        <Table.Cell>—</Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.gamesPlayed)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.wins)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.losses)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.era)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.saves)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.inningsPitched)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.hits)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.earnedRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.homeRuns)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.baseOnBalls)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.strikeOuts)}
                        </Table.Cell>
                        <Table.Cell class="text-right">
                          {fmt(pitchingCareer.whip)}
                        </Table.Cell>
                      </Table.Row>
                    {/if}
                  </Table.Body>
                </table>
              </div>
            </section>
          {/if}
        </Tabs.Root>
        </div>
      {/if}

      <Dialog.Footer>
        {#if personId}
          <Button
            variant="outline"
            size="sm"
            href={`/sabermetric-seer/compare?a=${personId}`}
          >Compare players</Button>
        {/if}
        <Dialog.Close>
          {#snippet child({ props })}
            <Button variant="secondary" {...props}>Close</Button>
          {/snippet}
        </Dialog.Close>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
