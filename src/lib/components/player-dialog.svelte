<script lang="ts">
  import { browser } from "$app/environment";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";

  interface PersonProfile {
    id: number;
    fullName: string;
    primaryNumber?: string | null;
    birthDate?: string;
    birthCity?: string;
    birthStateProvince?: string | null;
    birthCountry?: string;
    height?: string;
    weight?: number;
    active?: boolean;
    isPitcher?: boolean;
    currentTeam?: { id: number; name?: string };
    primaryPosition?: { abbreviation?: string; name?: string };
    batSide?: { description?: string };
    pitchHand?: { description?: string };
    mlbDebutDate?: string;
  }

  interface StatSplit {
    season?: string;
    team?: { id: number; name?: string };
    stat?: Record<string, number | string>;
  }

  interface YearByYearResponse {
    stats?: Array<{ splits?: StatSplit[] }>;
  }

  interface CareerResponse {
    stats?: Array<{
      stats?: Record<string, number | string>;
      splits?: Array<{ stat?: Record<string, number | string> }>;
    }>;
  }

  let {
    personId = null,
    fullName = "",
  }: {
    personId: number | null;
    fullName: string;
  } = $props();

  const API_BASE = "https://statsapi.mlb.com/api/v1";

  let open = $state(false);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);

  let profile = $state<PersonProfile | null>(null);
  // Most-recent seasons first, max SEASONS_SHOWN rows
  let hittingSeasons = $state<StatSplit[]>([]);
  let pitchingSeasons = $state<StatSplit[]>([]);
  let hittingCareer = $state<Record<string, number | string> | null>(null);
  let pitchingCareer = $state<Record<string, number | string> | null>(null);

  const SEASONS_SHOWN = 8;

  async function fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async function loadPlayer() {
    if (!browser || personId === null || personId === 0) return;
    loading = true;
    errorMessage = null;

    const [profileData, hittingYby, pitchingYby, hittingCar, pitchingCar] =
      await Promise.all([
        fetchJson<{ people: PersonProfile[] }>(
          `${API_BASE}/people/${personId}?hydrate=currentTeam`,
        ),
        fetchJson<YearByYearResponse>(
          `${API_BASE}/people/${personId}/stats?stats=yearByYear&group=hitting`,
        ),
        fetchJson<YearByYearResponse>(
          `${API_BASE}/people/${personId}/stats?stats=yearByYear&group=pitching`,
        ),
        fetchJson<CareerResponse>(
          `${API_BASE}/people/${personId}/stats?stats=career&group=hitting`,
        ),
        fetchJson<CareerResponse>(
          `${API_BASE}/people/${personId}/stats?stats=career&group=pitching`,
        ),
      ]);

    const person = profileData?.people?.[0];
    if (!person) {
      errorMessage = "Failed to load player info. Please try again.";
      loading = false;
      return;
    }
    profile = person;

    const sortSeasons = (resp: YearByYearResponse | null) =>
      (resp?.stats?.[0]?.splits ?? [])
        .filter((s) => s.stat && s.season && /^\d{4}$/.test(s.season))
        .sort((a, b) => Number(b.season) - Number(a.season))
        .slice(0, SEASONS_SHOWN);

    hittingSeasons = sortSeasons(hittingYby);
    pitchingSeasons = sortSeasons(pitchingYby);
    // The API returns career totals either directly on the stat entry or in its first split
    const careerOf = (resp: CareerResponse | null) =>
      resp?.stats?.[0]?.stats ??
      resp?.stats?.[0]?.splits?.[0]?.stat ??
      null;
    hittingCareer = careerOf(hittingCar);
    pitchingCareer = careerOf(pitchingCar);

    loading = false;
  }

  function onOpenChange(next: boolean) {
    open = next;
    if (next && !profile && !loading) loadPlayer();
  }

  const fmt = (v: number | string | undefined | null) =>
    v === undefined || v === null ? "—" : String(v);

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

        <!-- Hitting stats -->
        {#if hittingSeasons.length > 0}
          <section class="flex flex-col gap-2">
            <h3 class="text-foreground text-sm font-semibold">
              Hitting (last {Math.min(hittingSeasons.length, SEASONS_SHOWN)}{" "}
              seasons)
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
                  {#each hittingSeasons as season (season.season)}
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
        {#if pitchingSeasons.length > 0}
          <section class="flex flex-col gap-2">
            <h3 class="text-foreground text-sm font-semibold">
              Pitching (last {Math.min(pitchingSeasons.length, SEASONS_SHOWN)}
              seasons)
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
                  {#each pitchingSeasons as season (season.season)}
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
        </div>
      {/if}

      <Dialog.Footer>
        <Dialog.Close>
          {#snippet child({ props })}
            <Button variant="secondary" {...props}>Close</Button>
          {/snippet}
        </Dialog.Close>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
