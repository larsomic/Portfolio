<script lang="ts">
  import { page } from "$app/state";
  import { IconBrandGithub } from "@tabler/icons-svelte";
  import { Button } from "$lib/components/ui/button/index.js";

  /**
   * Route segments that belong to a project. On these pages we surface a
   * "View source" link pointing at the matching folder in the GitHub repo
   * (all projects live in this monorepo under src/routes/).
   */
  const PROJECT_SEGMENTS = new Set([
    "sabermetric-seer",
    "fantasy-football",
    "march-madness",
    "us-population-comparer",
    "colorado-data",
    "denver-accidents",
  ]);

  const REPO_BASE = "https://github.com/larsomic/Portfolio/tree/main/src/routes";

  /** Deep link to the project folder, e.g. /march-madness/cinderella → …/march-madness */
  const sourceHref = $derived.by(() => {
    const segment = page.url.pathname.split("/")[1];
    if (!segment || !PROJECT_SEGMENTS.has(segment)) return null;
    return `${REPO_BASE}/${segment}`;
  });
</script>

{#if sourceHref}
  <a
    href={sourceHref}
    target="_blank"
    rel="noreferrer"
    class="ml-auto shrink-0"
    aria-label="View this project's source code on GitHub"
  >
    <Button variant="ghost" size="sm">
      <IconBrandGithub />
      <span class="hidden sm:inline">View source</span>
    </Button>
  </a>
{/if}
