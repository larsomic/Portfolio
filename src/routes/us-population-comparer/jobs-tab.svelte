<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import RankedList from "$lib/components/pulse/ranked-list.svelte";
  import { CUBES, fmtMoney, type DataRow } from "$lib/datausa.js";
  import { aggregate, fetchLatestDist, type Level } from "./helpers.js";
  import type { Member } from "$lib/datausa.js";

  let { level, a, b }: { level: Level; a: Member; b: Member } = $props();

  const COLOR_A = "#0ea5e9";
  const COLOR_B = "#f59e0b";

  let loading = $state(true);
  let year = $state(0);
  type RankItem = { label: string; value: number | null };
  let industryA = $state<RankItem[]>([]);
  let industryB = $state<RankItem[]>([]);
  let occupationA = $state<RankItem[]>([]);
  let occupationB = $state<RankItem[]>([]);

  function toItems(map: Map<string, number>): RankItem[] {
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [ind, occ] = await Promise.all([
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.industryEarnings,
            "Median Earnings by Industry: Industry",
            ["Industry"],
          ),
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.occupationEarnings,
            "Median Earings by Occupation: Occupation",
            ["Occupation"],
          ),
        ]);
        if (aborted) return;
        year = ind.year;
        const notTotal = (r: DataRow) => {
          const v = String(r.Industry ?? r.Occupation ?? "");
          return v && v !== "Total" ? v : null;
        };
        industryA = toItems(aggregate(ind.rowsA, notTotal, "Median Earnings by Industry: Industry"));
        industryB = toItems(aggregate(ind.rowsB, notTotal, "Median Earnings by Industry: Industry"));
        occupationA = toItems(aggregate(occ.rowsA, notTotal, "Median Earings by Occupation: Occupation"));
        occupationB = toItems(aggregate(occ.rowsB, notTotal, "Median Earings by Occupation: Occupation"));
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
  <div class="grid gap-4 md:grid-cols-2">
    <Skeleton class="h-96 w-full rounded-lg" />
    <Skeleton class="h-96 w-full rounded-lg" />
  </div>
{:else}
  <div class="grid gap-4 lg:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Top industries by median earnings</Card.Title>
        <Card.Description class="text-xs">{year} · ACS 5-year estimates</Card.Description>
      </Card.Header>
      <Card.Content class="grid gap-6 sm:grid-cols-2">
        <RankedList
          title={a.caption}
          label="Median annual earnings"
          color={COLOR_A}
          items={industryA}
          fmt={fmtMoney} />
        <RankedList
          title={b.caption}
          label="Median annual earnings"
          color={COLOR_B}
          items={industryB}
          fmt={fmtMoney} />
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Top occupations by median earnings</Card.Title>
        <Card.Description class="text-xs">{year} · ACS 5-year estimates</Card.Description>
      </Card.Header>
      <Card.Content class="grid gap-6 sm:grid-cols-2">
        <RankedList
          title={a.caption}
          label="Median annual earnings"
          color={COLOR_A}
          items={occupationA}
          fmt={fmtMoney} />
        <RankedList
          title={b.caption}
          label="Median annual earnings"
          color={COLOR_B}
          items={occupationB}
          fmt={fmtMoney} />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
