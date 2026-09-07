<script lang="ts">
  import SEO from "$lib/components/seo.svelte";
  import {
    IconArrowRight,
    IconBolt,
    IconHeart,
    IconRocket,
    IconSparkles,
    IconTable,
    IconPalette,
    IconWindmill,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { PROJECTS } from "$lib/config/projects.js";
  import { cn } from "$lib/utils.js";

  // A tiny bit of live Svelte state — the whole page is reactive, but this
  // counter is here so you can *see* it happen.
  let clicks = $state(0);
  const clickMessage = $derived.by(() => {
    if (clicks === 0) return "Go on, click the bolt. This number is pure Svelte state.";
    if (clicks < 5) return "Nice! That re-render was instant — no diffing drama.";
    if (clicks < 15) return `You've clicked ${clicks} times. The UI updated every single one.`;
    if (clicks < 30) return `${clicks} clicks?! This is officially a stress test.`;
    return "Okay this is your own personal lightning button now. ⚡";
  });

  const stack = [
    {
      icon: IconBolt,
      name: "SvelteKit 2",
      blurb:
        "The whole site is Svelte — components, state, routing. No virtual DOM, just reactive values that update the exact parts of the page that changed.",
      color: "text-[#ff3e00]",
    },
    {
      icon: IconPalette,
      name: "shadcn-svelte + Tailwind v4",
      blurb:
        "Every card, badge, and button is shadcn-svelte, styled with Tailwind CSS v4 and themed with the 'Sera' base color.",
      color: "text-[#ac2bec]",
    },
    {
      icon: IconTable,
      name: "TanStack Table",
      blurb:
        "The data-heavy pages (league leaders, transactions) use headless TanStack tables for sorting and filtering.",
      color: "text-emerald-500",
    },
    {
      icon: IconWindmill,
      name: "Built for fun",
      blurb:
        "No tickets, no standups, no stakeholders. Just a Saturday-and-evenings playground where I get to try whatever I want.",
      color: "text-sky-500",
    },
  ];
</script>

<SEO title="About My Portfolio · Michael Larson" description="A SvelteKit-built portfolio of one-off projects, created purely for fun." />

<div class="relative -mx-4 -mt-4 flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden">
  <!-- Decorative glow blobs (pure CSS, very on-brand orange & purple) -->
  <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div
      class="bg-[#ff3e00] absolute -top-24 -left-24 size-96 rounded-full opacity-15 blur-3xl dark:opacity-25"
    ></div>
    <div
      class="bg-[#ac2bec] absolute -right-32 top-1/3 size-80 rounded-full opacity-10 blur-3xl dark:opacity-20"
    ></div>
  </div>

  <!-- Hero -->
  <section
    class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 pt-16 pb-8 text-center sm:pt-24"
  >
    <Badge variant="outline" class="gap-1.5 rounded-full px-3">
      <IconSparkles class="size-3.5 text-[#ff3e00]" />
      100% hand-rolled Svelte
    </Badge>
    <h1
      class="max-w-3xl font-serif text-4xl leading-tight font-bold sm:text-5xl md:text-6xl"
    >
      This whole page is built with
      <span
        class="bg-linear-to-r from-[#ff3e00] via-[#ff6d34] to-[#ac2bec] bg-clip-text text-transparent"
      >
        Svelte
      </span>
    </h1>
    <p class="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
      Yes, the entire portfolio you're browsing — sidebar, scenes, tables,
      this very paragraph — is a
      <a
        href="https://svelte.dev"
        class="font-medium text-[#ff3e00] underline decoration-dotted underline-offset-4 hover:opacity-80"
        target="_blank"
        rel="noreferrer">SvelteKit</a
      >
      app. I built it for one simple reason: fun. There's no interview funnel
      here, no "hire me" banner — just a collection of one-off projects I
      wanted to exist, shipped on a weekend when the mood struck.
    </p>
  </section>

  <!-- Interactive reactivity demo -->
  <section class="mx-auto w-full max-w-5xl px-4 py-6">
    <Card.Root
      class="border-[#ff3e00]/20 bg-linear-to-br from-background via-background to-[#ff3e00]/5"
    >
      <Card.Header>
        <div class="flex items-center gap-2">
          <IconBolt class="size-5 text-[#ff3e00]" />
          <Card.Title class="text-lg">Reactivity, live</Card.Title>
        </div>
        <Card.Description>
          Svelte's superpower is that state changes feel instantaneous. Here's
          proof you can poke.
        </Card.Description>
      </Card.Header>
      <Card.Content class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p class="max-w-md text-sm text-muted-foreground">{clickMessage}</p>
        <button
          type="button"
          class={cn(
            "bg-[#ff3e00] hover:bg-[#ff3e00]/90 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff3e00]/25 transition-all duration-150 active:scale-95",
            clicks > 0 && "animate-[pulse_0.3s_ease-out]",
          )}
          onclick={() => (clicks += 1)}
        >
          <IconBolt class="size-4" />
          Zap! {#if clicks > 0}<span class="tabular-nums">{clicks}</span>{/if}
        </button>
      </Card.Content>
    </Card.Root>
  </section>

  <!-- Tech stack -->
  <section class="mx-auto w-full max-w-5xl px-4 py-10">
    <h2 class="mb-6 flex items-center gap-2 font-serif text-2xl font-bold">
      <IconRocket class="size-6 text-[#ac2bec]" />
      What's under the hood
    </h2>
    <div class="grid gap-4 sm:grid-cols-2">
      {#each stack as item (item.name)}
        <Card.Root class="transition-shadow hover:shadow-lg">
          <Card.Header>
            <div class="flex items-center gap-2">
              <item.icon class={cn("size-5", item.color)} />
              <Card.Title class="text-base">{item.name}</Card.Title>
            </div>
            <Card.Description>{item.blurb}</Card.Description>
          </Card.Header>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Why this exists -->
  <section class="mx-auto w-full max-w-5xl px-4 py-10">
    <Card.Root>
      <Card.Header>
        <div class="flex items-center gap-2">
          <IconHeart class="size-5 fill-[#ff3e00] text-[#ff3e00]" />
          <Card.Title>Why does this exist?</Card.Title>
        </div>
        <Card.Description class="leading-relaxed">
          Because every good engineer I know keeps a junk drawer of weird
          projects, and I finally built myself a cabinet to store mine in.
          Each page behind that sidebar started as a slightly unhinged
          question — *who in my fantasy league is actually the best at
          waivers?* — followed by an equally unhinged decision to answer it
          with a web app instead of a spreadsheet. Some of these will live
          for exactly one sports season. One of them (the bracket page)
          exists purely so I could argue with my brother with data. All of
          them taught me something. If you poke around and smile, the
          weekend was worth it.
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <span class="text-xs text-muted-foreground">
          Sports and markets now — whatever the next API dares me to build ⚒️
        </span>
      </Card.Footer>
    </Card.Root>
  </section>

  <!-- Projects grid -->
  <section class="mx-auto w-full max-w-5xl px-4 pt-6 pb-20">
    <h2 class="mb-6 flex items-center gap-2 font-serif text-2xl font-bold">
      <IconSparkles class="size-6 text-[#ff3e00]" />
      The one-offs
    </h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each PROJECTS as project (project.title)}
        {@const soon = project.status === "soon"}
        <div class={cn(soon && "opacity-60")}>
          {#if soon}
            <Card.Root class="h-full">
              <Card.Header>
                <div class="flex items-center justify-between gap-2">
                  <Card.Title class="text-lg">{project.title}</Card.Title>
                  <Badge variant="destructive">soon</Badge>
                </div>
                <Card.Description>{project.description}</Card.Description>
              </Card.Header>
              <Card.Footer class="gap-1.5">
                {#if project.source}
                  <Badge variant="outline" class="font-mono text-[10px]">
                    {project.source}
                  </Badge>
                {/if}
                {#each project.tags as tag (tag)}
                  <Badge variant="secondary">{tag}</Badge>
                {/each}
              </Card.Footer>
            </Card.Root>
          {:else}
            <a href={project.slug} class="block h-full">
              <Card.Root
                class="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <Card.Header>
                  <div class="flex items-center justify-between gap-2">
                    <Card.Title class="text-lg">{project.title}</Card.Title>
                    <IconArrowRight
                      class="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-1"
                    />
                  </div>
                  <Card.Description>{project.description}</Card.Description>
                </Card.Header>
                <Card.Footer class="gap-1.5">
                  {#if project.source}
                    <Badge variant="outline" class="font-mono text-[10px]">
                      {project.source}
                    </Badge>
                  {/if}
                  {#each project.tags as tag (tag)}
                    <Badge variant="secondary">{tag}</Badge>
                  {/each}
                </Card.Footer>
              </Card.Root>
            </a>
          {/if}
        </div>
      {/each}
    </div>

    <p class="mt-10 text-center text-sm text-muted-foreground">
      Pick a card, pick a rabbit hole. 🎰
    </p>
  </section>
</div>
