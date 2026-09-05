<script lang="ts">
  import { IconAlertTriangle, IconHome, IconRefresh } from "@tabler/icons-svelte";
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { page } from "$app/state";

  const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{isNotFound ? "Not found" : "Something broke"} · Michael Larson</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
  <Card.Root class="w-full max-w-md">
    <Card.Header>
      <p class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <IconAlertTriangle class="size-4" />
        Error {page.status}
      </p>
      <Card.Title class="text-3xl">
        {isNotFound ? "404 — page not found" : "Something went wrong"}
      </Card.Title>
      <Card.Description class="mt-1">
        {#if isNotFound}
          That route doesn't exist (yet). Try one of the projects from the home
          page.
        {:else}
          {page.error?.message ??
            "An unexpected error occurred while rendering this page."}
        {/if}
      </Card.Description>
    </Card.Header>
    <Card.Footer class="flex-row gap-2">
      <Button onclick={() => window.location.reload()}>
        <IconRefresh /> Retry
      </Button>
      <a href="/">
        <Button variant="outline">
          <IconHome /> Back home
        </Button>
      </a>
    </Card.Footer>
  </Card.Root>
</div>
