<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import CompareBars, { type CompareRow } from "$lib/components/pulse/compare-bars.svelte";
  import { CUBES, fmtCompact } from "$lib/datausa.js";
  import { aggregate, fetchLatestDist, pairRows, type Level } from "./helpers.js";
  import type { Member } from "$lib/datausa.js";

  let {
    level,
    a,
    b,
    asPercent = false,
  }: { level: Level; a: Member; b: Member; asPercent?: boolean } = $props();

  let loading = $state(true);
  let year = $state(0);
  let valueRows = $state<CompareRow[]>([]);
  let tenureRows = $state<CompareRow[]>([]);
  let commuteRows = $state<CompareRow[]>([]);

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [val, tenure, commute] = await Promise.all([
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.housingValue,
            "Property Value by Bucket",
            ["Value Bucket"],
          ),
          fetchLatestDist(level, a, b, CUBES.tenure, "Household Ownership", [
            "Occupied By",
          ]),
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.commuteMeans,
            "Commute Means",
            ["Transportation Means"],
          ),
        ]);
        if (aborted) return;
        year = val.year;
        valueRows = pairRows(
          aggregate(
            val.rowsA,
            (r) => String(r["Value Bucket"] ?? ""),
            "Property Value by Bucket",
          ),
          aggregate(
            val.rowsB,
            (r) => String(r["Value Bucket"] ?? ""),
            "Property Value by Bucket",
          ),
        );
        tenureRows = pairRows(
          aggregate(tenure.rowsA, (r) => String(r["Occupied By"] ?? ""), "Household Ownership"),
          aggregate(tenure.rowsB, (r) => String(r["Occupied By"] ?? ""), "Household Ownership"),
        );
        commuteRows = pairRows(
          aggregate(commute.rowsA, (r) => String(r["Transportation Means"] ?? ""), "Commute Means"),
          aggregate(commute.rowsB, (r) => String(r["Transportation Means"] ?? ""), "Commute Means"),
        );
      } finally {
        if (!aborted) loading = false;
      }
    })();
    return () => {
      aborted = true;
    };
  });
</script>

{#if loading}
  <div class="grid gap-4 md:grid-cols-3">
    <Skeleton class="h-80 w-full rounded-lg" />
    <Skeleton class="h-40 w-full rounded-lg" />
    <Skeleton class="h-80 w-full rounded-lg" />
  </div>
{:else}
  <div class="grid gap-4 lg:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Home values</Card.Title>
        <Card.Description class="text-xs">
          Owner-occupied homes by value bucket, {year} · {asPercent ? "share of each place’s homes" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={valueRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={10} />
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">How people get to work</Card.Title>
        <Card.Description class="text-xs">
          Commute means, {year} · {asPercent ? "share of each place’s commuters" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={commuteRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={9} />
      </Card.Content>
    </Card.Root>

    <Card.Root class="lg:col-span-2">
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Owners vs renters</Card.Title>
        <Card.Description class="text-xs">Occupied households, {year}</Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={tenureRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={4} />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
