<script lang="ts">
  import { IconCrown, IconSwords, IconUmbrella2, IconMapPin } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import TrendChart from "$lib/components/pulse/trend-chart.svelte";
  import RankedList from "$lib/components/pulse/ranked-list.svelte";
  import type { PageData } from "./$types.js";

  let { data }: { data: PageData } = $props();

  const COLOR_UPSET = "#f97316"; // orange — chaos

  const doubleDigitSeries = $derived([
    {
      name: "Double-digit seed wins",
      color: "#8b5cf6", // violet
      points: data.perSeason.map((s) => ({
        x: s.season,
        y: s.doubleDigitWins,
      })),
    },
  ]);

  const eraLabel = $derived(
    `Every NCAA tournament game from ${data.firstSeason} through ${data.newest} — ${data.gameCount.toLocaleString()} games, all seeded, all judged.`,
  );
</script>

<svelte:head>
  <title>Cinderella Tracker · March Madness</title>
</svelte:head>

<section class="flex flex-col gap-6">
  <div>
    <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
      <IconUmbrella2 class="text-primary size-6" />
      The Cinderella Tracker
    </h1>
    <p class="text-muted-foreground mt-1 text-sm">
      {eraLabel} Who actually pulls off the shock? The numbers keep score.
    </p>
  </div>

  <!-- Seed matchup upset rates -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-base flex items-center gap-2">
        <IconSwords class="size-4" />
        Who upsets whom?
      </Card.Title>
      <Card.Description>
        Percentage of games where the weaker seed won, per matchup — since
        {data.firstSeason}. The 5-vs-12 bloodsport you keep hearing about,
        quantified.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.matchUps.slice(0, 9) as m (m.pair)}
          <div
            class="bg-muted/40 flex items-center justify-between rounded-md px-3 py-2"
          >
            <span class="font-mono text-sm font-semibold">{m.pair}</span>
            <span class="text-right text-xs">
              <span class="font-mono text-base font-bold" style={`color:${COLOR_UPSET}`}>
                {Math.round(m.upsetRate * 100)}%
              </span>
              <span class="text-muted-foreground"> · {m.games} games</span>
            </span>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Double-digit seeds over time -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-base">Double-digit seeds, year by year</Card.Title>
      <Card.Description>
        Wins by the 10-through-16 seeds. Some years are a massacre; some
        years Cinderella doesn't leave the house.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <TrendChart
        series={doubleDigitSeries}
        fmtY={(n) => String(Math.round(n))}
        height={260}
      />
    </Card.Content>
  </Card.Root>

  <!-- Biggest upsets -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="text-base flex items-center gap-2">
        <IconSwords class="size-4" />
        The 25 biggest shocks
      </Card.Title>
      <Card.Description>
        Ranked by the size of the seed gap, then the margin of victory. The
        most impossible wins in modern tournament history.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-col gap-1.5">
        {#each data.biggestUpsets as g, i (g.id)}
          <div
            class="bg-muted/40 flex flex-col gap-1 rounded-md px-2 py-1.5 sm:flex-row sm:items-center sm:gap-3"
          >
            <span class="text-muted-foreground w-10 shrink-0 font-mono text-xs"
              >#{i + 1}</span
            >
            <div class="flex flex-1 flex-wrap items-center gap-x-2 text-sm">
              <Badge variant="destructive" class="font-mono text-[10px]">
                {g.winnerSeed}-seed
              </Badge>
              <span class="font-semibold">{g.winner}</span>
              <span class="font-mono tabular-nums">
                {Math.max(g.scoreA, g.scoreB)}–{Math.min(g.scoreA, g.scoreB)}
              </span>
              <span class="text-muted-foreground">over</span>
              <Badge variant="secondary" class="font-mono text-[10px]">
                {g.loserSeed}-seed
              </Badge>
              <span class="text-muted-foreground">{g.loser}</span>
            </div>
            <span class="text-muted-foreground shrink-0 font-mono text-xs">
              {g.season} · {g.round}
            </span>
          </div>
        {/each}
      </div>
    </Card.Content>
  </Card.Root>

  <div class="grid gap-4 lg:grid-cols-2">
    <!-- Contenders -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-base flex items-center gap-2">
          <IconCrown class="size-4 text-amber-500" />
          Final Four royalty
        </Card.Title>
        <Card.Description>
          Most wins in the last four games of the tournament since {data.firstSeason}. Titles in bold.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-muted-foreground border-b text-left text-xs">
              <th class="py-1 font-medium">Team</th>
              <th class="py-1 text-right font-medium">Apps</th>
              <th class="py-1 text-right font-medium">Wins</th>
              <th class="py-1 text-right font-medium">Titles</th>
            </tr>
          </thead>
          <tbody>
            {#each data.contenders as c (c.team)}
              <tr class="border-b border-muted last:border-0">
                <td class="py-1.5">{c.team}</td>
                <td class="text-muted-foreground py-1.5 text-right font-mono tabular-nums">
                  {c.apps}
                </td>
                <td class="py-1.5 text-right font-mono tabular-nums">{c.wins}</td>
                <td class="py-1.5 text-right font-mono font-bold tabular-nums">
                  {c.championships}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </Card.Content>
    </Card.Root>

    <!-- Final Four host cities -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-base flex items-center gap-2">
          <IconMapPin class="size-4 text-sky-500" />
          Where the dance happened
        </Card.Title>
        <Card.Description>
          Sites that hosted the most Final Four / championship games since {data.firstSeason}.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <RankedList
          title="Hosts"
          label="Final Four + title game appearances at this site"
          color="#0ea5e9"
          items={data.finalFourCities}
          fmt={(n) => `${n}`}
          maxItems={12}
        />
      </Card.Content>
    </Card.Root>
  </div>

  <p class="text-muted-foreground text-center text-xs">
    Data: College Basketball Data API · seeds from the {data.firstSeason}
    bracket expansion onward.
  </p>
</section>
