<script lang="ts">
  import { IconArrowsExchange } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import PhotoFrame from "$lib/components/photo-frame.svelte";

  let flipped = $state(false);

  const REPORT = [
    { tool: "Svelte / TypeScript", rating: 80 },
    { tool: "API Integration", rating: 75 },
    { tool: "Python & Data", rating: 70 },
    { tool: "Charts & Viz", rating: 70 },
    { tool: "Trail Stamina", rating: 55 },
  ];
</script>

<div class="flex flex-col items-center gap-4">
  <div class="relative w-64 sm:w-72" style="aspect-ratio: 5 / 7;">
    <div
      class="h-full w-full transition-transform duration-700"
      style="transform-style: preserve-3d; transform: perspective(1200px) rotateY({flipped ? 180 : 0}deg);"
    >
      <!-- FRONT -->
      <div
        class="absolute inset-0 rounded-xl p-[10px] shadow-2xl"
        style="backface-visibility: hidden; background: linear-gradient(150deg, #d4a017 0%, #8a6d1d 35%, #f5d67b 55%, #8a6d1d 75%, #d4a017 100%);"
        role="img"
        aria-label="Michael Larson player card"
      >
        <div
          class="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-card"
        >
          <div class="relative flex-[3]">
            <PhotoFrame
              src="/images/card.jpg"
              alt="Michael Larson"
              hint="static/images/card.jpg"
            />
            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-black/60 to-transparent"
            >
            </div>
            <span
              class="absolute left-2 top-2 rounded-sm bg-black/45 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-amber-200 uppercase"
            >
              '26 Rookie Issue
            </span>
          </div>

          <div class="relative flex-[2] flex flex-col justify-center gap-1 p-4">
            <span
              class="absolute top-3 right-3 font-mono text-[9px] tracking-widest text-muted-foreground uppercase"
            >
              No. 01
            </span>
            <h3 class="font-serif text-2xl leading-tight font-bold">
              Michael Larson
            </h3>
            <p class="text-primary text-xs font-semibold tracking-wide uppercase">
              Software Engineer
            </p>
            <p class="text-muted-foreground mt-1 text-[11px] italic">
              From the Palouse, via Puget Sound
            </p>
          </div>
        </div>
      </div>

      <!-- BACK -->
      <div
        class="absolute inset-0 rounded-xl p-[10px] shadow-2xl"
        style="backface-visibility: hidden; transform: rotateY(180deg); background: linear-gradient(150deg, #d4a017 0%, #8a6d1d 35%, #f5d67b 55%, #8a6d1d 75%, #d4a017 100%);"
      >
        <div
          class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-card p-4"
        >
          <h4
            class="font-serif text-center text-sm font-bold tracking-[0.25em] uppercase"
          >
            Scouting Report
          </h4>
          <div class="mt-3 space-y-2">
            {#each REPORT as row (row.tool)}
              <div class="flex items-center gap-2 text-[11px]">
                <span class="w-32 shrink-0 font-medium">{row.tool}</span>
                <span
                  class="bg-muted relative h-2 flex-1 overflow-hidden rounded-full"
                >
                  <span
                    class="bg-primary absolute inset-y-0 left-0 rounded-full"
                    style="width: {row.rating}%;"
                  ></span>
                </span>
                <span
                  class="text-muted-foreground w-6 text-right font-mono tabular-nums"
                >
                  {row.rating}
                </span>
              </div>
            {/each}
          </div>

          <p
            class="text-muted-foreground mt-4 flex-1 text-[11px] leading-relaxed"
          >
            Builds data-driven apps for the web — sports stats today, finance
            experiments next. Ships fast, refactors honestly. When the laptop
            closes, you'll find him on a Colorado trail looking up at peaks.
          </p>
          <p
            class="text-muted-foreground text-right font-serif text-sm italic"
          >
            — M. Larson
          </p>
        </div>
      </div>
    </div>
  </div>

  <Button variant="outline" size="sm" onclick={() => (flipped = !flipped)}>
    <IconArrowsExchange class="size-4" />
    {flipped ? "Back to card front" : "Flip for scouting report"}
  </Button>
</div>
