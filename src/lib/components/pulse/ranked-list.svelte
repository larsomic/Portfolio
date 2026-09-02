<script lang="ts">
  let {
    title,
    items,
    color,
    label,
    fmt = (n) => String(n),
    maxItems = 12,
  }: {
    title: string;
    items: { label: string; value: number | null }[];
    color: string;
    label: string;
    fmt?: (n: number | null) => string;
    maxItems?: number;
  } = $props();

  const shown = $derived(
    [...items]
      .filter((i) => i.value != null && Number.isFinite(i.value))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, maxItems),
  );
  const max = $derived(Math.max(...shown.map((i) => i.value ?? 0), 1));
</script>

<section class="flex flex-col gap-1.5">
  <h4 class="text-sm font-semibold">{title}</h4>
  <p class="text-muted-foreground text-xs">{label}</p>
  {#each shown as item (item.label)}
    <div class="flex flex-col">
      <div class="flex items-center justify-between gap-2 text-xs">
        <span class="truncate">{item.label}</span>
        <span class="font-mono tabular-nums" style={`color:${color}`}>
          {fmt(item.value)}
        </span>
      </div>
      <div class="bg-muted mt-0.5 h-2 overflow-hidden rounded-sm">
        <div
          class="h-full rounded-sm"
          style={`width:${((item.value ?? 0) / max) * 100}%;background:${color}`}></div>
      </div>
    </div>
  {:else}
    <p class="text-muted-foreground py-2 text-xs">No data.</p>
  {/each}
</section>
