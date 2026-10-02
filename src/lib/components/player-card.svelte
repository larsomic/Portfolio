<script lang="ts">
  import { IconArrowsExchange } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import PhotoFrame from "$lib/components/photo-frame.svelte";
  import { LIVE_PROJECTS } from "$lib/config/projects.js";

  let flipped = $state(false);

  // ---- Holographic hover: cursor-tracked 3D tilt + foil glare ----
  let tiltX = $state(0);
  let tiltY = $state(0);
  let glareX = $state(50);
  let glareY = $state(50);
  let hovering = $state(false);
  const MAX_TILT = 9;

  function onMove(e: PointerEvent) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0 (left) .. 1 (right)
    const py = (e.clientY - r.top) / r.height; // 0 (top) .. 1 (bottom)
    tiltY = (px - 0.5) * 2 * MAX_TILT;
    tiltX = -(py - 0.5) * 2 * MAX_TILT;
    glareX = px * 100;
    glareY = py * 100;
    hovering = true;
  }

  function onLeave() {
    hovering = false;
    tiltX = 0;
    tiltY = 0;
    glareX = 50;
    glareY = 50;
  }

  /**
   * Career splits, not self-assessed skill bars. Every row is pulled from the
   * résumé page (or counted off the live project list) so it can't drift into
   * fiction. Keep it that way when you edit.
   */
  const SPLITS = [
    { split: "Seasons shipping code", value: "2021 → today" },
    { split: "Day job", value: "SE 2 @ Comcast" },
    { split: "Daily users on a portal I built", value: "3,000+" },
    { split: "Apps in this portfolio", value: `${LIVE_PROJECTS.length}` },
    {
      // Derived from the project config so it can't drift when projects change.
      split: "Public datasets wrangled",
      value: `${new Set(LIVE_PROJECTS.map((p) => p.source)).size}`,
    },
    { split: "WSU hackathon", value: "2nd place" },
  ];
</script>

<div class="flex flex-col items-center gap-4">
  <div
    role="group"
    aria-label="Michael Larson trading card"
    class="relative w-64 select-none sm:w-72"
    style="aspect-ratio: 5 / 7; perspective: 1200px;"
    onpointermove={onMove}
    onpointerleave={onLeave}
  >
    <!-- tilt layer: leans toward the cursor -->
    <div
      class="h-full w-full"
      style="transform-style: preserve-3d; transform: rotateX({tiltX}deg) rotateY({tiltY}deg); transition: transform {hovering ? '80ms' : '400ms'} ease-out;"
    >
      <!-- flip layer -->
      <div
        class="h-full w-full transition-transform duration-700 motion-reduce:transition-none"
        style="transform-style: preserve-3d; transform: rotateY({flipped ? 180 : 0}deg);"
      >
      <!-- FRONT -->
      <div
        class="absolute inset-0 rounded-xl p-[10px] shadow-2xl"
        style="backface-visibility: hidden; background: linear-gradient(150deg, #d4a017 0%, #8a6d1d 35%, #f5d67b 55%, #8a6d1d 75%, #d4a017 100%);"
        aria-hidden={flipped ? true : undefined}
      >
        <div
          class="relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-card"
        >
          <div class="relative flex-[3]">
            <!-- TODO(Michael): replace with a real portrait — the file in
                 static/images right now is a bowl of fruit. Ship a headshot
                 before sending this link to anyone you want to hire you. -->
            <PhotoFrame
              src="/images/card.webp"
              alt="Michael Larson"
              hint="static/images/card.webp"
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
              Software Engineer 2 · Comcast
            </p>
            <p class="text-muted-foreground mt-1 text-[11px] italic">
              Denver, Colorado — built on public data
            </p>
          </div>

          <!-- foil glare: a soft highlight that tracks the cursor -->
          <div
            class="pointer-events-none absolute inset-0 z-20 rounded-lg transition-opacity duration-200"
            style="opacity: {hovering && !flipped ? 1 : 0}; background: radial-gradient(circle at {glareX}% {glareY}%, rgba(255,255,255,0.45), rgba(255,255,255,0) 45%); mix-blend-mode: soft-light;"
          ></div>
          <!-- holographic sheen: rainbow band that shifts with the cursor -->
          <div
            class="pointer-events-none absolute inset-0 z-20 rounded-lg transition-opacity duration-200"
            style="opacity: {hovering && !flipped ? 0.4 : 0}; background: linear-gradient(115deg, transparent 25%, rgba(255,0,153,0.5), rgba(0,221,255,0.5), rgba(123,255,0,0.5), transparent 75%); background-size: 200% 200%; background-position: {glareX}% {glareY}%; mix-blend-mode: color-dodge;"
          ></div>
        </div>
      </div>

      <!-- BACK -->
      <div
        class="absolute inset-0 rounded-xl p-[10px] shadow-2xl"
        style="backface-visibility: hidden; transform: rotateY(180deg); background: linear-gradient(150deg, #d4a017 0%, #8a6d1d 35%, #f5d67b 55%, #8a6d1d 75%, #d4a017 100%);"
        aria-hidden={flipped ? undefined : true}
      >
        <div
          class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-card p-4"
        >
          <h4
            class="font-serif text-center text-sm font-bold tracking-[0.25em] uppercase"
          >
            Career Splits
          </h4>
          <dl class="mt-3 space-y-1.5">
            {#each SPLITS as row (row.split)}
              <div
                class="flex items-baseline justify-between gap-2 border-b border-dashed text-[11px] last:border-0"
              >
                <dt class="text-muted-foreground shrink-0">{row.split}</dt>
                <dd class="font-mono text-right font-semibold tabular-nums">
                  {row.value}
                </dd>
              </div>
            {/each}
          </dl>

          <p
            class="text-muted-foreground mt-4 flex-1 text-[11px] leading-relaxed"
          >
            Weekdays: production React, Terraform, and SQL at Comcast.
            Saturdays: whatever the public APIs let me build. Same care either
            way — no self-rated skill bars, just numbers somebody else can check.
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
  </div>

  <Button
    variant="outline"
    size="sm"
    class="bg-background/90 shadow-md backdrop-blur"
    onclick={() => (flipped = !flipped)}
  >
    <IconArrowsExchange class="size-4" />
    {flipped ? "Back to card front" : "Flip for scouting report"}
  </Button>
</div>
