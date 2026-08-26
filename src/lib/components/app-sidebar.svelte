<script lang="ts" module>
  import { page } from "$app/state";
  const data = {
    navMain: [
      {
        title: "Projects",
        url: "/projects",
        items: [
          {
            title: "My Portfolio",
            url: "about-my-portfolio",
          },
          {
            title: "Sabermetric Seer",
            url: "sabermetric-seer",
          },
          {
            title: "Fantasy Football",
            url: "fantasy-football",
          },
          {
            title: "March Madness",
            url: "march-madness",
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
            title: "LinkedIn",
            url: "linkedin",
          },
          {
            title: "Contact Me!",
            url: "contact-me",
          },
        ],
      },
    ],
  };

  function openGithub() {
    window.open("https://github.com/larsomic", "_blank");
  }
  function openLinkedIn() {
    window.open("https://www.linkedin.com/in/larson2/", "_blank");
  }
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
                    <a
                      href={item.url}
                      {...props}
                      onclick={(e) => {
                        if (item.url === "github") {
                          e.preventDefault();
                          openGithub();
                        } else if (item.url === "linkedin") {
                          e.preventDefault();
                          openLinkedIn();
                        } else {
                          return;
                        }
                      }}>{item.title}</a
                    >
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
