<script lang="ts">
  import { IconPhoto } from "@tabler/icons-svelte";

  let {
    src,
    alt = "",
    className = "",
    hint = "",
  }: {
    src: string;
    alt?: string;
    className?: string;
    /** Shown in the placeholder, e.g. "static/images/card.jpg". */
    hint?: string;
  } = $props();

  let failed = $state(false);
</script>

<div class="relative h-full w-full overflow-hidden {className}">
  {#if failed}
    <div
      class="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style="background: linear-gradient(140deg, #7dd3fc33 0%, #fbbf2433 50%, #a78bfa33 100%)"
    >
      <IconPhoto class="text-muted-foreground size-8" />
      {#if hint}
        <span class="text-muted-foreground text-center font-mono text-[10px]">
          {hint}
        </span>
      {/if}
    </div>
  {:else}
    <img
      {src}
      {alt}
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
      onerror={() => (failed = true)}
    />
  {/if}
</div>
