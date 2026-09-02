<script lang="ts">
  import { browser } from "$app/environment";
  import {
    IconArrowLeft,
    IconArrowRight,
    IconArrowDown,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import PhotoFrame from "$lib/components/photo-frame.svelte";
  import PlayerCard from "$lib/components/player-card.svelte";
  import ScenePullman from "$lib/components/scenes/scene-pullman.svelte";
  import SceneSeattle from "$lib/components/scenes/scene-seattle.svelte";
  import SceneDenver from "$lib/components/scenes/scene-denver.svelte";
  import { cn } from "$lib/utils.js";
  import { PROJECTS } from "$lib/config/projects.js";

  const SCENES = [ScenePullman, SceneSeattle, SceneDenver];

  const PHOTOS = ["hike-1", "hike-2", "hike-3"];

  /** Document scroll progress, 0 → 1. */
  let progress = $state(0);

  $effect(() => {
    if (!browser) return;
    const update = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  });

  /** Continuous scene index (0 = Pullman … 2 = Denver). */
  const sceneIndex = $derived(progress * (SCENES.length - 1));

  function opacityFor(i: number): number {
    return Math.max(0, Math.min(1, 1 - Math.abs(sceneIndex - i)));
  }

  // ---- Projects carousel (Denver) ----
  let track: HTMLElement | undefined = $state();

  function nudge(direction: 1 | -1) {
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({
      left: direction * amount,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "auto"
        : "smooth",
    });
  }

  function sectionLabelClass() {
    return "border-white/25 bg-black/35 text-white backdrop-blur";
  }
</script>

<svelte:head>
  <title>Michael Larson · Software Engineer</title>
</svelte:head>

<!-- Fixed scene backgrounds that crossfade as you travel down the page -->
<div class="fixed inset-0" aria-hidden="true">
  {#each SCENES as Scene, i (i)}
    <div
      class="absolute inset-0"
      style="opacity: {opacityFor(i)}; transform: translateY({(sceneIndex - i) * -24}px);"
    >
      <Scene />
    </div>
  {/each}
  <!-- Contrast scrim so text stays readable over the illustrations -->
  <div class="absolute inset-0 bg-linear-to-b from-black/30 via-black/5 to-black/40"></div>
</div>

<div class="-mx-4 flex flex-col">
  <!-- STOP 1 · PULLMAN — intro + player card -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-10 px-4 py-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-12"
  >
    <div
      class="flex max-w-xl flex-col items-center gap-6 text-center lg:items-start lg:text-left"
    >
      <Badge variant="outline" class={sectionLabelClass()}>
        📍 The Palouse · Pullman, Washington
      </Badge>
      <h1
        class="drop-shadow-lg font-serif text-4xl leading-tight font-bold text-white sm:text-5xl"
      >
        Building data-driven things for the web.
      </h1>
      <p
        class="drop-shadow-md text-base leading-relaxed text-white/90 sm:text-lg"
      >
        I'm Michael — a software engineer who ships sports-stats apps today
        and wants to break into finance experiments next. Scroll to travel
        the road from wheat fields to peaks, and meet the projects along the
        way.
      </p>

      <div class="mt-4 lg:hidden">
        <PlayerCard />
      </div>
    </div>

    <div class="hidden lg:block">
      <PlayerCard />
    </div>

    <!-- Scroll-to-travel hint -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 text-white/90"
      style="opacity: {Math.max(0, 1 - progress * 12)};"
    >
      <span class="text-xs font-medium tracking-wide">Scroll to travel</span>
      <IconArrowDown class="size-5 animate-bounce" />
    </div>
  </section>

  <!-- STOP 2 · SEATTLE — off the field -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-6 px-4 py-24 lg:px-12"
  >
    <Badge variant="outline" class={cn(sectionLabelClass(), "w-fit")}>
      📍 Puget Sound · Seattle, Washington
    </Badge>
    <div>
      <h2
        class="drop-shadow-lg font-serif text-3xl font-bold text-white"
      >
        Off the Field
      </h2>
      <p class="drop-shadow-md mt-1 text-sm text-white/85">
        When the laptop closes, the trails open up — from Palouse coulees to
        Cascadia.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      {#each PHOTOS as name (name)}
        <div
          class="overflow-hidden rounded-xl border shadow-lg"
          style="aspect-ratio: 3 / 2;"
        >
          <PhotoFrame
            src={`/images/${name}.jpg`}
            alt="Hiking photo"
            hint={`static/images/${name}.jpg`}
          />
        </div>
      {/each}
    </div>
  </section>

  <!-- STOP 3 · DENVER — the projects -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-6 px-4 py-24 lg:px-12"
  >
    <Badge variant="outline" class={cn(sectionLabelClass(), "w-fit")}>
      📍 The Rockies · Denver, Colorado
    </Badge>
    <div>
      <h2
        class="drop-shadow-lg font-serif text-3xl font-bold text-white"
      >
        The Statsheet
      </h2>
      <p class="drop-shadow-md mt-1 text-sm text-white/85">
        Things I've built — sports now, more leagues later. Slide through
        them.
      </p>
    </div>

    <div class="relative">
      <button
        class="bg-black/30 hover:bg-black/50 absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full p-2 text-white backdrop-blur transition"
        aria-label="Previous projects"
        onclick={() => nudge(-1)}
      >
        <IconArrowLeft class="size-5" />
      </button>

      <div
        bind:this={track}
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto p-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {#each PROJECTS as project (project.title)}
          {@const soon = project.status === "soon"}
          <div
            class="w-[85%] shrink-0 snap-center sm:w-[340px] lg:w-[380px]"
          >
            <a
              href={soon ? undefined : project.slug}
              class={soon ? "pointer-events-none" : ""}
            >
              <Card.Root
                class={cn(
                  "h-full transition-shadow hover:shadow-xl",
                  soon && "opacity-60",
                )}
              >
                <Card.Header>
                  <div class="flex items-center justify-between gap-2">
                    <Card.Title class="text-lg">
                      {project.title}
                    </Card.Title>
                    {#if !soon}
                      <IconArrowRight
                        class="text-muted-foreground size-4 shrink-0"
                      />
                    {/if}
                  </div>
                  <Card.Description>
                    {project.description}
                  </Card.Description>
                </Card.Header>
                <Card.Footer class="gap-1.5">
                  {#each project.tags as tag (tag)}
                    <Badge
                      variant={tag === "soon" ? "destructive" : "secondary"}
                    >
                      {tag}
                    </Badge>
                  {/each}
                </Card.Footer>
              </Card.Root>
            </a>
          </div>
        {/each}
      </div>

      <button
        class="bg-black/30 hover:bg-black/50 absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full p-2 text-white backdrop-blur transition"
        aria-label="Next projects"
        onclick={() => nudge(1)}
      >
        <IconArrowRight class="size-5" />
      </button>
    </div>

    <p
      class="text-center text-xs text-white/70"
      style="opacity: {Math.min(1, Math.max(0, (sceneIndex - 1.6) * 2))};"
    >
      End of the road — for now. Next stop is wherever the work goes. 🏔️
    </p>
  </section>
</div>
