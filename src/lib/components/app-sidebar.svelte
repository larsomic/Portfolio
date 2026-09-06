<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  import { page } from "$app/state";
  import { ROUTES, getHref, type NavLink } from "$lib/config/routes.js";
  import { useSidebar } from "$lib/components/ui/sidebar/context.svelte.js";
  import { IconChevronDown } from "@tabler/icons-svelte";
  import { cn } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();

  function isActive(link: NavLink): boolean {
    return page.url.pathname === getHref(link);
  }

  function isParentActive(link: NavLink): boolean {
    const href = getHref(link);
    return (
      page.url.pathname.startsWith(href + "/") ||
      (link.items?.some((child) => isActive(child)) ?? false)
    );
  }

  const sidebar = useSidebar();

  /**
   * Manual expand/collapse overrides, keyed by parent title. When there is
   * no override, a section is open exactly when it (or one of its children)
   * is the current page — so the active section always shows itself.
   */
  let toggles = $state<Record<string, boolean>>({});

  function hasChildren(link: NavLink): boolean {
    return !!link.items && link.items.length > 0;
  }

  function isOpen(link: NavLink): boolean {
    return toggles[link.title] ?? (isParentActive(link) || isActive(link));
  }

  function toggle(link: NavLink) {
    toggles[link.title] = !isOpen(link);
  }

  // Navigating into a section re-expands it, clearing any stale override.
  // Reactivity: isParentActive/isActive below read page.url.pathname,
  // so this effect re-runs on every navigation.
  $effect(() => {
    for (const group of ROUTES) {
      for (const item of group.items) {
        if (hasChildren(item) && (isParentActive(item) || isActive(item))) {
          delete toggles[item.title];
        }
      }
    }
  });

  function handleClick(e: MouseEvent, link: NavLink) {
    if (link.isExternal) {
      e.preventDefault();
      window.open(link.slug, "_blank", "noopener,noreferrer");
    }
    // Close the slide-out menu after clicking a link on mobile only
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  }
</script>

<Sidebar.Root {...restProps} bind:ref>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
          {#snippet child({ props })}
            <a
              href="/"
              {...props}
              onclick={() => {
                if (sidebar.isMobile) sidebar.setOpenMobile(false);
              }}>
              <span class="text-base font-semibold">Michael Larson</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    {#each ROUTES as group (group.title)}
      <Sidebar.Group>
        <Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each group.items as item (item.title)}
              <Sidebar.MenuItem data-sidebar="menu-item">
                <!-- Parent row: link + toggle stay on one line -->
                <div class="flex w-full items-center">
                  <Sidebar.MenuButton
                    isActive={isActive(item) || isParentActive(item)}
                    class={hasChildren(item) ? "min-w-0 flex-1" : undefined}
                  >
                    {#snippet child({ props })}
                      <a
                        href={getHref(item)}
                        {...props}
                        onclick={(e) => handleClick(e, item)}
                      >{item.title}</a>
                    {/snippet}
                  </Sidebar.MenuButton>
                  {#if hasChildren(item)}
                    <button
                      type="button"
                      class="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
                      aria-label={isOpen(item)
                        ? `Collapse ${item.title} menu`
                        : `Expand ${item.title} menu`}
                      aria-expanded={isOpen(item)}
                      onclick={() => toggle(item)}
                    >
                      <IconChevronDown
                        class={cn(
                          "size-4 transition-transform duration-200",
                          isOpen(item) && "rotate-180",
                        )}
                      />
                    </button>
                  {/if}
                </div>
                {#if item.items && isOpen(item)}
                  <Sidebar.MenuSub>
                    {#each item.items as sub (sub.title)}
                      <Sidebar.MenuSubItem>
                        <Sidebar.MenuSubButton
                          isActive={isActive(sub)}
                          size="sm"
                        >
                          {#snippet child({ props })}
                            <a
                              href={getHref(sub)}
                              {...props}
                              onclick={(e) => handleClick(e, sub)}
                            >{sub.title}</a>
                          {/snippet}
                        </Sidebar.MenuSubButton>
                      </Sidebar.MenuSubItem>
                    {/each}
                  </Sidebar.MenuSub>
                {/if}
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
