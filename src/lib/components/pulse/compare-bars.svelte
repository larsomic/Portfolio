<script lang="ts">
  import { cn } from "$lib/utils.js";

  export interface CompareRow {
    label: string;
    a: number | null;
    b: number | null;
  }

  let {
    rows,
    labelA,
    labelB,
    fmt = (n) => String(n),
    percent = false,
    maxRows = 12,
    class: className,
  }: {
    rows: CompareRow[];
    labelA: string;
    labelB: string;
    fmt?: (n: number | null) => string;
    /** show each bar as a share of its own place's total */
    percent?: boolean;
    maxRows?: number;
    class?: string;
  } = $props();

  const COLOR_A = "#0ea5e9"; // sky-500
  const COLOR_B = "#f59e0b"; // amber-500

  const totals = $derived.by(() => {
    let a = 0;
    let b = 0;
    for (const r of rows) {
      a += r.a ?? 0;
      b += r.b ?? 0;
    }
    return { a: a || 1, b: b || 1 };
  });

  const shown = $derived(
    [...rows]
      .sort(
        (r1, r2) =>
          Math.max(r2.a ?? 0, r2.b ?? 0) - Math.max(r1.a ?? 0, r1.b ?? 0),
      )
      .slice(0, maxRows),
  );

  const scaleMax = $derived.by(() => {
    let m = 0;
    for (const r of shown) {
      m = Math.max(m, percent ? (r.a ?? 0) / totals.a : r.a ?? 0);
      m = Math.max(m, percent ? (r.b ?? 0) / totals.b : r.b ?? 0);
    }
    return m || 1;
  });

  const widthPct = (v: number | null, which: "a" | "b") => {
    if (v == null) return "0%";
    const val = percent ? v / totals[which] : v;
    return `${Math.max(1.5, ((val as number) / scaleMax) * 100)}%`;
  };

  const displayVal = (v: number | null, which: "a" | "b") => {
    if (v == null) return "—";
    if (!percent) return fmt(v);
    return `${((v / totals[which]) * 100).toFixed(1)}%`;
  };
</script>

<div class={cn("flex flex-col gap-3", className)}>
  <div class="flex items-center gap-4 text-xs">
    <span class="flex items-center gap-1.5">
      <span class="inline-block size-2.5 rounded-full" style={`background:${COLOR_A}`}></span>
      {labelA}
    </span>
    <span class="flex items-center gap-1.5">
      <span class="inline-block size-2.5 rounded-full" style={`background:${COLOR_B}`}></span>
      {labelB}
    </span>
  </div>
  {#each shown as row (row.label)}
    <div>
      <p class="text-muted-foreground mb-0.5 text-xs font-medium">{row.label}</p>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <div class="bg-muted h-3.5 flex-1 overflow-hidden rounded-sm">
            <div
              class="h-full rounded-sm"
              style={`width:${widthPct(row.a, "a")};background:${COLOR_A}`}></div>
          </div>
          <span class="w-20 text-right font-mono text-xs tabular-nums" style={`color:${COLOR_A}`}>
            {displayVal(row.a, "a")}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="bg-muted h-3.5 flex-1 overflow-hidden rounded-sm">
            <div
              class="h-full rounded-sm"
              style={`width:${widthPct(row.b, "b")};background:${COLOR_B}`}></div>
          </div>
          <span class="w-20 text-right font-mono text-xs tabular-nums" style={`color:${COLOR_B}`}>
            {displayVal(row.b, "b")}
          </span>
        </div>
      </div>
    </div>
  {:else}
    <p class="text-muted-foreground py-4 text-center text-sm">No data for these places.</p>
  {/each}
</div>
