<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import { browser } from "$app/environment";
  import {
    IconArrowLeft,
    IconArrowRight,
    IconArrowDown,
    IconBrandGithub,
    IconBrandLinkedin,
    IconCircleCheck,
    IconFileDownload,
    IconSend2,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import PlayerCard from "$lib/components/player-card.svelte";
  import ScenePullman from "$lib/components/scenes/scene-pullman.svelte";
  import SceneSeattle from "$lib/components/scenes/scene-seattle.svelte";
  import SceneDenver from "$lib/components/scenes/scene-denver.svelte";
  import Birds from "$lib/components/scenes/birds.svelte";
  import { cn } from "$lib/utils.js";
  import { PROJECTS, LIVE_PROJECTS } from "$lib/config/projects.js";

  const SCENES = [ScenePullman, SceneSeattle, SceneDenver];

  /** Keyword chips for the at-a-glance scan. Keep in sync with the stack page. */
  const STACK = [
    "SvelteKit",
    "TypeScript",
    "Server endpoints",
    "TanStack Table",
    "SQL",
    "Vitest",
  ];

  /** A few live apps surfaced in the hero so the work is visible immediately,
      without waiting for the scroll down to the Denver carousel. */
  const PEEK = ["Sabermetric Seer", "Market Pulse", "Fantasy Football"]
    .map((t) => LIVE_PROJECTS.find((p) => p.title === t))
    .filter((p): p is (typeof LIVE_PROJECTS)[number] => p !== undefined);
  const PEEK_MORE = LIVE_PROJECTS.length - PEEK.length;

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

  // ---- Trip nav: the road-trip route drawn down the edge ----
  /** Which stop is currently centered (0 Pullman · 1 Seattle · 2 Denver). */
  const activeStop = $derived(Math.round(sceneIndex));

  const STOPS = [
    { label: "Pullman", id: "" },
    { label: "Seattle", id: "seattle" },
    { label: "Denver", id: "projects" },
  ];

  function prefersReduced(): boolean {
    return (
      browser && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function scrollToStop(i: number) {
    if (!browser) return;
    const behavior: ScrollBehavior = prefersReduced() ? "auto" : "smooth";
    if (!STOPS[i].id) {
      window.scrollTo({ top: 0, behavior });
      return;
    }
    document
      .getElementById(STOPS[i].id)
      ?.scrollIntoView({ behavior, block: "start" });
  }

  /** Scroll-reveal: fade + rise each block as it enters the viewport. */
  function reveal(node: HTMLElement, delay = 0) {
    if (!browser || prefersReduced()) {
      node.classList.add("revealed");
      return;
    }
    node.classList.add("reveal-init");
    if (delay) node.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            node.classList.add("revealed");
            io.unobserve(node);
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
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
    return "border-white/25 bg-black/50 text-white backdrop-blur";
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
  <div class="absolute inset-0 bg-linear-to-b from-black/40 via-black/15 to-black/50"></div>
  <!-- Ambient birds drifting across the sky for depth -->
  <Birds />
</div>

<!-- Trip nav: the route draws itself as you travel; pins light up at each stop
     and jump-scroll on click. Desktop only, it'd crowd a phone. -->
<nav
  class="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
  aria-label="Trip progress"
>
  <div class="relative h-52 w-4">
    <!-- route track + the stretch travelled so far -->
    <div
      class="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/25"
    ></div>
    <div
      class="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-white/90 transition-[height] duration-150 ease-out"
      style="height: {progress * 100}%;"
    ></div>
    {#each STOPS as stop, i (stop.label)}
      {@const reached = sceneIndex >= i - 0.35}
      {@const active = activeStop === i}
      <button
        type="button"
        onclick={() => scrollToStop(i)}
        class="group absolute left-1/2 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style="top: {i * 50}%;"
        aria-label={`Go to ${stop.label}`}
        aria-current={active ? "true" : undefined}
      >
        <span
          class={cn(
            "block size-2.5 rounded-full border transition-all duration-200",
            reached ? "border-white bg-white" : "border-white/50 bg-black/30",
            active && "scale-150 ring-2 ring-white/40",
          )}
        ></span>
        <span
          class={cn(
            "pointer-events-none absolute right-full mr-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white backdrop-blur transition-opacity duration-200",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {stop.label}
        </span>
      </button>
    {/each}
  </div>
</nav>

<div class="-mx-4 flex flex-col">
  <!-- STOP 1 · PULLMAN — Mile 0: who you are, and the card that says it twice -->
  <section
    class="relative flex min-h-screen flex-col justify-center gap-10 px-4 py-24 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-12"
  >
    <!-- Copy panel: the Palouse scene has a light sand band that eats
         paragraph contrast (~2.5:1 mid-line). A soft dark plate hugging the
         text block lifts it above 4.5:1 without washing the artwork — much
         calmer than any full-section scrim could be. -->
    <div
      class="relative flex max-w-xl flex-col items-center gap-6 rounded-[2rem] bg-black/30 px-6 py-8 text-center backdrop-blur-[3px] sm:px-8 lg:items-start lg:text-left"
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

      <!-- One CTA. The scroll hint below is ambience; this is the instruction. -->
      <div class="flex justify-center lg:justify-start">
        <a
          href="#projects"
          class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold shadow-lg transition-colors"
        >
          See the work
          <IconArrowDown class="size-4" />
        </a>
      </div>

      <!-- Live-work peek: proof above the fold, one tap straight into a real
           app so a 10-second visitor sees the work exists before the scroll. -->
      <div
        class="flex flex-wrap items-center justify-center gap-1.5 lg:justify-start"
      >
        <span class="text-xs font-medium text-white/70">Live now:</span>
        {#each PEEK as p (p.slug)}
          <a
            href={p.slug}
            class="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/70"
          >
            <span
              class="size-1.5 rounded-full bg-emerald-400"
              aria-hidden="true"
            ></span>
            {p.title}
          </a>
        {/each}
        {#if PEEK_MORE > 0}
          <a
            href="#projects"
            class="text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
            >+{PEEK_MORE} more</a
          >
        {/if}
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

  <!-- STOP 2 · SEATTLE — a breather between the pitch and the work.
       No photos here: an illustrated skyline doesn't need a photographic
       one competing with it. The copy sits on a solid panel so contrast
       never depends on where the hills happen to be. Drop a real photo
       reel back in once there are real shots worth showing. -->
  <section
    id="seattle"
    class="relative flex min-h-screen scroll-mt-6 flex-col items-center justify-center px-4 py-16 lg:px-12"
  >
    <div
      use:reveal
      class="w-full max-w-lg rounded-2xl border border-white/20 bg-black/45 p-6 backdrop-blur sm:p-8"
    >
      <Badge variant="outline" class={sectionLabelClass()}>
        🥾 Off the Clock · Denver &amp; wherever the trailhead is
      </Badge>
      <h2
        class="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl"
      >
        Same curiosity, worse altitude
      </h2>
      <p
        class="mt-3 text-sm leading-relaxed text-white/85 sm:text-base"
      >
        Off the laptop, it's climbs I keep overestimating, a section-612
        voice at Mile High, and trails I'd call "moderate" to anyone who'd
          listen. The curiosity is the same one that shows up in the code.
      </p>
    </div>
  </section>

  <!-- STOP 3 · DENVER — the work, and how to reach me -->
  <section
    id="projects"
    class="relative flex min-h-screen scroll-mt-6 flex-col justify-center gap-6 px-4 py-24 lg:px-12"
  >
    <Badge variant="outline" class={cn(sectionLabelClass(), "w-fit")}>
      📍 The Rockies · Denver, Colorado
    </Badge>
    <div use:reveal>
      <h2
        class="drop-shadow-lg font-serif text-3xl font-bold text-white"
      >
        The Statsheet
      </h2>
      <p class="drop-shadow-md mt-1 text-sm text-white/85">
        {LIVE_PROJECTS.length} live explorers, each hand-rolled and pointed at
        one public dataset — most with their own typed SvelteKit server
        endpoints, caching, and tests. Slide through them — they're all working.
      </p>
    </div>

    <div class="relative" use:reveal={120}>
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
              <Card.Root
                class="relative h-full transition-shadow hover:shadow-xl"
              >
                <Card.Header>
                  <div class="flex items-center justify-between gap-2">
                    <Card.Title class="text-lg">
                      <a
                        href={project.slug}
                        class="after:absolute after:inset-0">{project.title}</a
                      >
                    </Card.Title>
                    <IconArrowRight
                      class="text-muted-foreground size-4 shrink-0"
                    />
                  </div>
                  <Card.Description>
                    {project.description}
                  </Card.Description>
                  {#if project.tech}
                    <p
                      class="text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed"
                    >
                      {project.tech}
                    </p>
                  {/if}
                </Card.Header>
                <Card.Footer class="flex-wrap gap-1.5">
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
                  {#if project.tested}
                    <Badge
                      variant="outline"
                      class="gap-1 border-emerald-500/30 text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      <IconCircleCheck class="size-3" />
                      Tested
                    </Badge>
                  {/if}
                  {#if project.repo}
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noreferrer"
                      class="hover:text-primary text-muted-foreground relative z-10 ml-auto inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"
                    >
                      <IconBrandGithub class="size-3.5" />
                      Code
                    </a>
                  {/if}
                </Card.Footer>
              </Card.Root>
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
      use:reveal
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

<style>
  /* Scroll-reveal: content starts lowered + transparent, settles on arrival.
     Classes are toggled by the `reveal` action; reduced-motion skips straight
     to revealed. :global because the action adds the classes at runtime. */
  :global(.reveal-init) {
    opacity: 0;
    transform: translateY(20px);
    transition:
      opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity, transform;
  }
  :global(.reveal-init.revealed) {
    opacity: 1;
    transform: none;
  }
</style>
