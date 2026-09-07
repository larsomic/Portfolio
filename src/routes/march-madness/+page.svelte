<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import {
    IconArrowRight,
    IconBallBasketball,
    IconUmbrella2,
    IconTrophy,
    IconSwords,
    IconCalendarStar,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  const pages = [
    {
      icon: IconTrophy,
      title: "Road to the Championship",
      blurb:
        "Pick any season back to 1939 and replay the whole bracket — First Four through the title game, with seeds, scores, venues, attendance, and Elo swings on every game.",
      href: "/march-madness/tournament",
    },
    {
      icon: IconUmbrella2,
      title: "The Cinderella Tracker",
      blurb:
        "Eighty-six seasons of upset math: which seed matchups are the most dangerous, how double-digit seeds fare year by year, the 25 biggest shocks ever, and Final Four royalty.",
      href: "/march-madness/cinderella",
    },
  ];

  const facts = [
    { label: "Seasons available", value: "1939 → today" },
    { label: "Data source", value: "College Basketball Data" },
    { label: "Games per bracket", value: "~67" },
    { label: "Hot takes included", value: "0 (math only)" },
  ];
</script>

<SEO title="March Madness · Michael Larson" description="NCAA tournament history and upset analysis, powered by the College Basketball Data API." />

<div class="relative -mx-4 -mt-4 flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
  <!-- Decorative glow -->
  <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div
      class="absolute -top-24 left-1/4 size-96 rounded-full bg-orange-500 opacity-10 blur-3xl dark:opacity-20"
    ></div>
    <div
      class="absolute top-1/3 right-0 size-80 rounded-full bg-indigo-500 opacity-10 blur-3xl dark:opacity-15"
    ></div>
  </div>

  <!-- Hero -->
  <section
    class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pt-16 pb-8 text-center sm:pt-24"
  >
    <Badge variant="outline" class="gap-1.5 rounded-full px-3">
      <IconBallBasketball class="size-3.5 text-orange-500" />
      Real brackets, real history, real pain
    </Badge>
    <h1
      class="max-w-3xl font-serif text-4xl leading-tight font-bold sm:text-5xl md:text-6xl"
    >
      March Madness,
      <span
        class="bg-linear-to-r from-orange-500 via-amber-400 to-indigo-500 bg-clip-text text-transparent"
      >
        decoded
      </span>
    </h1>
    <p class="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
      Every year I fill out a bracket. Every year a 15-seed ruins my
      afternoon. So instead of blaming the court, I hooked this page up to
      the
      <a
        href="https://collegebasketballdata.com"
        class="font-medium text-orange-600 underline decoration-dotted underline-offset-4 hover:opacity-80 dark:text-orange-400"
        target="_blank"
        rel="noreferrer">College Basketball Data API</a
      >
      — tournament games going all the way back to <strong>1939</strong>, with
      seeds, scores, Elo ratings, venues, and attendance. Now I lose on
      purpose.
    </p>

    <div class="mt-2 flex flex-wrap justify-center gap-3">
      <Button size="lg" href="/march-madness/tournament">
        <IconTrophy class="size-4" />
        Browse the brackets
        <IconArrowRight class="size-4" />
      </Button>
      <Button size="lg" variant="outline" href="/march-madness/cinderella">
        <IconUmbrella2 class="size-4" />
        Track Cinderella
      </Button>
    </div>
  </section>

  <!-- What's inside -->
  <section class="mx-auto w-full max-w-5xl px-4 py-10">
    <h2 class="mb-6 flex items-center gap-2 font-serif text-2xl font-bold">
      <IconCalendarStar class="size-6 text-indigo-500" />
      What's inside
    </h2>
    <div class="grid gap-4 sm:grid-cols-2">
      {#each pages as page (page.title)}
        <a href={page.href} class="block h-full">
          <Card.Root
            class="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <Card.Header>
              <div class="flex items-center gap-2">
                <page.icon class="size-5 text-orange-500" />
                <Card.Title class="text-base">{page.title}</Card.Title>
                <IconArrowRight
                  class="text-muted-foreground ml-auto size-4 shrink-0 transition-transform group-hover:translate-x-1"
                />
              </div>
              <Card.Description>{page.blurb}</Card.Description>
            </Card.Header>
          </Card.Root>
        </a>
      {/each}
    </div>
  </section>

  <!-- Fun facts strip -->
  <section class="mx-auto w-full max-w-5xl px-4 pb-20 pt-6">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {#each facts as fact (fact.label)}
        <div
          class="bg-muted/40 flex flex-col items-center gap-1 rounded-xl border p-4 text-center"
        >
          <span class="text-muted-foreground text-xs tracking-wide uppercase"
            >{fact.label}</span
          >
          <span class="font-mono text-sm font-semibold">{fact.value}</span>
        </div>
      {/each}
    </div>
    <p class="mt-10 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
      <IconSwords class="size-4" />
      Warning: the Cinderella Tracker contains knowledge that will make you
      insufferable at your next bracket party. 🏀
    </p>
  </section>
</div>
