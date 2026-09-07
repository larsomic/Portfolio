<script lang="ts">
  import { IconExternalLink } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import {
    fmtRelative,
    readApiError,
    type NewsItem,
  } from "$lib/alpaca.js";

  let { symbol }: { symbol: string } = $props();

  const LIMIT = 7;

  let items = $state<NewsItem[]>([]);
  let loading = $state(true);
  let notice = $state<string | null>(null);

  let controller: AbortController | undefined;

  $effect(() => {
    const s = symbol;
    void load(s);
  });

  $effect(() => () => controller?.abort());

  async function load(sym: string): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    loading = true;
    notice = null;
    items = [];
    try {
      const res = await fetch(
        `/api/market/news?symbol=${encodeURIComponent(sym)}&limit=${LIMIT}`,
        { signal: controller.signal },
      );
      if (!res.ok) {
        const err = await readApiError(res);
        notice = err.message;
        return;
      }
      const body = (await res.json()) as { news: NewsItem[] };
      items = Array.isArray(body.news) ? body.news : [];
    } catch {
      // Aborted on symbol change — the next request already owns the view.
    } finally {
      if (!controller?.signal.aborted) loading = false;
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Why it's moving</Card.Title>
    <Card.Description>
      Latest headlines tagged {symbol}, via Alpaca's newswire feed.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    {#if loading}
      <div class="grid gap-3">
        {#each Array(4) as _, i (i)}
          <Skeleton class="h-14 w-full" />
        {/each}
      </div>
    {:else if notice}
      <p class="text-muted-foreground text-sm">{notice}</p>
    {:else if items.length === 0}
      <p class="text-muted-foreground text-sm">
        No recent stories tagged {symbol}. Quiet day, or the wire doesn't cover
        it.
      </p>
    {:else}
      <ul class="grid gap-3">
        {#each items as item (item.id)}
          <li class="border-border grid gap-1 border-b pb-3 last:border-0">
            <div class="flex items-center gap-2 text-xs">
              <span class="font-semibold">{item.source}</span>
              <span class="text-muted-foreground">{fmtRelative(item.publishedAt)}</span>
            </div>
            {#if item.url}
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                class="hover:text-primary flex items-start gap-1.5 font-medium leading-snug underline-offset-4 transition-colors hover:underline"
              >
                {item.headline}
                <IconExternalLink class="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
              </a>
            {:else}
              <p class="font-medium leading-snug">{item.headline}</p>
            {/if}
            {#if item.summary}
              <p class="text-muted-foreground text-sm leading-relaxed">
                {item.summary}
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </Card.Content>
</Card.Root>
