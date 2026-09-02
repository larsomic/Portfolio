<script lang="ts">
  import { IconSearch } from "@tabler/icons-svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import type { Member } from "$lib/datausa.js";

  let {
    label,
    members,
    value = $bindable(null as Member | null),
    color,
    placeholder = "Search a place…",
  }: {
    label: string;
    members: Member[];
    value?: Member | null;
    color: string;
    placeholder?: string;
  } = $props();

  let query = $state("");
  let open = $state(false);
  let inputEl = $state<HTMLInputElement | null>(null);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 15);
    return members
      .filter((m) => m.caption.toLowerCase().includes(q))
      .slice(0, 15);
  });

  $effect(() => {
    if (open) requestAnimationFrame(() => inputEl?.focus());
  });

  function select(m: Member) {
    value = m;
    query = "";
    open = false;
  }
</script>

<div class="flex flex-col gap-1">
  <span
    class="text-xs font-semibold tracking-wider uppercase"
    style={`color:${color}`}>
    {label}
  </span>
  <Popover.Root bind:open>
    <Popover.Trigger
      class="border-input data-[state=open]:border-ring hover:bg-muted/50 flex h-10 w-full items-center gap-2 rounded-md border bg-background px-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      <span
        class="inline-block size-2.5 shrink-0 rounded-full"
        style={`background:${color}`}></span>
      <span class="flex-1 truncate {value ? '' : 'text-muted-foreground'}">
        {value?.caption ?? placeholder}
      </span>
      <IconSearch class="text-muted-foreground size-4 shrink-0" />
    </Popover.Trigger>
    <Popover.Content align="start" class="w-auto min-w-72 gap-2 p-2">
      <input
        bind:this={inputEl}
        bind:value={query}
        class="border-input bg-background focus-visible:ring-ring/50 h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
        {placeholder}
        onkeydown={(e) => {
          if (e.key === "Enter" && filtered[0]) select(filtered[0]);
        }} />
      <ul class="max-h-64 overflow-y-auto">
        {#each filtered as m (m.key)}
          <li>
            <button
              type="button"
              class="hover:bg-muted w-full rounded-sm px-2 py-1.5 text-left text-sm {value?.key ===
              m.key
                ? 'bg-muted font-semibold'
                : ''}"
              onclick={() => select(m)}>
              {m.caption}
            </button>
          </li>
        {:else}
          <li class="text-muted-foreground px-2 py-1.5 text-sm">No matches.</li>
        {/each}
      </ul>
    </Popover.Content>
  </Popover.Root>
</div>
