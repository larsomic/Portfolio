<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconRefresh,
    IconStar,
    IconStarFilled,
  } from "@tabler/icons-svelte";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import PriceChart from "$lib/components/market/price-chart.svelte";
  import SymbolSearch from "$lib/components/market/symbol-search.svelte";
  import MoversCard from "$lib/components/market/movers-card.svelte";
  import NewsCard from "$lib/components/market/news-card.svelte";
  import OptionsCard from "$lib/components/market/options-card.svelte";
  import { cn } from "$lib/utils.js";
  import {
    fmtCompact,
    fmtDate,
    fmtPct,
    fmtPrice,
    fmtTime,
    indexed,
    isMinuteRange,
    isRangeKey,
    readApiError,
    RANGES,
    SETUP_HINT,
    trailingYield,
    type Bar,
    type BarsPayload,
    type ChartRow,
    type ChartSeries,
    type CorpActions,
    type Quote,
    type RangeKey,
  } from "$lib/alpaca.js";
  import SEO from "$lib/components/seo.svelte";

  const SYMBOL_RE = /^[A-Z][A-Z.-]{0,9}$/;
  /** Benchmark used for the "growth of $100" overlay. */
  const BENCH = "SPY";
  const WATCHLIST_KEY = "mike-larson-portfolio:watchlist";
  const DEFAULT_WATCHLIST = ["SPY", "QQQ", "NVDA", "AAPL", "TSLA"];

  const SERIES_COLOR = "var(--chart-1)";
  const BENCH_COLOR = "var(--chart-4)";

  /* ------------------------------------------------------------------ state */
  // `page.url.searchParams` throws during prerender — only read it in the browser.
  const initialParams = new URLSearchParams(
    browser ? page.url.searchParams : "",
  );
  const initialSymbol = (initialParams.get("symbol") ?? "")
    .toUpperCase()
    .trim();
  const initialRange = initialParams.get("range");

  let symbol = $state(
    SYMBOL_RE.test(initialSymbol) ? initialSymbol : DEFAULT_WATCHLIST[2]!,
  );
  let range = $state<RangeKey>(isRangeKey(initialRange) ? initialRange : "6M");
  let compare = $state(true);

  let payload = $state<BarsPayload | null>(null);
  let benchBars = $state<Bar[]>([]);
  let chartLoading = $state(true);
  let chartError = $state<string | null>(null);
  let setupNeeded = $state(false);

  let watchlist = $state<string[]>(DEFAULT_WATCHLIST);
  let quotes = $state<Quote[]>([]);
  let corp = $state<CorpActions | null>(null);

  const inWatchlist = $derived(watchlist.includes(symbol));
  const stats = $derived(payload?.stats ?? null);
  const lastBar = $derived(
    payload && payload.bars.length ? payload.bars[payload.bars.length - 1]! : null,
  );
  const intraday = $derived(payload !== null && isMinuteRange(payload.range));
  const trailingYieldPct = $derived(
    corp && stats?.last != null
      ? trailingYield(corp.dividends, stats.last)
      : null,
  );

  /* --------------------------------------------------------------- chart data */
  const chartRows = $derived.by<ChartRow[]>(() => {
    const p = payload;
    const bars = p?.bars ?? [];
    if (bars.length === 0) return [];

    // Intraday: x labels are clock times (Eastern) and the benchmark joins on
    // the bar's exact timestamp rather than its calendar day.
    if (p && isMinuteRange(p.range)) {
      const solo = (): ChartRow[] =>
        bars.map((b) => ({ date: fmtTime(b.time), price: b.close }));
      if (!compare || benchBars.length === 0) return solo();

      const benchByTime = new Map(benchBars.map((b) => [b.time, b.close]));
      const common = bars.filter((b) => benchByTime.has(b.time));
      if (common.length < 2) return solo();
      const baseP = common[0]!.close;
      const baseB = benchByTime.get(common[0]!.time)!;
      if (!baseP || !baseB) return solo();
      return common.map((b) => ({
        date: fmtTime(b.time),
        price: Number(((b.close / baseP) * 100).toFixed(2)),
        bench: Number(((benchByTime.get(b.time)! / baseB) * 100).toFixed(2)),
      }));
    }

    if (!compare || benchBars.length === 0) {
      return bars.map((b) => ({ date: b.date, price: b.close }));
    }

    // Index both series off their first shared session, so the comparison is
    // shape-vs-shape ("growth of $100") instead of two different dollar scales.
    const benchByDate = new Map(benchBars.map((b) => [b.date, b.close]));
    const common = bars.filter((b) => benchByDate.has(b.date));
    if (common.length < 2) {
      return bars.map((b) => ({ date: b.date, price: b.close }));
    }
    const primary = indexed(common);
    const bench = indexed(
      benchBars.filter((b) => common.some((c) => c.date === b.date)),
    );
    const benchValue = new Map(bench.map((p) => [p.date, p.value]));
    return primary.map((p) => ({
      date: p.date,
      price: Number(p.value.toFixed(2)),
      bench: Number((benchValue.get(p.date) ?? p.value).toFixed(2)),
    }));
  });

  const chartSeries = $derived.by<ChartSeries[]>(() => {
    const comparing = compare && benchBars.length > 0;
    return comparing
      ? [
          { key: "price", label: symbol, color: SERIES_COLOR },
          { key: "bench", label: `${BENCH} benchmark`, color: BENCH_COLOR },
        ]
      : [{ key: "price", label: `${symbol} close`, color: SERIES_COLOR }];
  });

  const comparing = $derived(compare && benchBars.length > 0);

  /* ------------------------------------------------------------------- load */
  let chartController: AbortController | undefined;
  let quoteController: AbortController | undefined;
  let corpController: AbortController | undefined;

  $effect(() => {
    if (!browser) return;
    const s = symbol;
    const r = range;
    const wantsBench = compare;
    void loadChart(s, r, wantsBench);
  });

  $effect(() => {
    if (!browser) return;
    const symbols = watchlist.join(",");
    void loadQuotes(symbols);
  });

  $effect(() => () => {
    chartController?.abort();
    quoteController?.abort();
    corpController?.abort();
  });

  $effect(() => {
    if (!browser) return;
    const s = symbol;
    void loadCorp(s);
  });

  async function loadChart(
    s: string,
    r: RangeKey,
    wantsBench: boolean,
  ): Promise<void> {
    chartController?.abort();
    chartController = new AbortController();
    const signal = chartController.signal;
    chartLoading = true;
    chartError = null;

    try {
      const primary = await requestBars(s, r, signal);
      if (signal.aborted) return;
      payload = primary;
      setupNeeded = false;

      if (!wantsBench) {
        benchBars = [];
      } else {
        try {
          const bench = await requestBars(BENCH, r, signal);
          if (!signal.aborted) benchBars = bench.bars;
        } catch {
          // A missing benchmark is a one-line chart, not a broken page.
          benchBars = [];
        }
      }
    } catch (error) {
      if (signal.aborted) return;
      payload = null;
      benchBars = [];
      chartError = errorMessage(error);
      setupNeeded = /ALPACA_API/.test(chartError ?? "");
    } finally {
      if (!signal.aborted) chartLoading = false;
    }
  }

  async function requestBars(
    s: string,
    r: RangeKey,
    signal: AbortSignal,
  ): Promise<BarsPayload> {
    const res = await fetch(
      `/api/market/bars?symbol=${encodeURIComponent(s)}&range=${r}`,
      { signal },
    );
    if (!res.ok) {
      const err = await readApiError(res);
      throw new Error(err.message);
    }
    return (await res.json()) as BarsPayload;
  }

  async function loadQuotes(symbols: string): Promise<void> {
    quoteController?.abort();
    quoteController = new AbortController();
    try {
      const res = await fetch(`/api/market/quotes?symbols=${encodeURIComponent(symbols)}`, {
        signal: quoteController.signal,
      });
      if (!res.ok) return;
      const body = (await res.json()) as { quotes: Quote[] };
      quotes = Array.isArray(body.quotes) ? body.quotes : [];
    } catch {
      // Watchlist prices are decoration; stay silent on failure.
    }
  }

  async function loadCorp(s: string): Promise<void> {
    corpController?.abort();
    corpController = new AbortController();
    corp = null;
    try {
      const res = await fetch(
        `/api/market/corporate-actions?symbol=${encodeURIComponent(s)}`,
        { signal: corpController.signal },
      );
      if (!res.ok) return;
      corp = (await res.json()) as CorpActions;
    } catch {
      // Dividends and splits are a bonus section; stay silent on failure.
    }
  }

  function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Chart request failed.";
  }

  /* -------------------------------------------------------------- interaction */
  function select(next: string): void {
    const s = next.toUpperCase().trim();
    if (!SYMBOL_RE.test(s) || s === symbol) return;
    symbol = s;
    void syncUrl();
  }

  function setRange(next: string): void {
    if (!isRangeKey(next) || next === range) return;
    range = next;
    void syncUrl();
  }

  function toggleCompare(): void {
    compare = !compare;
    void loadChart(symbol, range, compare);
    void syncUrl();
  }

  function toggleWatchlist(): void {
    if (watchlist.includes(symbol)) {
      watchlist = watchlist.filter((s) => s !== symbol);
    } else {
      watchlist = [symbol, ...watchlist].slice(0, 12);
    }
    // Refetch so the new chip has a price immediately.
    void loadQuotes(watchlist.join(","));
  }

  async function syncUrl(): Promise<void> {
    if (!browser) return;
    const params = new URLSearchParams();
    params.set("symbol", symbol);
    params.set("range", range);
    if (compare) params.set("bench", "1");
    await goto(`${page.url.pathname}?${params.toString()}`, {
      replaceState: true,
      noScroll: true,
      invalidateAll: false,
    });
  }

  /* ------------------------------------------------- watchlist persistence */
  $effect(() => {
    if (!browser) return;
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (!saved) return;
      const parsed = (JSON.parse(saved) as unknown[])
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.toUpperCase())
        .filter((v) => SYMBOL_RE.test(v))
        .slice(0, 12);
      if (parsed.length > 0) watchlist = parsed;
    } catch {
      // Corrupt or unavailable storage: keep the defaults.
    }
  });

  $effect(() => {
    if (!browser) return;
    const list = watchlist;
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    } catch {
      // Private mode: the chips just won't survive a reload.
    }
  });

  const quoteFor = (s: string): Quote | undefined =>
    quotes.find((q) => q.symbol === s);

  function changeClass(n: number | null | undefined): string {
    return (n ?? 0) >= 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  }
</script>

<SEO title="Market Pulse · Michael Larson" description="End-of-day US equities explorer built on the Alpaca Market Data API: daily bars, a growth-of-$100 benchmark overlay, top movers, and newswire headlines for any symbol." />

<svelte:head>
  <meta name="robots" content="index,follow" />
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-4">
  <!-- Header -->
  <section class="flex flex-col gap-3">
    <Badge variant="outline" class="w-fit rounded-full px-3">
      Market data · Alpaca API
    </Badge>
    <h1 class="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
      Market Pulse
    </h1>
    <p class="text-muted-foreground max-w-2xl">
      A small, honest market explorer: daily bars off Alpaca's IEX feed, a
      growth-of-$100 benchmark overlay, the day's biggest movers, and whatever
      the newswire said about your ticker. No advice, no hype — just the data
      and a chart you can actually read.
    </p>
  </section>

  {#if setupNeeded}
    <Card.Root class="border-amber-500/40 bg-amber-500/5">
      <Card.Header>
        <Card.Title>Market data isn't wired up yet</Card.Title>
        <Card.Description>{SETUP_HINT}</Card.Description>
      </Card.Header>
    </Card.Root>
  {/if}

  <!-- Watchlist -->
  <section class="flex flex-col gap-2">
    <div
      class="flex items-center gap-2 overflow-x-auto p-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {#each watchlist as s (s)}
        {@const quote = quoteFor(s)}
        <button
          type="button"
          class={cn(
            "hover:bg-accent hover:text-accent-foreground flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
            s === symbol
              ? "bg-secondary font-semibold"
              : "text-muted-foreground",
          )}
          onclick={() => select(s)}
        >
          <span class="font-mono">{s}</span>
          {#if quote?.changePct != null}
            <span
              class={cn("font-mono text-xs tabular-nums", changeClass(quote.changePct))}
            >
              {fmtPct(quote.changePct)}
            </span>
          {/if}
        </button>
      {/each}
      <Button
        variant="ghost"
        size="sm"
        class="shrink-0 gap-1.5"
        onclick={toggleWatchlist}
      >
        {#if inWatchlist}
          <IconStarFilled class="text-amber-500 size-4" />
          Remove {symbol}
        {:else}
          <IconStar class="size-4" />
          Add {symbol}
        {/if}
      </Button>
    </div>
  </section>

  <!-- Explorer -->
  <Card.Root>
    <Card.Header>
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Card.Title class="flex items-center gap-2">
            <span class="font-mono text-2xl">{symbol}</span>
            {#if lastBar}
              <span class="text-muted-foreground text-sm font-normal">
                as of {fmtDate(lastBar.time, true)}{intraday
                  ? ` · ${fmtTime(lastBar.time)}`
                  : ""}
              </span>
            {/if}
          </Card.Title>
          {#if stats?.last != null}
            <div class="mt-1 flex items-baseline gap-3">
              <span class="font-mono text-3xl font-semibold tabular-nums">
                {fmtPrice(stats.last)}
              </span>
              {#if stats.changePct !== null && stats.change !== null}
                <span
                  class={cn(
                    "flex items-center gap-0.5 font-mono text-sm tabular-nums",
                    changeClass(stats.changePct),
                  )}
                >
                  {#if stats.changePct >= 0}
                    <IconArrowUpRight class="size-4" />
                  {:else}
                    <IconArrowDownRight class="size-4" />
                  {/if}
                  {fmtPrice(Math.abs(stats.change))} · {fmtPct(stats.changePct)}
                </span>
              {/if}
            </div>
          {/if}
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <SymbolSearch onPick={select} />
          <div class="bg-muted flex rounded-md p-0.5">
            {#each RANGES as r (r)}
              <button
                type="button"
                class={cn(
                  "rounded px-2.5 py-1 font-mono text-xs transition-colors",
                  r === range
                    ? "bg-background text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onclick={() => setRange(r)}
              >
                {r}
              </button>
            {/each}
          </div>
          <Button
            variant={compare ? "secondary" : "outline"}
            size="sm"
            onclick={toggleCompare}
          >
            {compare ? `vs ${BENCH}` : `Add ${BENCH}`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="gap-1.5"
            onclick={() => void loadChart(symbol, range, compare)}
          >
            <IconRefresh class="size-4" />
            Refresh
          </Button>
        </div>
      </div>
    </Card.Header>

    <Card.Content>
      {#if chartLoading}
        <Skeleton class="h-72 w-full" />
      {:else if chartError}
        <p class="text-muted-foreground py-10 text-center text-sm">
          {chartError}
        </p>
      {:else if chartRows.length === 0}
        <p class="text-muted-foreground py-10 text-center text-sm">
          No bars to draw for {symbol}. Try another symbol or a wider range.
        </p>
      {:else}
        <PriceChart rows={chartRows} series={chartSeries} />
      {/if}

      {#if stats && payload}
        <dl class="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div>
            <dt class="text-muted-foreground text-xs">Period</dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtPct(stats.periodChangePct)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Day range</dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtPrice(stats.dayLow)} – {fmtPrice(stats.dayHigh)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Volume</dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtCompact(stats.volume)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">
              {intraday ? "Avg day vol" : "Avg vol (20d)"}
            </dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtCompact(stats.avgVolume)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Period high</dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtPrice(stats.periodHigh)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Period low</dt>
            <dd class="font-mono text-sm tabular-nums">
              {fmtPrice(stats.periodLow)}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">
              {intraday ? "Minutes plotted" : "Sessions plotted"}
            </dt>
            <dd class="font-mono text-sm tabular-nums">
              {payload.bars.length}
            </dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-xs">Benchmark</dt>
            <dd class="font-mono text-sm tabular-nums">
              {comparing ? `${BENCH}, indexed to 100` : "off"}
            </dd>
          </div>
        </dl>

        {#if corp && (corp.dividends.length > 0 || corp.splits.length > 0)}
          <div class="mt-6 border-t pt-4">
            <div class="flex flex-wrap items-center gap-2">
              <h3
                class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Dividends & splits
              </h3>
              {#if trailingYieldPct !== null}
                <Badge variant="secondary" class="font-mono text-[11px]">
                  Trailing yield {trailingYieldPct.toFixed(2)}%
                </Badge>
              {/if}
            </div>

            {#if corp.dividends.length > 0}
              <ul
                class="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5"
              >
                {#each corp.dividends.slice(0, 5) as d (d.exDate)}
                  <li class="text-sm">
                    <span class="font-mono tabular-nums"
                      >{fmtPrice(d.amountPerShare)}</span>
                    <span
                      class="text-muted-foreground ml-1 text-xs"
                    >
                      ex {fmtDate(new Date(d.exDate).getTime(), true)}
                      {#if d.special}(special){/if}</span
                    >
                  </li>
                {/each}
              </ul>
            {/if}

            {#if corp.splits.length > 0}
              <ul
                class="text-muted-foreground mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-xs"
              >
                {#each corp.splits.slice(0, 3) as s (`${s.date}-${s.to}`)}
                  <li>
                    <span class="font-mono">{s.to}-for-{s.from}</span>
                    split · {fmtDate(new Date(s.date).getTime(), true)}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}

        <p class="text-muted-foreground mt-4 text-xs">
          {comparing
            ? `Both lines are rebased to 100 at their first shared ${intraday ? "timestamp" : "session"}, so the gap between them is the whole story.`
            : intraday
              ? "Minute bars from the most recent trading session (IEX feed). Toggle the benchmark for a shape-vs-shape comparison."
              : "Prices are end-of-day closes (IEX feed). Toggle the benchmark to compare shapes instead of dollar amounts."} Data from the Alpaca Market Data API. Nothing here is investment advice.
        </p>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Options chain for the selected symbol -->
  <OptionsCard {symbol} spot={stats?.last ?? null} />

  <!-- Movers + news -->
  <div class="grid gap-4 lg:grid-cols-2">
    <MoversCard onPick={select} />
    <NewsCard {symbol} />
  </div>
</div>
