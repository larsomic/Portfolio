<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import {
    IconArrowRight,
    IconCloudDataConnection,
    IconHeartRateMonitor,
    IconHistory,
    IconUsers,
    IconTrophy,
    IconApi,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { LEAGUE_ID } from "$lib/sleeper.js";

  const features = [
    {
      icon: IconUsers,
      title: "League Members",
      blurb:
        "Every owner in the league with their avatar, team name, and record. Click any card to pop open that team's full roster for any season in the league's history.",
      href: "/fantasy-football/league",
    },
    {
      icon: IconTrophy,
      title: "Weekly Scores",
      blurb:
        "A round-robin scoreboard: every owner plays every other owner each week, so the high scorer goes 9–0 and the worst goes 0–9. Pick any season and week to rewind.",
      href: "/fantasy-football/weekly-scores",
    },
    {
      icon: IconHeartRateMonitor,
      title: "Live game states",
      blurb:
        "During the NFL season, projections update against Sleeper's live state — you can see who's playing right now and how the week is shaking out.",
      href: "/fantasy-football/league",
    },
    {
      icon: IconHistory,
      title: "Season time travel",
      blurb:
        "The app walks the league's full season history automatically, so every view has a season picker. Go back and watch a former champion's roster.",
      href: "/fantasy-football/weekly-scores",
    },
  ];

  const facts = [
    { label: "Data source", value: "Sleeper API v1" },
    { label: "API key required", value: "None" },
    { label: "League ID", value: LEAGUE_ID },
    { label: "Real data?", value: "Very" },
  ];
</script>

<SEO title="Fantasy Football · Michael Larson" description="A live fantasy football dashboard powered by the Sleeper API — real league data, rosters, matchups, and weekly scores." />

<div class="relative -mx-4 -mt-4 flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
  <!-- Decorative glow -->
  <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div
      class="absolute -top-24 right-0 size-96 rounded-full bg-emerald-500 opacity-10 blur-3xl dark:opacity-20"
    ></div>
    <div
      class="absolute -left-32 top-1/3 size-80 rounded-full bg-sky-500 opacity-10 blur-3xl dark:opacity-15"
    ></div>
  </div>

  <!-- Hero -->
  <section
    class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pt-16 pb-8 text-center sm:pt-24"
  >
    <Badge variant="outline" class="gap-1.5 rounded-full px-3">
      <IconCloudDataConnection class="size-3.5 text-emerald-500" />
      Powered by live data from Sleeper
    </Badge>
    <h1
      class="max-w-3xl font-serif text-4xl leading-tight font-bold sm:text-5xl md:text-6xl"
    >
      Fantasy Football,
      <span
        class="bg-linear-to-r from-emerald-500 via-teal-400 to-sky-500 bg-clip-text text-transparent"
      >
        minus the guesswork
      </span>
    </h1>
    <p class="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
      This corner of the portfolio talks to the
      <a
        href="https://docs.sleeper.com/"
        class="font-medium text-emerald-600 underline decoration-dotted underline-offset-4 hover:opacity-80 dark:text-emerald-400"
        target="_blank"
        rel="noreferrer">Sleeper API</a
      >
      to pull <em>real</em> fantasy football data from my friends'
      head-to-head league. No mock data, no CSV exports — every roster,
      matchup, avatar, and score you see here came over the wire from
      <code
        class="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]"
      >api.sleeper.app</code
      > moments before you asked for it.
    </p>

    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <Button size="lg" href="/fantasy-football/league">
        <IconUsers class="size-4" />
        See the league
        <IconArrowRight class="size-4" />
      </Button>
      <Button size="lg" variant="outline" href="/fantasy-football/weekly-scores">
        <IconTrophy class="size-4" />
        Weekly scores
      </Button>
    </div>
  </section>

  <!-- How it works -->
  <section class="mx-auto w-full max-w-5xl px-4 py-10">
    <h2 class="mb-6 flex items-center gap-2 font-serif text-2xl font-bold">
      <IconApi class="size-6 text-sky-500" />
      How the sausage is made
    </h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">Server-side fetching</Card.Title>
          <Card.Description class="leading-relaxed">
            The pages use SvelteKit <code
              class="bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]"
            >load</code
            >
            functions that call Sleeper on the server, parse the responses
            into tidy types, and hand clean data to the components. Boring on
            purpose — which is why it feels instant.
          </Card.Description>
        </Card.Header>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">Polite caching</Card.Title>
          <Card.Description class="leading-relaxed">
            Sleeper is generous with its free API, but I still cache
            responses for a minute at a time. Rosters and members barely
            change mid-season; live scores refresh when you hit the Refresh
            button (or on visit). Be excellent to rate limits.
          </Card.Description>
        </Card.Header>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">Season archaeology</Card.Title>
          <Card.Description class="leading-relaxed">
            On load, the app discovers every season the league has played and
            rebuilds each one — matchups, rosters, results — so you can flip
            back to year one and see who the original champion was. (It was
            probably me.)
          </Card.Description>
        </Card.Header>
      </Card.Root>
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-base">Zero secrets</Card.Title>
          <Card.Description class="leading-relaxed">
            The whole thing runs on Sleeper's public endpoints — no API key,
            no OAuth dance, no backend of my own. Just fetch calls and a
            league ID hard-coded for one gloriously petty head-to-head
            league.
          </Card.Description>
        </Card.Header>
      </Card.Root>
    </div>
  </section>

  <!-- What's inside -->
  <section class="mx-auto w-full max-w-5xl px-4 py-10">
    <h2 class="mb-6 font-serif text-2xl font-bold">What's inside</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      {#each features as feature (feature.title)}
        <a href={feature.href} class="block h-full">
          <Card.Root
            class="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <Card.Header>
              <div class="flex items-center gap-2">
                <feature.icon class="size-5 text-emerald-500" />
                <Card.Title class="text-base">{feature.title}</Card.Title>
                <IconArrowRight
                  class="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1"
                />
              </div>
              <Card.Description>{feature.blurb}</Card.Description>
            </Card.Header>
          </Card.Root>
        </a>
      {/each}
    </div>
  </section>

  <!-- Facts strip -->
  <section class="mx-auto w-full max-w-5xl px-4 pt-6 pb-20">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each facts as fact (fact.label)}
        <div
          class="bg-muted/40 flex flex-col items-center gap-1 rounded-xl border p-4 text-center"
        >
          <span class="text-muted-foreground text-xs tracking-wide uppercase"
            >{fact.label}</span
          >
          <span class="font-mono text-sm font-semibold break-all"
            >{fact.value}</span
          >
        </div>
      {/each}
    </div>
    <p class="mt-10 text-center text-sm text-muted-foreground">
      Built for bragging rights that expire in February. 🏈
    </p>
  </section>
</div>
