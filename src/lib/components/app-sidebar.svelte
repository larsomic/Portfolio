<script lang="ts" module>
  import { page } from "$app/state";
  const data = {
    navMain: [
      {
        title: "Projects",
        url: "/projects",
        items: [
          {
            title: "Routing",
            url: "goodbye",
          },
          {
            title: "Data Fetching",
            url: "hello",
          },
        ],
      },
      {
        title: "Links",
        url: "/links",
        items: [
          {
            title: "GitHub",
            url: "github",
          },
          {
            title: "Contact Me!",
            url: "contact-me",
          },
        ],
      },
    ],
  };
</script>

<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {...restProps} bind:ref>
  <Sidebar.Header></Sidebar.Header>
  <Sidebar.Content>
    {#each data.navMain as group (group.title)}
      <Sidebar.Group>
        <Sidebar.GroupLabel>{group.title}</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            {#each group.items as item (item.title)}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={"/" + item.url === page.url.pathname}
                >
                  {#snippet child({ props })}
                    <a href={item.url} {...props}>{item.title}</a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/each}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    {/each}
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
