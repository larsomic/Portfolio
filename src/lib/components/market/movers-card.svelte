<script lang="ts">
  import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils.js";
  import { fmtCompact, fmtPct, fmtPrice, readApiError, type MoverRow } from "$lib/alpaca.js";

  type Kind = "gainers" | "losers" | "active";

  const TABS: { value: Kind; label: string }[] = [
    { value: "gainers", label: "Gainers" },
    { value: "losers", label: "Losers" },
    { value: "active", label: "Most active" },
  ];

  let { onPick }: { onPick: (symbol: string) => void } = $props();

  let kind = $state<Kind>("gainers");
  let rows = $state<MoverRow[]>([]);
  let loading = $state(true);
  let notice = $state<string | null>(null);

  let controller: AbortController | undefined;

  $effect(() => {
    const which = kind;
    void load(which);
  });

  $effect(() => () => controller?.abort());

  async function load(which: Kind): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    loading = true;
    notice = null;
    try {
      const res = await fetch(`/api/market/movers?kind=${which}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = await readApiError(res);
        rows = [];
        notice = err.message;
        return;
      }
      const body = (await res.json()) as { movers: MoverRow[] };
      rows = Array.isArray(body.movers) ? body.movers : [];
    } catch {
      // Aborted requests are expected when switching tabs quickly.
    } finally {
      if (!controller?.signal.aborted) loading = false;
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Where the day is happening</Card.Title>
    <Card.Description>
      US equities, screened live. Click a row to load it above.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Tabs.Root bind:value={kind}>
      <Tabs.List class="flex-wrap justify-start">
        {#each TABS as tab (tab.value)}
          <Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
        {/each}
      </Tabs.List>

      {#each TABS as tab (tab.value)}
        <Tabs.Content value={tab.value} class="pt-3">
          {#if loading}
            <div class="grid gap-2">
              {#each Array(6) as _, i (i)}
                <Skeleton class="h-8 w-full" />
              {/each}
            </div>
          {:else if notice}
            <p class="text-muted-foreground text-sm">{notice}</p>
          {:else if rows.length === 0}
            <p class="text-muted-foreground text-sm">
              Nothing came back for this screen. Markets may be closed, or the
              screener isn't on your Alpaca plan.
            </p>
          {:else}
            <ul class="grid gap-1">
              {#each rows as row (row.symbol)}
                <li>
                  <button
                    type="button"
                    class="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    onclick={() => onPick(row.symbol)}
                  >
                    <span class="font-mono font-semibold">{row.symbol}</span>
                    <span class="flex items-center gap-2">
                      {#if kind === "active"}
                        <span
                          class="text-muted-foreground font-mono text-xs tabular-nums"
                        >
                          {fmtCompact(row.volume)} sh
                        </span>
                      {:else}
                        <span
                          class="text-muted-foreground font-mono text-xs tabular-nums"
                        >
                          {fmtPrice(row.price)}
                        </span>
                      {/if}
                      <span
                        class={cn(
                          "flex items-center gap-0.5 font-mono text-xs tabular-nums",
                          (row.changePct ?? 0) >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {#if (row.changePct ?? 0) >= 0}
                          <IconArrowUpRight class="size-3.5" />
                        {:else}
                          <IconArrowDownRight class="size-3.5" />
                        {/if}
                        {fmtPct(row.changePct)}
                      </span>
                    </span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </Tabs.Content>
      {/each}
    </Tabs.Root>
  </Card.Content>
</Card.Root>
