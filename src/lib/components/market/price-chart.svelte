<script lang="ts">
  import { LineChart } from "layerchart";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import type { ChartRow, ChartSeries } from "$lib/alpaca.js";

  const MAX_TICKS = 6;

  let {
    rows,
    series,
    className = "w-full",
  }: {
    /** Rows must be sorted oldest-first. */
    rows: ChartRow[];
    /** One entry per line; `key` must match a field on each row. */
    series: ChartSeries[];
    className?: string;
  } = $props();

  const config = $derived<Chart.ChartConfig>(
    Object.fromEntries([
      ["date", { label: "Date" }],
      ...series.map((s) => [s.key, { label: s.label, color: s.color }]),
    ]),
  );

  const seriesProps = $derived(
    series.map((s, i) => ({ key: s.key, label: s.label, color: s.color, index: i })),
  );

  // LineChart anchors its value-axis domain at zero by default, which squashes
  // price series into a sliver at the top of the plot. Fit the y-domain to the
  // data with a little breathing room instead.
  const yDomain = $derived.by<[number, number] | undefined>(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const r of rows) {
      for (const s of series) {
        const v = Number(r[s.key]);
        if (!Number.isFinite(v)) continue;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (min === Number.POSITIVE_INFINITY || max === Number.NEGATIVE_INFINITY) {
      return undefined;
    }
    const pad = (max - min || Math.abs(max) || 1) * 0.08;
    return [min - pad, max + pad];
  });

  // Thin the axis labels out so they don't collide on narrow screens.
  const ticks = $derived.by(() => {
    const labels = rows.map((r) => String(r.date));
    if (labels.length <= MAX_TICKS) return labels;
    const step = Math.ceil(labels.length / MAX_TICKS);
    const picked = labels.filter((_, i) => i % step === 0);
    return picked[picked.length - 1] === labels[labels.length - 1]
      ? picked
      : [...picked, labels[labels.length - 1]];
  });
</script>

<Chart.Container {config} class={className}>
  <LineChart
    data={rows}
    x="date"
    axis="x"
    yDomain={yDomain}
    series={seriesProps}
    props={{
      xAxis: { ticks },
      line: { strokeWidth: 2 },
    }}
  >
    {#snippet tooltip()}
      <Chart.Tooltip />
    {/snippet}
  </LineChart>
</Chart.Container>
