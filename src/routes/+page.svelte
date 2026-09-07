<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import { browser } from "$app/environment";
  import {
    IconArrowLeft,
    IconArrowRight,
    IconArrowDown,
    IconBrandGithub,
    IconBrandLinkedin,
    IconFileDownload,
    IconSend2,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import PhotoFrame from "$lib/components/photo-frame.svelte";
  import PlayerCard from "$lib/components/player-card.svelte";
  import ScenePullman from "$lib/components/scenes/scene-pullman.svelte";
  import SceneSeattle from "$lib/components/scenes/scene-seattle.svelte";
  import SceneDenver from "$lib/components/scenes/scene-denver.svelte";
  import { cn } from "$lib/utils.js";
  import { PROJECTS, LIVE_PROJECTS } from "$lib/config/projects.js";

  const SCENES = [ScenePullman, SceneSeattle, SceneDenver];

  /** Keyword chips for the at-a-glance scan. Keep in sync with the stack page. */
  const STACK = [
    "SvelteKit",
    "TypeScript",
    "shadcn-svelte",
    "TanStack Table",
    "Python",
    "SQL",
  ];

  /**
   * Off-the-clock reel. None of these are trails yet — drop the real shots in
   * static/images/ and update src / alt / caption per slot. Three slots, one
   * per grid tile; add or remove freely.
   */
  const OFF_CLOCK = [
    {
      src: "/images/hike-2.webp",
      alt: "The Seattle skyline from Elliott Bay, the Space Needle on the left",
      caption: "Elliott Bay, one more time",
    },
    {
      src: "/images/hike-3.webp",
      alt: "Broncos game at Empower Field at dusk, seen from the upper deck",
      caption: "Section 612, losing voice",
    },
    {
      // Yes, this one is a warehouse-store cart. It earns its slot back the day
      // there's a photo of an actual summit in it.
      src: "/images/hike-1.webp",
      alt: "A red-handled shopping cart inside a warehouse store",
      caption: "The fuel run, unglamorous",
    },
  ];

  const CONTACTS = [
    {
      icon: IconSend2,
      label: "Contact me",
      // In-app route: the contact page's form does the sending, so no address
      // gets scraped out of the markup.
      href: "/contact-me",
      handle: false,
      primary: true,
    },
    {
      icon: IconBrandGithub,
      label: "GitHub",
      href: "https://github.com/larsomic",
      handle: "@larsomic",
      primary: false,
    },
    {
      icon: IconBrandLinkedin,
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/larson2/",
      handle: "in/larson2",
      primary: false,
    },
    {
      icon: IconFileDownload,
      label: "Résumé",
      href: "/Michael-Larson-Resume.pdf",
      handle: "PDF",
      primary: false,
    },
  ];

  /** Document scroll progress, 0 → 1. */
  let progress = $state(0);

  $effect(() => {
    if (!browser) return;
    // Coalesce scroll/resize events into one rAF tick so the crossfade math
    // runs at most once per frame instead of once per event.
    let queued = false;
    const update = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  });

  /** Continuous scene index (0 = Pullman … 2 = Denver). */
  const sceneIndex = $derived(progress * (SCENES.length - 1));

  function opacityFor(i: number): number {
    return Math.max(0, Math.min(1, 1 - Math.abs(sceneIndex - i)));
  }

  // ---- Projects carousel (Denver) ----
  let track: HTMLElement | undefined = $state();
  let canPrev = $state(false);
  let canNext = $state(true);

  function measure() {
    if (!track) return;
    canPrev = track.scrollLeft > 8;
    canNext = track.scrollLeft + track.clientWidth < track.scrollWidth - 8;
  }

  $effect(() => {
    if (!track) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  });

  function nudge(direction: 1 | -1) {
    if (!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({
      left: direction * amount,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  function sectionLabelClass() {
    return "border-white/25 bg-black/35 text-white backdrop-blur";
  }

</script>

<SEO title="Michael Larson · Software Engineer" description="Interactive data explorers built with SvelteKit and Svelte 5 — MLB stats, fantasy football, NCAA tournament history, Colorado open data, and US Census comparisons. Built by software engineer Michael Larson." />


<!-- Fixed scene backgrounds that crossfade as you travel down the page -->
<div class="fixed inset-0" aria-hidden="true">
  {#each SCENES as Scene, i (i)}
    <!-- visibility:hidden keeps fully-transparent scenes out of the paint
         tree — three full-screen SVGs don't need compositing every frame -->
    <div
      class="absolute inset-0"
      style="opacity: {opacityFor(i)}; transform: translateY({(sceneIndex - i) * -24}px); visibility: {opacityFor(i) > 0 ? "visible" : "hidden"};"
    >
      <Scene />
    </div>
  {/each}
  <!-- Contrast scrim so text stays readable over the illustrations -->
  <div class="absolute inset-0 bg-linear-to-b from-black/30 via-black/5 to-black/40"></div>
</div>

<div class="-mx-4 flex flex-col">
  <!-- STOP 1 · PULLMAN — Mile 0: who you are, and the card that says it twice -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-10 px-4 py-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-12"
  >
    <div
      class="flex max-w-xl flex-col items-center gap-6 text-center lg:items-start lg:text-left"
    >
      <Badge variant="outline" class={sectionLabelClass()}>
        📍 Mile 0 · The Palouse, Washington
      </Badge>
      <h1
        class="drop-shadow-lg font-serif text-4xl leading-tight font-bold text-white sm:text-5xl"
      >
        I build the stats pages I wish existed.
      </h1>
      <p
        class="drop-shadow-md text-base leading-relaxed text-white/90 sm:text-lg"
      >
        I'm Michael — a software engineer in Denver who spends Saturdays
        turning public data into things you can actually poke at: tonight's
        MLB board, my fantasy league's scoreboard, eighty years of March
        Madness. Every page on this site is hand-rolled Svelte pointed
        straight at a real API.
      </p>

      <!-- Keyword chips: the six-month scan a hiring manager actually does -->
      <div
        class="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start"
      >
        {#each STACK as tool (tool)}
          <Badge
            variant="outline"
            class={cn(sectionLabelClass(), "font-mono text-[10px]")}>{tool}</Badge>
        {/each}
      </div>

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
      <IconArrowDown class="size-5 motion-safe:animate-bounce" />
    </div>
  </section>

  <!-- STOP 2 · SEATTLE — off the clock, in case that's surprising -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-6 px-4 py-24 lg:px-12"
  >
    <!-- Featured waterfront photo with the title overlaid, like a postcard -->
    <div
      class="group relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl"
      style="aspect-ratio: 16 / 9; max-height: 58vh;"
    >
      <PhotoFrame
        src="/images/seattle-waterfront.webp"
        alt="The Seattle Great Wheel at Pier 57 with the downtown skyline over Elliott Bay"
        hint="static/images/seattle-waterfront.jpg"
        className="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
      />
      <!-- Scrim so the overlaid text stays legible -->
      <div
        class="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent"
      ></div>
      <div
        class="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-6 sm:p-10"
      >
        <Badge variant="outline" class={sectionLabelClass()}>
          🥾 Off the Clock · Denver &amp; wherever the trailhead is
        </Badge>
        <h2
          class="drop-shadow-lg font-serif text-3xl font-bold text-white sm:text-4xl"
        >
          Same curiosity, worse altitude
        </h2>
        <p
          class="drop-shadow-md max-w-xl text-sm leading-relaxed text-white/85 sm:text-base"
        >
          Off the laptop it's climbs I keep overestimating, a stadium seat
          when the Broncos play, and a lot of time in airports. The curiosity
          is the same one that shows up in the code.
        </p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      {#each OFF_CLOCK as shot (shot.src)}
        <div
          class="group relative overflow-hidden rounded-xl border border-white/20 shadow-lg transition-shadow hover:shadow-2xl"
          style="aspect-ratio: 3 / 2;"
        >
          <PhotoFrame
            src={shot.src}
            alt={shot.alt}
            hint={`static/images/${shot.src.split("/").pop()}`}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          <div
            class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3"
          >
            <span
              class="drop-shadow-md font-serif text-xs italic text-white sm:text-sm"
            >
              {shot.caption}
            </span>
          </div>
        </div>
      {/each}
    </div>

    <p class="text-center text-xs text-white/70">
      These three are stand-ins. The real reel shows up the day I stop
      carrying a camera on hikes.
    </p>
  </section>

  <!-- STOP 3 · DENVER — the work, and how to reach me -->
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
        {LIVE_PROJECTS.length} live explorers, each hand-rolled and pointed at
        one public dataset. Slide through them — they're all working.
      </p>
    </div>

    <div class="relative">
      <button
        class="bg-black/30 hover:bg-black/50 absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full p-2 text-white backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-25"
        aria-label="Previous projects"
        disabled={!canPrev}
        onclick={() => nudge(-1)}
      >
        <IconArrowLeft class="size-5" />
      </button>

      <div
        bind:this={track}
        onscroll={measure}
        role="region"
        aria-label="Project carousel"
        class="flex snap-x snap-mandatory gap-4 overflow-x-auto p-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {#each PROJECTS as project (project.title)}
          {@const soon = project.status === "soon"}
          <div
            class="w-[85%] shrink-0 snap-center sm:w-[340px] lg:w-[380px]"
          >
            {#if soon}
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
                    <Badge variant="destructive">soon</Badge>
                  </div>
                  <Card.Description>
                    {project.description}
                  </Card.Description>
                </Card.Header>
                <Card.Footer class="gap-1.5">
                  {#if project.source}
                    <Badge
                      variant="outline"
                      class="font-mono text-[10px]">{project.source}</Badge>
                  {/if}
                  {#each project.tags as tag (tag)}
                    <Badge variant="secondary">
                      {tag}
                    </Badge>
                  {/each}
                </Card.Footer>
              </Card.Root>
            {:else}
              <a href={project.slug}>
                <Card.Root
                  class="h-full transition-shadow hover:shadow-xl"
                >
                  <Card.Header>
                    <div class="flex items-center justify-between gap-2">
                      <Card.Title class="text-lg">
                        {project.title}
                      </Card.Title>
                      <IconArrowRight
                        class="text-muted-foreground size-4 shrink-0"
                      />
                    </div>
                    <Card.Description>
                      {project.description}
                    </Card.Description>
                  </Card.Header>
                  <Card.Footer class="gap-1.5">
                    {#if project.source}
                      <Badge
                        variant="outline"
                        class="font-mono text-[10px]">{project.source}</Badge>
                    {/if}
                    {#each project.tags as tag (tag)}
                      <Badge variant="secondary">
                        {tag}
                      </Badge>
                    {/each}
                  </Card.Footer>
                </Card.Root>
              </a>
            {/if}
          </div>
        {/each}
      </div>

      <button
        class="bg-black/30 hover:bg-black/50 absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full p-2 text-white backdrop-blur transition disabled:cursor-not-allowed disabled:opacity-25"
        aria-label="Next projects"
        disabled={!canNext}
        onclick={() => nudge(1)}
      >
        <IconArrowRight class="size-5" />
      </button>
    </div>

    <!-- End of the road: an actual destination, not a vibe -->
    <div
      class="relative mt-4 overflow-hidden rounded-2xl border border-white/20 bg-linear-to-br from-black/60 via-black/45 to-black/60 p-6 shadow-2xl backdrop-blur sm:p-8"
    >
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-xl">
          <h3
            class="drop-shadow-lg font-serif text-2xl font-bold text-white sm:text-3xl"
          >
            Last stop. Say hi.
          </h3>
          <p
            class="mt-2 text-sm leading-relaxed text-white/85 sm:text-base"
          >
            Got a dataset, a role, or an argument about my fantasy board?
            Send it through the form and I'll get back to you faster than I
            answer anything else — and I read all of it.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          {#each CONTACTS as c (c.href)}
            <a
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noreferrer" : undefined}
            >
              <Button variant={c.primary ? "default" : "outline"}>
                <c.icon class="size-4" />
                {c.label}
                {#if c.handle}
                  <span
                    class="text-muted-foreground hidden text-xs sm:inline"
                  >
                    · {c.handle}
                  </span>
                {/if}
              </Button>
            </a>
          {/each}
        </div>
      </div>

      <p
        class="mt-6 text-center text-xs text-white/70"
        style="opacity: {Math.min(1, Math.max(0.35, (sceneIndex - 1.6) * 2))};"
      >
        End of the road — for now. The next stop gets added when the data's
        worth publishing. 🏔️
      </p>
    </div>
  </section>
</div>
