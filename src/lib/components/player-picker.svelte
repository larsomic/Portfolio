<script lang="ts">
  import { IconSearch, IconX } from "@tabler/icons-svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { fetchJson, API_BASE } from "$lib/mlb-stats.js";

  interface Suggestion {
    id: number;
    fullName: string;
    primaryPosition?: { abbreviation?: string };
    active?: boolean;
  }

  interface SelectedPlayer {
    id: number;
    fullName: string;
  }

  const MAX_RESULTS = 8;
  const DEBOUNCE_MS = 250;

  let {
    selected = null,
    label,
    placeholder = "Type a player's name",
    align = "start",
    onselectedchange,
  }: {
    /** Currently chosen player, or `null` for an empty picker. */
    selected?: SelectedPlayer | null;
    label?: string;
    placeholder?: string;
    align?: "start" | "end";
    onselectedchange?: (player: SelectedPlayer | null) => void;
  } = $props();

  let query = $state("");
  let results = $state<Suggestion[]>([]);
  let openList = $state(false);
  let searching = $state(false);
  let activeIndex = $state(-1);
  let inputEl = $state<HTMLDivElement | null>(null);
  let listId = $props.id();

  // Keep the input in sync when the selection changes elsewhere (e.g. a URL)
  let lastId = $state<number | null>(null);
  $effect(() => {
    const id = selected?.id ?? null;
    if (id === lastId) return;
    lastId = id;
    query = selected?.fullName ?? "";
    results = [];
    openList = false;
    activeIndex = -1;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;

  // Debounced typeahead; each keystroke cancels the previous request
  $effect(() => {
    const q = query.trim();
    if (timer) clearTimeout(timer);
    if (q.length < 2 || selected?.fullName === q) {
      controller?.abort();
      results = [];
      openList = false;
      return;
    }
    timer = setTimeout(async () => {
      controller?.abort();
      controller = new AbortController();
      searching = true;
      const data = await fetchJson<{ people?: Suggestion[] }>(
        `${API_BASE}/people/search?names=${encodeURIComponent(q)}&type=player`,
        controller.signal,
      );
      if (controller?.signal.aborted) return;
      results = (data?.people ?? [])
        .filter((p) => p.id)
        .slice(0, MAX_RESULTS);
      searching = false;
      activeIndex = -1;
      openList = results.length > 0;
    }, DEBOUNCE_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  });

  // Close the suggestion list on any click outside the picker
  $effect(() => {
    if (!openList) return;
    const close = (e: Event) => {
      if (!inputEl?.contains(e.target as Node)) openList = false;
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  });

  function choose(player: Suggestion) {
    onselectedchange?.({ id: player.id, fullName: player.fullName });
    query = player.fullName;
    results = [];
    openList = false;
    activeIndex = -1;
  }

  function clear() {
    onselectedchange?.(null);
    lastId = null;
    query = "";
    results = [];
    openList = false;
    activeIndex = -1;
  }

  function move(delta: number) {
    if (!results.length) return;
    const next = (activeIndex + delta + results.length) % results.length;
    activeIndex = next;
  }

  function onKeydown(e: KeyboardEvent) {
    if (!openList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const picked = results[activeIndex];
      if (picked) choose(picked);
    } else if (e.key === "Escape") {
      openList = false;
    }
  }

  const optionId = (index: number) => `${listId}-option-${index}`;
</script>

<div class="relative flex flex-col gap-1.5" bind:this={inputEl}>
  {#if label}
    <span
      class="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
    >{label}</span>
  {/if}
  <div class="relative">
    <IconSearch
      class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
    />
    <Input
      type="text"
      {placeholder}
      autocomplete="off"
      class="h-9 pr-8 pl-8"
      bind:value={query}
      role="combobox"
      aria-expanded={openList}
      aria-autocomplete="list"
      aria-controls={listId}
      aria-activedescendant={activeIndex >= 0 ? optionId(activeIndex) : undefined}
      onkeydown={onKeydown}
    />
    {#if selected}
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 size-4 -translate-y-1/2"
        title="Clear player"
        aria-label="Clear player"
        onclick={clear}
      >
        <IconX class="size-4" />
      </button>
    {/if}
  </div>

  {#if openList}
    <ul
      id={listId}
      role="listbox"
      class="bg-popover text-popover-foreground border-input absolute
        z-50 mt-1 w-full max-w-full overflow-x-hidden rounded-md border
        p-1.5 shadow-md
        max-h-64 overflow-y-auto
        data-align={align}"
    >
      {#if searching && !results.length}
        <li class="text-muted-foreground px-2 py-1.5 text-sm">Searching…</li>
      {/if}
      {#each results as player, i (player.id)}
        <li
          id={optionId(i)}
          role="option"
          aria-selected={i === activeIndex}
          class="hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-2
            text-sm"
          onmouseenter={() => (activeIndex = i)}
        >
          <button
            type="button"
            class="flex w-full min-w-0 items-center justify-between gap-3 text-left"
            onclick={() => choose(player)}
          >
            <span class="min-w-0 flex-1 truncate">{player.fullName}</span>
            <span
              class="text-muted-foreground shrink-0 font-mono text-xs uppercase"
            >
              {player.primaryPosition?.abbreviation ?? ""}{#if !player.active} ·
                retired{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
