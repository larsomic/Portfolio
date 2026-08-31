<script lang="ts">
  import { browser } from "$app/environment";
  import {
    IconArrowsSort,
    IconBallBaseball,
    IconCalendarEvent,
    IconChartInfographic,
    IconDatabase,
    IconExchange,
    IconMoonStars,
    IconStack2,
    IconTarget,
    IconTrophy,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as Accordion from "$lib/components/ui/accordion/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import PlayerDialog from "$lib/components/player-dialog.svelte";

  interface SpotlightRow {
    id: string;
    rank: number;
    personId: number;
    player: string;
    team: string;
    value: string;
  }

  interface LeagueLeadersResponse {
    leagueLeaders?: Array<{
      leaders?: Array<{
        rank: number;
        value: string;
        person?: { id: number; fullName: string };
        team?: { name: string };
      }>;
    }>;
  }

  const season = new Date().getFullYear();
  const API_BASE = "https://statsapi.mlb.com/api/v1/stats/leaders";

  const FEATURES = [
    {
      title: "League Leaders",
      href: "/sabermetric-seer/league-leaders",
      icon: IconTrophy,
      blurb:
        "Every batting and pitching race I follow, in one table — no page of column-chart noise between me and the number.",
      points: [
        "17 categories, from home runs to WHIP",
        "Any season back to 1919, dead-ball era included",
        "Hitting and pitching toggle that refetches instantly",
        "Click any header to sort the board up or down",
      ],
    },
    {
      title: "Standings",
      href: "/sabermetric-seer/standings",
      icon: IconChartInfographic,
      blurb:
        "Both leagues, all six divisions, and the columns I actually care about instead of just wins in the loss column.",
      points: [
        "American League and National League side by side",
        "Games back, winning percentage, current streak",
        "Run differential right next to the record",
        "Sortable so I can find the hottest team in one click",
      ],
    },
    {
      title: "Transactions",
      href: "/sabermetric-seer/transactions",
      icon: IconCalendarEvent,
      blurb:
        "The daily wire. Pick a date and watch rosters get reshuffled — trade deadline or a Rule 5 pick on a quiet Tuesday.",
      points: [
        "Jump to any day with the calendar picker",
        "From-team and to-team on every move",
        "Move type plus the full description",
        "Player names open the same career pop-up",
      ],
    },
    {
      title: "Compare Players",
      href: "/sabermetric-seer/compare",
      icon: IconExchange,
      blurb:
        "Two careers on one axis. Search any player, living or retired, and put their seasons side by side.",
      points: [
        "Any two players, including Hall of Famers",
        "24 metrics from home runs to WHIP",
        "Rate stats derived from summed counting stats",
        "Scale counting stats per 162 games to compare a career year",
      ],
    },
  ] as const;

  let hitting = $state<SpotlightRow[]>([]);
  let pitching = $state<SpotlightRow[]>([]);
  // Start as loading so SSR shows the skeleton until data arrives
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);

  let activeController: AbortController | null = null;

  async function fetchSpotlight() {
    if (!browser) return;

    // Cancel any in-flight request so refreshes don't race
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    loading = true;
    errorMessage = null;

    const urlFor = (category: string, group: "hitting" | "pitching") =>
      `${API_BASE}?leaderCategories=${category}&season=${season}&statGroup=${group}&limit=5`;

    try {
      const [hrRes, eraRes] = await Promise.all([
        fetch(urlFor("homeRuns", "hitting"), { signal: controller.signal }),
        fetch(urlFor("earnedRunAverage", "pitching"), {
          signal: controller.signal,
        }),
      ]);
      if (!hrRes.ok || !eraRes.ok) throw new Error("Request failed");

      const map = async (
        res: Response,
        key: string,
      ): Promise<SpotlightRow[]> => {
        const json = (await res.json()) as LeagueLeadersResponse;
        return (json.leagueLeaders?.[0]?.leaders ?? []).map((l, index) => ({
          id: `${key}-${index}`,
          rank: l.rank,
          personId: l.person?.id ?? 0,
          player: l.person?.fullName ?? "Unknown",
          team: l.team?.name ?? "—",
          value: l.value,
        }));
      };

      hitting = await map(hrRes, "hr");
      pitching = await map(eraRes, "era");
      loading = false;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      errorMessage = "Couldn't reach the MLB Stats API just now. Try again.";
      loading = false;
    }
  }

  $effect(() => {
    if (browser) fetchSpotlight();
  });
</script>

<svelte:head>
  <title>Sabermetric Seer</title>
</svelte:head>

<div class="flex flex-col gap-8">
  <!-- Hero -->
  <Card.Root class="gap-4">
    <Card.Header>
      <Badge variant="secondary">
        <IconBallBaseball />
        My baseball sandbox
      </Badge>
      <Card.Title class="text-3xl sm:text-4xl">
        I built the box-score toy I always wanted
      </Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="max-w-3xl space-y-4 text-sm leading-relaxed">
        <p>
          My baseball brain was built by the Mariners. Rooting for that club
          teaches you a specific kind of patience &mdash; showing up year after
          year for something that rarely hands you anything, and still finding a
          nine-inning reason to keep watching. It also taught me to love the
          parts nobody else was looking at: the bullpen arms coming in from the
          minors, the defensive tweaks, the numbers that told you a season was
          going sideways long before the record agreed.
        </p>
        <p>
          Then I moved to Denver. I already had a soft spot for underdogs, and
          the Rockies turned that into a hobby &mdash; a team that can make any
          night at Coors Field feel winnable, in a park that asks completely
          different questions of every pitcher who steps on it. I stopped
          pretending I only had one team. Now I keep the Mariners heart and the
          Rockies in the same head, and I own the standings for both leagues so
          nobody can accuse me of picking favorites.
        </p>
        <p>
          <span class="font-semibold text-foreground">Sabermetric Seer</span> is
          my excuse to live inside those numbers on purpose. It reads the public
          MLB Stats API and puts the data into the three tools I keep wishing
          existed: a leaderboard for every race I follow, standings that don't
          hide run differential, and a transaction wire so I can watch a roster
          get reshuffled in real time.
        </p>
        <p class="text-muted-foreground">
          Nothing scraped, nothing paywalled, no account to make. It's the same
          feed MLB publishes &mdash; I just built the interface I wanted and left
          it running for anyone else who wants it.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button href="/sabermetric-seer/league-leaders">
          <IconTrophy />
          League Leaders
        </Button>
        <Button href="/sabermetric-seer/standings" variant="secondary">
          <IconChartInfographic />
          Standings
        </Button>
        <Button href="/sabermetric-seer/transactions" variant="outline">
          <IconCalendarEvent />
          Transactions
        </Button>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Live spotlight: proves the data is real -->
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight sm:text-2xl">
          Fresh off the wire
        </h2>
        <p class="text-muted-foreground text-sm">
          Top five in home runs and ERA for the {season} season, pulled live from
          MLB. Click any name for that player's career pop-up.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onclick={fetchSpotlight}
        disabled={loading}
      >
        Refresh
      </Button>
    </div>

    <Card.Root>
      <Tabs.Root value="hitting">
        <Card.Header class="border-b">
          <Card.Title class="text-sm">
            {season} MLB leaders &mdash; live data
          </Card.Title>
          <Tabs.List class="mt-2 w-full justify-start sm:w-fit">
            <Tabs.Trigger value="hitting">Home Runs</Tabs.Trigger>
            <Tabs.Trigger value="pitching">ERA</Tabs.Trigger>
          </Tabs.List>
        </Card.Header>

        {#if loading}
          <Card.Content class="space-y-2">
            {#each [1, 2, 3, 4, 5] as row (row)}
              <Skeleton class="h-10 w-full" />
            {/each}
          </Card.Content>
        {:else if errorMessage}
          <Card.Content>
            <div
              class="bg-destructive/10 text-destructive rounded-md border p-4 text-sm"
            >
              {errorMessage}
            </div>
          </Card.Content>
        {:else}
          {#snippet spotlight(rows: SpotlightRow[])}
            <Card.Content class="p-0">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head class="w-16">Rank</Table.Head>
                    <Table.Head>Player</Table.Head>
                    <Table.Head>Team</Table.Head>
                    <Table.Head class="text-right">Value</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each rows as row (row.id)}
                    <Table.Row>
                      <Table.Cell class="text-muted-foreground font-mono">
                        {row.rank}
                      </Table.Cell>
                      <Table.Cell>
                        <PlayerDialog
                          personId={row.personId}
                          fullName={row.player}
                        />
                      </Table.Cell>
                      <Table.Cell class="text-muted-foreground">
                        {row.team}
                      </Table.Cell>
                      <Table.Cell class="text-right font-mono font-semibold">
                        {row.value}
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </Card.Content>
          {/snippet}

          <Tabs.Content value="hitting">
            {@render spotlight(hitting)}
          </Tabs.Content>
          <Tabs.Content value="pitching">
            {@render spotlight(pitching)}
          </Tabs.Content>
        {/if}
      </Tabs.Root>
    </Card.Root>
  </section>

  <!-- Feature cards -->
  <section class="flex flex-col gap-4">
    <h2 class="text-xl font-bold tracking-tight sm:text-2xl">
      Three tools, one obsession
    </h2>
    <div class="grid gap-4 md:grid-cols-3">
      {#each FEATURES as feature (feature.title)}
        <Card.Root size="sm">
          <Card.Header>
            <Badge variant="secondary">
              <feature.icon />
              {feature.title}
            </Badge>
            <Card.Description>{feature.blurb}</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul class="text-muted-foreground space-y-2 text-sm">
              {#each feature.points as point (point)}
                <li class="flex gap-2">
                  <IconTarget
                    class="text-primary mt-0.5 size-4 shrink-0"
                  />
                  {point}
                </li>
              {/each}
            </ul>
          </Card.Content>
          <Card.Footer>
            <Button href={feature.href} variant="outline" size="sm">
              Open {feature.title}
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Under the hood -->
  <section class="flex flex-col gap-4">
    <div>
      <h2 class="text-xl font-bold tracking-tight sm:text-2xl">
        Under the hood
      </h2>
      <p class="text-muted-foreground text-sm">
        The parts of this I'm proud of, and the reasons they matter to somebody
        who just wants to read about baseball.
      </p>
    </div>

    <Accordion.Root type="multiple" class="rounded-md border px-4">
      {#each [
        {
          value: "data",
          icon: IconDatabase,
          title: "One API, zero accounts",
          body: "Every number on this site comes from MLB's public Stats API. No key, no scraping, no nightly ETL job I have to babysit. Requests are cancelled when you change a filter, so hammering the season dropdown can't make an old response land on top of a new one.",
        },
        {
          value: "sorting",
          icon: IconArrowsSort,
          title: "Tables that sort instead of decorate",
          body: "TanStack Table drives the columns, shadcn-svelte styles them. Click any header to flip between ascending and descending, so 'who is the worst on base right now' is one click away.",
        },
        {
          value: "players",
          icon: IconStack2,
          title: "Player cards on demand",
          body: "Clicking a name opens a pop-up with the bio line, the last eight seasons of hitting and pitching, and career totals underneath. It's the same card whether you got there from leaders, standings or the transaction wire.",
        },
        {
          value: "history",
          icon: IconTrophy,
          title: "Seasons back to 1919",
          body: "The leaderboards go all the way back to the season that invented the modern record book. Yes, you can sort Babe Ruth's home totals against today's, and yes, I have.",
        },
        {
          value: "modes",
          icon: IconMoonStars,
          title: "Dark mode and small screens",
          body: "The whole thing follows your system theme, and the sidebar collapses into a sheet on mobile &mdash; because most of my baseball research happens in a line where I am not supposed to be on my phone.",
        },
      ] as section (section.value)}
        <Accordion.Item value={section.value}>
          <Accordion.Trigger>
            <section.icon class="text-primary size-4" />
            {section.title}
          </Accordion.Trigger>
          <Accordion.Content>
            <p>{section.body}</p>
          </Accordion.Content>
        </Accordion.Item>
      {/each}
    </Accordion.Root>
  </section>
</div>
