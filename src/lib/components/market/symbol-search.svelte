<script lang="ts">
  import { IconLoader2, IconSearch } from "@tabler/icons-svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { cn } from "$lib/utils.js";
  import { readApiError, type SearchHit } from "$lib/alpaca.js";

  let {
    onPick,
    placeholder = "Search any listed symbol — AAPL, NVDA, SPY…",
    class: className = "",
  }: {
    /** Called with an uppercased symbol when the user picks a suggestion. */
    onPick: (symbol: string) => void;
    placeholder?: string;
    class?: string;
  } = $props();

  const DEBOUNCE_MS = 250;

  let query = $state("");
  let hits = $state<SearchHit[]>([]);
  let open = $state(false);
  let active = $state(-1);
  let loading = $state(false);
  let notice = $state<string | null>(null);

  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => () => {
    clearTimeout(timer);
    controller?.abort();
  });

  function handleInput(): void {
    const q = query.trim();
    if (timer) clearTimeout(timer);
    if (q.length < 1) {
      hits = [];
      open = false;
      return;
    }
    timer = setTimeout(() => void search(q), DEBOUNCE_MS);
  }

  async function search(q: string): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    loading = true;
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`, {
        signal,
      });
      if (!res.ok) {
        const err = await readApiError(res);
        // Suggestions are a convenience — never shout about why they failed.
        notice = err.kind === "missing-config" ? null : "Search unavailable.";
        hits = [];
        open = Boolean(hits.length);
        return;
      }
      const body = (await res.json()) as { hits: SearchHit[] };
      hits = Array.isArray(body.hits) ? body.hits.slice(0, 8) : [];
      active = hits.length ? 0 : -1;
      open = hits.length > 0;
    } catch {
      // Aborted or offline: just drop the list.
      hits = [];
      open = false;
    } finally {
      if (!signal.aborted) loading = false;
    }
  }

  function pick(hit: SearchHit): void {
    onPick(hit.symbol);
    query = hit.symbol;
    hits = [];
    notice = null;
    open = false;
    active = -1;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = (active + 1) % hits.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = active <= 0 ? hits.length - 1 : active - 1;
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const hit = hits[active];
      if (hit) pick(hit);
    } else if (e.key === "Escape") {
      open = false;
    }
  }

  function submit(): void {
    // Plain typed input: treat it as a symbol even with no suggestions.
    const q = query.trim().toUpperCase();
    if (!q) return;
    const exact = hits.find((h) => h.symbol === q);
    onPick(exact ? exact.symbol : q);
    open = false;
  }
</script>

<form
  class={cn("relative min-w-[15rem] flex-1 sm:min-w-[21rem]", className)}
  onsubmit={(e) => {
    e.preventDefault();
    submit();
  }}
>
  <label class="sr-only" for="symbol-search">Search symbols</label>
  <div class="relative">
    <IconSearch
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
    />
    <Input
      id="symbol-search"
      type="text"
      autocomplete="off"
      spellcheck="false"
      role="combobox"
      aria-expanded={open}
      aria-controls="symbol-suggestions"
      aria-autocomplete="list"
      class="pl-9"
      {placeholder}
      bind:value={query}
      oninput={handleInput}
      onkeydown={handleKeydown}
      onfocus={() => (open = hits.length > 0)}
      onclick={() => (open = hits.length > 0)}
      onblur={() => {
        // Give the click on a suggestion time to land before closing.
        setTimeout(() => (open = false), 120);
      }}
    />
    {#if loading}
      <IconLoader2
        class="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
      />
    {/if}
  </div>

  {#if open && hits.length > 0}
    <ul
      id="symbol-suggestions"
      role="listbox"
      class="border-border bg-popover text-popover-foreground absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-md border shadow-lg"
    >
      {#each hits as hit, i (hit.symbol)}
        <!-- Keyboard use is handled from the input (arrows + Enter), so the
             option itself deliberately has no key handler of its own. -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <li
          role="option"
          aria-selected={i === active}
          class={cn(
            "flex cursor-pointer items-baseline gap-2 px-3 py-2 text-sm",
            i === active
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
          onclick={() => pick(hit)}
          onmouseenter={() => (active = i)}
        >
          <span class="font-mono font-semibold">{hit.symbol}</span>
          {#if hit.name}
            <span class="text-muted-foreground min-w-0 flex-1 truncate text-xs">
              {hit.name}
            </span>
          {/if}
          {#if hit.type}
            <span
              class="text-muted-foreground shrink-0 font-mono text-[10px] tracking-wide uppercase"
            >
              {hit.type}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
  {:else if notice}
    <p class="text-muted-foreground mt-1 text-xs">{notice}</p>
  {/if}
</form>
