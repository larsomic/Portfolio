<script lang="ts">
  import "./layout.css";
  import { ModeWatcher } from "mode-watcher";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import SourceLink from "$lib/components/source-link.svelte";
  import favicon from "$lib/assets/favicon.svg";
  import { page } from "$app/state";
  import { getTitleForSlug } from "$lib/config/routes.js";

  let { children } = $props();

  // Hide the sidebar + header on the "/" page while iterating on the scene
  // SVGs. Flip to `true` to hide them again, or remove this flag entirely.
  const HIDE_CHROME_ON_HOMEPAGE = false;
  const hideChrome = $derived(HIDE_CHROME_ON_HOMEPAGE && page.url.pathname === "/");

  const crumbs = $derived(
    page.url.pathname
      .split("/")
      .filter(Boolean)
      .map((segment, i, segments) => ({
        href: "/" + segments.slice(0, i + 1).join("/"),
        title: getTitleForSlug(segment),
        isLast: i === segments.length - 1,
      })),
  );
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#131518" />
</svelte:head>
<ModeWatcher />
<Sidebar.Provider>
  {#if !hideChrome}
    <AppSidebar />
  {/if}
  <Sidebar.Inset class="min-w-0">
    {#if !hideChrome}
      <header
        class="relative z-20 flex min-h-16 shrink-0 items-center gap-2 border-b px-4 py-2"
      >
        <Sidebar.Trigger class="-ms-1" />
        <Separator orientation="vertical" class="me-2 h-4" />
        <Breadcrumb.Root class="min-w-0 flex-1 truncate">
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link href="/">Michael Larson</Breadcrumb.Link>
            </Breadcrumb.Item>

            {#each crumbs as crumb (crumb.href)}
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                {#if crumb.isLast}
                  <Breadcrumb.Page>{crumb.title}</Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link href={crumb.href}>{crumb.title}</Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
            {/each}
          </Breadcrumb.List>
        </Breadcrumb.Root>
        <SourceLink />
      </header>
    {/if}
    <div class="flex min-w-0 flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
