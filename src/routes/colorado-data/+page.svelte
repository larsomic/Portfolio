<script lang="ts">
  import { IconArrowRight, IconDatabase } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";

  const TOOLS = [
    {
      title: "Denver Traffic Accidents",
      slug: "/denver-accidents",
      description:
        "Every reported traffic accident in Denver for any day, plotted on an interactive map. Red markers are fatal crashes.",
      dataset: "Denver Police Department — cpwf-cznk",
    },
    {
      title: "Cannabis Economy",
      slug: "/colorado-data/cannabis-economy",
      description:
        "Colorado's legal marijuana market since Dec 2014: monthly sales by county, the rise of retail over medical, and an animated race up the county leaderboard.",
      dataset: "Colorado Dept. of Revenue — j7a3-jgd3",
    },
    {
      title: "Crime in Colorado",
      slug: "/colorado-data/crime",
      description:
        "Every NIBRS incident reported by Colorado law enforcement, 2016–2024 — trends by agency and offense, plus weekday, seasonal, and hour-of-day patterns.",
      dataset: "Colorado Bureau of Investigation — j6g4-gayk",
    },
    {
      title: "Bike & Ped Counts",
      slug: "/colorado-data/bike-counts",
      description:
        "Where Coloradans work out: every bicycle and pedestrian CDOT counted, 2009–2015, sized by volume on a statewide map.",
      dataset: "CDOT — q2qp-xhnj",
    },
  ];
</script>

<svelte:head>
  <title>Colorado Data | Projects</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Colorado Data</h1>
    <p class="text-muted-foreground max-w-2xl">
      Interactive explorations of open Colorado datasets from
      <a
        href="https://data.colorado.gov"
        class="underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-inherit"
        target="_blank"
        rel="noopener noreferrer">data.colorado.gov</a>.
      Pick a tool below.
    </p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#each TOOLS as tool (tool.slug)}
      <Card.Root class="flex flex-col">
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            {tool.title}
          </Card.Title>
          <Card.Description>{tool.description}</Card.Description>
        </Card.Header>
        <Card.Content class="mt-auto">
          <p class="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs">
            <IconDatabase class="size-3.5" />
            {tool.dataset}
          </p>
          <a
            href={tool.slug}
            class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors">
            Open tool
            <IconArrowRight class="size-4" />
          </a>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
