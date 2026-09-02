<script lang="ts">
  import { scaleLinear } from "d3-scale";
  import { ticks } from "d3-array";

  export type TrendPoint = { x: number; y: number };
  export type TrendSeries = { name: string; color: string; points: TrendPoint[] };

  let {
    series,
    height = 240,
    fmtY = (n) => String(Math.round(n)),
    yLabel = "",
  }: {
    series: TrendSeries[];
    height?: number;
    fmtY?: (n: number) => string;
    yLabel?: string;
  } = $props();

  const W = 640;
  const M = { top: 12, right: 14, bottom: 28, left: 52 };
  const innerW = W - M.left - M.right;
  const innerH = $derived(height - M.top - M.bottom);

  let hovered = $state<{ x: number; sx: number } | null>(null);

  const allPoints = $derived(series.flatMap((s) => s.points));

  const domain = $derived.by(() => {
    if (!allPoints.length) return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    let xMin = Infinity,
      xMax = -Infinity,
      yMin = Infinity,
      yMax = -Infinity;
    for (const p of allPoints) {
      if (p.x < xMin) xMin = p.x;
      if (p.x > xMax) xMax = p.x;
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    }
    const pad = Math.abs(yMax - yMin) || 1;
    return {
      xMin,
      xMax: xMax === xMin ? xMin + 1 : xMax,
      yMin: Math.max(0, yMin - pad * 0.05),
      yMax: yMax + pad * 0.08,
    };
  });

  const sx = $derived(
    scaleLinear().domain([domain.xMin, domain.xMax]).range([0, innerW]),
  );
  const sy = $derived(
    scaleLinear().domain([domain.yMin, domain.yMax]).range([innerH, 0]),
  );

  const yTickVals = $derived(
    ticks(domain.yMin, domain.yMax, 5) as number[],
  );

  const xTickVals = $derived.by(() => {
    const xs = [...new Set(allPoints.map((p) => p.x))].sort((a, b) => a - b);
    if (xs.length <= 7) return xs;
    const step = Math.ceil(xs.length / 6);
    const out: number[] = [];
    for (let i = 0; i < xs.length; i += step) out.push(xs[i]);
    if (out[out.length - 1] !== xs[xs.length - 1]) out.push(xs[xs.length - 1]);
    return out;
  });

  function path(s: TrendSeries) {
    return s.points
      .map(
        (p, i) =>
            `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`,
      )
      .join("");
  }

  function nearest(e: MouseEvent, svg: SVGSVGElement) {
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    let best: { x: number; sx: number } | null = null;
    let bestD = Infinity;
    for (const s of series) {
      for (const p of s.points) {
        const d = Math.abs(sx(p.x) - mx + M.left);
        if (d < bestD) {
          bestD = d;
          best = { x: p.x, sx: sx(p.x) };
        }
      }
    }
    hovered = best;
  }

  const tooltipRows = $derived.by(() => {
    if (!hovered) return [];
    return series
      .map((s) => {
        const p = s.points.find((pt) => pt.x === hovered!.x);
        return p ? { name: s.name, color: s.color, y: p.y } : null;
      })
      .filter((r): r is { name: string; color: string; y: number } => !!r);
  });
</script>

<div class="relative w-full">
  <!-- Y-axis grid + labels -->
  <svg
    role="img"
    aria-label="Trend chart"
    viewBox={`0 0 ${W} ${height}`}
    class="w-full"
    onmousemove={(e) => nearest(e, e.currentTarget as SVGSVGElement)}
    onmouseleave={() => (hovered = null)}>
    <g transform={`translate(${M.left},${M.top})`}>
      {#each yTickVals as t (t)}
        <line x1={0} x2={innerW} y1={sy(t)} y2={sy(t)} class="stroke-muted-foreground/30" stroke-width="1" />
        <text
          x={-8}
          y={sy(t)}
          dy="0.32em"
          text-anchor="end"
          class="fill-muted-foreground"
          font-size="10">
          {fmtY(t)}
        </text>
      {/each}

      <!-- X-axis line + year labels -->
      <line x1={0} x2={innerW} y1={innerH} y2={innerH} class="stroke-muted-foreground/60" stroke-width="1" />
      {#each xTickVals as t (`x-${t}`)}
        <text
          x={sx(t)}
          y={innerH + 14}
          text-anchor="middle"
          class="fill-muted-foreground" font-size="10">
          {Math.round(t)}
        </text>
      {/each}

      {#if hovered}
        <line
          x1={hovered.sx}
          x2={hovered.sx}
          y1={0}
          y2={innerH}
          class="stroke-muted-foreground"
          stroke-dasharray="3 3"></line>
      {/if}

      {#each series as s (s.name)}
        <path d={path(s)} fill="none" stroke={s.color} stroke-width="2.5" />
        {#each s.points as p (`${s.name}-${p.x}`)}
          <circle
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={hovered?.x === p.x ? 4.5 : 2.5}
            fill={s.color}></circle>
        {/each}
      {/each}
    </g>
  </svg>

  {#if tooltipRows.length}
    <div
      class="bg-popover text-popover-foreground pointer-events-none absolute top-1 z-10 rounded-md border px-2 py-1 text-xs shadow"
      style={`left: min(${(((M.left + hovered!.sx) / W) * 100).toFixed(1)}%, calc(100% - 9.5rem));`}>
      <p class="font-semibold">{Math.round(hovered!.x)}</p>
      {#each tooltipRows as r (r.name)}
        <p class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="inline-block size-2 rounded-full" style={`background:${r.color}`}></span>
          <span class="text-muted-foreground">{r.name}:</span>
          <span class="font-mono tabular-nums">{fmtY(r.y)}</span>
        </p>
      {/each}
    </div>
  {/if}

  {#if yLabel}
    <span class="text-muted-foreground absolute left-1 top-1 text-[10px] uppercase tracking-wider">
      {yLabel}
    </span>
  {/if}
</div>
