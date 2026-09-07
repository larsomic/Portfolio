<script lang="ts">
  import { browser } from "$app/environment";
  import { IconCookie, IconX } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";

  /**
   * One key, one value. Nothing else on this site sets cookies or runs
   * analytics, which is a pretty short privacy policy.
   */
  const STORAGE_KEY = "mike-larson-portfolio:cookie-consent";

  // Starts `true` so nothing renders during SSR/prerender; the effect below
  // decides whether to show it once we're actually in a browser.
  let visible = $state(false);

  $effect(() => {
    if (!browser) return;
    try {
      visible = localStorage.getItem(STORAGE_KEY) === null;
    } catch {
      // Private mode / storage disabled: show it, and don't crash on dismiss.
      visible = true;
    }
  });

  function dismiss() {
    visible = false;
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // Storage unavailable — the banner will just come back next visit.
    }
  }
</script>

{#if visible}
  <section
    class="cookie-banner border-primary/20 bg-card text-card-foreground fixed inset-x-4 bottom-4 z-50 hidden items-center gap-4 rounded-xl border p-4 shadow-lg backdrop-blur md:flex md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
    aria-labelledby="cookie-banner-title"
  >
    <div
      class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
    >
      <IconCookie class="size-5" />
    </div>

    <div class="flex-1">
      <h2
        id="cookie-banner-title"
        class="font-serif text-sm leading-snug font-semibold"
      >
        We don't track you.
      </h2>
      <p class="text-muted-foreground mt-1 text-xs leading-relaxed">
        No analytics, no ad networks, no third-party cookies. The only thing
        remembered is that you already closed this banner — one entry in
        localStorage.
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <Button size="sm" onclick={dismiss}>Sounds good</Button>
      <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground"
        aria-label="Dismiss cookie notice"
        onclick={dismiss}
      >
        <IconX class="size-4" />
      </Button>
    </div>
  </section>
{/if}

<style>
  .cookie-banner {
    animation: cookie-rise 0.35s ease-out both;
  }

  @keyframes cookie-rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cookie-banner {
      animation: none;
    }
  }
</style>
