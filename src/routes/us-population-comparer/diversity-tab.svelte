<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import CompareBars, { type CompareRow } from "$lib/components/pulse/compare-bars.svelte";
  import { fmtCompact, CUBES, type DataRow } from "$lib/datausa.js";
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
  let raceRows = $state<CompareRow[]>([]);
  let birthRows = $state<CompareRow[]>([]);

  $effect(() => {
    void level;
    void a.key;
    void b.key;
    let aborted = false;
    (async () => {
      loading = true;
      try {
        const [race, born] = await Promise.all([
          fetchLatestDist(level, a, b, CUBES.race, "Hispanic Population", [
            "Race",
            "Ethnicity",
          ]),
          fetchLatestDist(
            level,
            a,
            b,
            CUBES.foreignBorn,
            "Foreign-Born Citizens",
            ["Country"],
          ),
        ]);
        if (aborted) return;
        year = race.year;
        const labelOfRace = (r: DataRow) => {
          const eth = String(r.Ethnicity ?? "");
          if (eth.toLowerCase().startsWith("hispanic")) return "Hispanic / Latino";
          return String(r.Race ?? "");
        };
        raceRows = pairRows(
          aggregate(race.rowsA, labelOfRace, "Hispanic Population"),
          aggregate(race.rowsB, labelOfRace, "Hispanic Population"),
        );
        birthRows = pairRows(
          aggregate(born.rowsA, (r) => String(r.Country ?? ""), "Foreign-Born Citizens"),
          aggregate(born.rowsB, (r) => String(r.Country ?? ""), "Foreign-Born Citizens"),
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
  <div class="grid gap-4 md:grid-cols-2">
    <Skeleton class="h-96 w-full rounded-lg" />
    <Skeleton class="h-96 w-full rounded-lg" />
  </div>
{:else}
  <div class="grid gap-4 md:grid-cols-2">
    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Race &amp; ethnicity</Card.Title>
        <Card.Description class="text-xs">
          {year} · {asPercent ? "share of each place’s total population" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={raceRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={10} />
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-1">
        <Card.Title class="text-base">Where the foreign-born were born</Card.Title>
        <Card.Description class="text-xs">
          Foreign-born residents by country of birth, {year} · {asPercent ? "share of each place’s foreign-born population" : "raw counts"}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <CompareBars
          rows={birthRows}
          labelA={a.caption}
          labelB={b.caption}
          fmt={fmtCompact}
          percent={asPercent}
          maxRows={10} />
      </Card.Content>
    </Card.Root>
  </div>
{/if}
