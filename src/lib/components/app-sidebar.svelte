<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  import { page } from "$app/state";
  import { ROUTES, getHref, type NavLink } from "$lib/config/routes.js";
  import { useSidebar } from "$lib/components/ui/sidebar/context.svelte.js";

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
            <a href="/" {...props}>
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
                <Sidebar.MenuButton
                  isActive={isActive(item) || isParentActive(item)}
                >
                  {#snippet child({ props })}
                    <a
                      href={getHref(item)}
                      {...props}
                      onclick={(e) => handleClick(e, item)}
                    >{item.title}</a>
                  {/snippet}
                </Sidebar.MenuButton>
                {#if item.items}
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
