<script lang="ts">
  import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { cn } from "$lib/utils.js";
  import {
    fmtCompact,
    fmtDate,
    fmtPct,
    fmtPrice,
    readApiError,
    type OptionRow,
  } from "$lib/alpaca.js";

  interface OptionsPayload {
    symbol: string;
    expiry: string | null;
    calls: OptionRow[];
    puts: OptionRow[];
  }

  let { symbol, spot = null }: { symbol: string; spot?: number | null } =
    $props();

  let expiry = $state<string | null>(null);
  let calls = $state<OptionRow[]>([]);
  let puts = $state<OptionRow[]>([]);
  let loading = $state(true);
  let notice = $state<string | null>(null);

  let controller: AbortController | undefined;

  // Rows are per-strike; align calls/puts on the union of their strikes so a
  // missing leg still leaves the other side readable.
  const grid = $derived.by(() => {
    const strikes = [...new Set([...calls.map((c) => c.strike), ...puts.map((p) => p.strike)])].sort(
      (a, b) => a - b,
    );
    const byStrike = new Map<string, OptionRow>();
    const byStrikeP = new Map<string, OptionRow>();
    for (const c of calls) byStrike.set(`${c.strike}`, c);
    for (const p of puts) byStrikeP.set(`${p.strike}`, p);
    return strikes.map((strike) => ({
      strike,
      call: byStrike.get(`${strike}`) ?? null,
      put: byStrikeP.get(`${strike}`) ?? null,
    }));
  });

  // Reactive fetch: reruns when the symbol or spot price changes.
  const s = $derived(symbol);
  const p = $derived(spot);
  $effect(() => {
    void load(s, p);
  });

  $effect(() => () => controller?.abort());

  async function load(sym: string, spotPrice: number | null): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    loading = true;
    notice = null;
    try {
      const params = new URLSearchParams({ symbol: sym });
      if (spotPrice !== null && Number.isFinite(spotPrice)) {
        params.set("spot", String(spotPrice));
      }
      const res = await fetch(`/api/market/options?${params}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await readApiError(res);
        calls = [];
        puts = [];
        expiry = null;
        notice = err.message;
        return;
      }
      const body = (await res.json()) as OptionsPayload;
      expiry = body.expiry;
      calls = Array.isArray(body.calls) ? body.calls : [];
      puts = Array.isArray(body.puts) ? body.puts : [];
    } catch {
      // Aborted or offline: keep whatever is on screen.
    } finally {
      if (!controller?.signal.aborted) loading = false;
    }
  }

  // The strike closest to the underlying's price gets highlighted as ATM.
  const atmStrike = $derived.by<number | null>(() => {
    if (spot === null || grid.length === 0) return null;
    return grid.reduce(
      (best, g) =>
        Math.abs(g.strike - spot) < Math.abs(best - spot) ? g.strike : best,
      grid[0]!.strike,
    );
  });

  function changeClass(n: number | null): string {
    return (n ?? 0) >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  }

  function legCell(row: OptionRow | null, itm: boolean): string {
    return cn(
      "px-2 py-1.5 text-right font-mono text-xs tabular-nums",
      row === null && "text-muted-foreground",
      itm && "bg-primary/5",
    );
  }

  /** Hover detail for a leg: bid × ask, IV, and last-session volume. */
  function legTitle(row: OptionRow | null): string | undefined {
    if (!row) return undefined;
    const bits: string[] = [];
    if (row.bid !== null && row.ask !== null) {
      bits.push(`bid ${fmtPrice(row.bid)} × ask ${fmtPrice(row.ask)}`);
    }
    if (row.ivPct !== null) bits.push(`IV ${row.ivPct.toFixed(1)}%`);
    if (row.volume !== null) bits.push(`${fmtCompact(row.volume)} traded`);
    return bits.length ? bits.join(" · ") : undefined;
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Options chain · {symbol}</Card.Title>
    <Card.Description>
      {#if expiry}
        Nearest expiration · {fmtDate(new Date(`${expiry}T12:00:00Z`).getTime(), true)}
      {:else}
        End-of-day option quotes (IEX feed), last session.
      {/if}
    </Card.Description>
  </Card.Header>

  <Card.Content>
    {#if loading}
      <div class="grid gap-2">
        {#each Array(7) as _, i (i)}
          <Skeleton class="h-8 w-full" />
        {/each}
      </div>
    {:else if notice}
      <p class="text-muted-foreground text-sm">{notice}</p>
    {:else if grid.length === 0}
      <p class="text-muted-foreground text-sm">
        No listed options came back for {symbol}.
      </p>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr class="text-muted-foreground text-[11px] uppercase tracking-wide">
              <th class="px-2 py-1 text-right font-medium">Call · last</th>
              <th class="px-2 py-1 text-center font-medium">Strike</th>
              <th class="px-2 py-1 text-right font-medium">Put · last</th>
            </tr>
          </thead>
          <tbody>
            {#each grid as row (row.strike)}
              {@const callItm = spot !== null && row.strike < spot}
              {@const putItm = spot !== null && row.strike > spot}
              <tr>
                <td
                  class={legCell(row.call, callItm)}
                  title={legTitle(row.call)}
                >
                  {#if row.call}
                    {fmtPrice(row.call.last)}
                    {#if row.call.changePct !== null}
                      <span
                        class={cn(
                          "ml-1 inline-flex items-center gap-0.5",
                          changeClass(row.call.changePct),
                        )}
                      >
                        {#if (row.call.changePct ?? 0) >= 0}
                          <IconArrowUpRight class="size-3" />
                        {:else}
                          <IconArrowDownRight class="size-3" />
                        {/if}
                        {fmtPct(row.call.changePct)}
                      </span>
                    {/if}
                  {:else}
                    —
                  {/if}
                </td>
                <td
                  class={cn(
                    "border-border border-x px-2 py-1.5 text-center font-mono text-xs font-semibold tabular-nums",
                    row.strike === atmStrike && "bg-secondary font-bold",
                  )}
                >
                  {fmtPrice(row.strike)}
                </td>
                <td
                  class={legCell(row.put, putItm)}
                  title={legTitle(row.put)}
                >
                  {#if row.put}
                    {fmtPrice(row.put.last)}
                    {#if row.put.changePct !== null}
                      <span
                        class={cn(
                          "ml-1 inline-flex items-center gap-0.5",
                          changeClass(row.put.changePct),
                        )}
                      >
                        {#if (row.put.changePct ?? 0) >= 0}
                          <IconArrowUpRight class="size-3" />
                        {:else}
                          <IconArrowDownRight class="size-3" />
                        {/if}
                        {fmtPct(row.put.changePct)}
                      </span>
                    {/if}
                  {:else}
                    —
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <p class="text-muted-foreground mt-3 text-xs">
        Shaded rows are in the money; the bold strike is nearest at-the-money.
        Volume traded last session: calls
        {fmtCompact(calls.reduce((sum, c) => sum + (c.volume ?? 0), 0))} · puts
        {fmtCompact(puts.reduce((sum, p2) => sum + (p2.volume ?? 0), 0))}. Data
        from the Alpaca Market Data API. Nothing here is investment advice.
      </p>
    {/if}
  </Card.Content>
</Card.Root>
