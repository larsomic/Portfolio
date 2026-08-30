# Agents - Svelte & shadcn-svelte Guide

This document provides context on how to work with this SvelteKit + shadcn-svelte project.

---

## Tech Stack

- **Framework**: SvelteKit 2.x
- **UI Library**: shadcn-svelte v1.5.0
- **Styling**: Tailwind CSS v4.3.0 (Tailwind v4)
- **Icons**: Tabler Icons Svelte
- **Table**: TanStack Svelte Table v9.1.2
- **Date**: `@internationalized/date` v3.12.3
- **Theme**: Sera (shadcn-svelte baseColor: "mist")

---

## Project Structure

```
src/
├── app.d.ts                    # App-level TypeScript declarations
├── app.html                   # App HTML template
└── routes/
    ├── +layout.svelte         # Root layout with sidebar, breadcrumbs, mode watcher
    ├── +page.svelte           # Home page
    ├── layout.css             # Layout styles
    └── [dynamic-routes]/       # Route pages
        └── +page.svelte
└── lib/
    ├── index.ts               # Barrel exports
    ├── config/
    │   └── routes.ts          # Navigation routes config
    ├── hooks/
    │   └── is-mobile.svelte.ts # Mobile detection hook
    ├── utils.ts               # Utility functions (cn, type helpers)
    └── components/
        ├── ui/                # shadcn-svelte components
        │   ├── sidebar/       # Sidebar component (radix-ui + shadcn)
        │   ├── tooltip/       # Tooltip component
        │   ├── calendar/      # Calendar component
        │   ├── input/         # Input component
        │   ├── skeleton/      # Skeleton loading component
        │   ├── separator/     # Separator component
        │   ├── label/         # Label component
        │   ├── dropdown-menu/ # Dropdown menu component
        │   ├── popover/       # Popover component
        │   ├── button/        # Button component
        │   ├── table/         # Table component
        │   ├── breadcrumb/    # Breadcrumb component
        │   ├── sheet/         # Sheet/Modal component
        │   └── ...
        └── app-sidebar.svelte  # Custom sidebar wrapper
```

---

## SvelteKit Conventions

### Route Structure

- **Pages**: `src/routes/[slug]/+page.svelte`
- **Layouts**: `src/routes/[slug]/+layout.svelte` (optional, inherits from root)
- **Dynamic routes**: `src/routes/sabermetric-seer/transactions/+page.svelte`

### Layout (`src/routes/+layout.svelte`)

The root layout provides:

- **Sidebar**: Collapsible sidebar with navigation
- **Header**: Breadcrumbs + logo
- **Mode Switcher**: `mode-watcher` for dark/light mode
- **Children**: Route page content

```svelte
<!-- src/routes/+layout.svelte -->
<ModeWatcher />
<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ms-1" />
      <Separator orientation="vertical" class="me-2 h-4" />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item class="hidden md:block">
            <Breadcrumb.Link href="/">Michael Larson</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator class="hidden md:block" />
          <Breadcrumb.Item>
            <Breadcrumb.Page>{page}</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4">
      {@render children()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
```

### Creating New Routes

```bash
# Create a new route
npx sv create my-new-page --template minimal --types ts

# Or manually
mkdir src/routes/my-new-page
touch src/routes/my-new-page/+page.svelte
```

---

## shadcn-svelte Usage

### Component Registration

Components are auto-generated in `src/lib/components/ui/`:

```bash
# Add a new component
npx shadcn-svelte add button

# Add multiple components
npx shadcn-svelte add button input label separator
```

### Component Structure

Each shadcn component follows this pattern:

```
├── component.svelte          # Main component
├── index.ts                  # Barrel export
└── (optional) *.svelte       # Sub-components (e.g., tooltip-content.svelte)
```

### Component Props

All shadcn components accept these props:

```svelte
<script lang="ts">
  import * as Component from "$lib/components/ui/component-name/index.js";
  import type { ComponentProps } from "svelte";
  
  let {
    ref = $bindable(null),
    ...restProps
  }: ComponentProps<typeof Component> = $props();
</script>

<Component {...restProps} bind:ref>
  <!-- Component content -->
</Component>
```

### Common Patterns

#### 1. Wrapper Components

```svelte
<!-- src/lib/components/ui/button/index.svelte -->
<script lang="ts">
  import * as Button from "./button.svelte";
  import type { ComponentProps } from "svelte";
  
  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Button> = $props();
</script>

<Button.Root {...restProps} bind:ref>
  {@render children?.()}
</Button.Root>
```

#### 2. Dialog/Sheet Pattern

```svelte
<!-- src/lib/components/ui/sheet/index.svelte -->
<script lang="ts">
  import * as Sheet from "./sheet.svelte";
  import type { ComponentProps } from "svelte";
  
  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sheet> = $props();
</script>

<Sheet.Root bind:open={ref} {...restProps}>
  <Sheet.Trigger {...restProps}>
    {@render children?.()}
  </Sheet.Trigger>
  <Sheet.Content bind:ref {...restProps}>
    <!-- Content -->
  </Sheet.Content>
</Sheet.Root>
```

#### 3. Tooltip Pattern

```svelte
<!-- src/lib/components/ui/tooltip/index.svelte -->
<script lang="ts">
  import * as Tooltip from "./tooltip.svelte";
  import type { ComponentProps } from "svelte";
  
  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Tooltip> = $props();
</script>

<Tooltip.Root open={ref} bind:open {...restProps}>
  <Tooltip.Trigger {...restProps}>
    {@render children?.()}
  </Tooltip.Trigger>
  <Tooltip.Content bind:ref>
    <!-- Content -->
  </Tooltip.Content>
</Tooltip.Root>
```

---

## Sidebar Component

### Usage

```svelte
<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import type { ComponentProps } from "svelte";
  
  let {
    ref = $bindable(null),
    side = "left",
    variant = "sidebar",
    collapsible = "offcanvas",
    ...restProps
  }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {...restProps} bind:ref>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton>
          <!-- Menu content -->
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <!-- Content -->
  </Sidebar.Content>
  <Sidebar.Rail />
</Sidebar.Root>
```

### Sidebar Parts

| Part | Description |
| ------ | ------------- |
| `Sidebar.Root` | Container for the entire sidebar |
| `Sidebar.Header` | Header section |
| `Sidebar.Menu` | Menu section |
| `Sidebar.MenuItem` | Menu item wrapper |
| `Sidebar.MenuButton` | Clickable menu button |
| `Sidebar.Content` | Main content area |
| `Sidebar.Rail` | Mobile rail for navigation |
| `Sidebar.Inset` | Wrapper for desktop layout |
| `Sidebar.Trigger` | Toggle button |
| `Sidebar.Group` | Group items together |
| `Sidebar.GroupLabel` | Group label |
| `Sidebar.GroupContent` | Group content wrapper |
| `Sidebar.Inset` | Desktop layout wrapper |

### Sidebar States

```svelte
<!-- Toggle sidebar -->
<Sidebar.Root bind:ref collapsible="offcanvas" />

<!-- Check if sidebar is open -->
{#if sidebar.open}
  <!-- Content -->
{/if}

<!-- Bind to parent -->
<Sidebar.Root bind:ref bind:open={parentOpen} (v) => parentSetOpen(v) />
```

### Mobile Detection

```svelte
<script lang="ts">
  import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
  
  const isMobile = new IsMobile();
</script>

{#if isMobile.current}
  <!-- Mobile layout -->
{:else}
  <!-- Desktop layout -->
{/if}
```

---

## Utility Functions

### `cn()` - Class Merger

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Usage

```svelte
<button class={cn("btn", variant === "primary" && "btn-primary")} />
<div class={cn("flex", items?.length && "items-center")} />
```

### Type Helpers

```typescript
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
```

---

## Navigation Config

### Routes Configuration

```typescript
// src/lib/config/routes.ts
export interface NavLink {
  title: string;
  slug: string;
  isExternal?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavLink[];
}

export type NavItem = NavLink | NavGroup;

export const ROUTES: NavGroup[] = [
  {
    title: "Projects",
    items: [
      { title: "My Portfolio", slug: "about-my-portfolio" },
      { title: "Sabermetric Seer", slug: "sabermetric-seer" },
      { title: "Fantasy Football", slug: "fantasy-football" },
      { title: "March Madness", slug: "march-madness" },
    ],
  },
  {
    title: "Links",
    items: [
      { title: "GitHub", slug: "github", isExternal: true },
      { title: "LinkedIn", slug: "linkedin", isExternal: true },
      { title: "Contact Me!", slug: "contact-me" },
    ],
  },
];
```

### Helper Functions

```typescript
export function isNavGroup(item: NavItem): item is NavGroup {
  return 'items' in item;
}

export function getHref(link: NavLink): string {
  if (link.isExternal) return link.slug;
  return link.slug ? `/${link.slug}` : '/';
}

export function getAllLinks(routes: NavItem[]): NavLink[] {
  return routes.flatMap((item) => (isNavGroup(item) ? item.items : [item]));
}
```

---

## Component Examples

### Button

```svelte
<!-- src/lib/components/ui/button/button.svelte -->
<button
  type={type}
  class={cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    size === "default" && "h-10 px-4 py-2",
    size === "sm" && "h-9 rounded-md px-3",
    size === "lg" && "h-11 rounded-md px-8",
    size === "icon" && "h-10 w-10",
    disabled && "pointer-events-none opacity-50"
  )}
  {...restProps}
  {#if type === "submit"}
    use:form
  {:else}
    on:{event}
  {/if}
>
  {@render default?.() ?? (label ? () => <span>{label}</span> : null)}
</button>
```

### Input

```svelte
<!-- src/lib/components/ui/input/input.svelte -->
<input
  type={type}
  class={cn(
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...restProps}
>
```

### Table

```svelte
<!-- src/lib/components/ui/table/table.svelte -->
<div
  class={cn(
    "w-full caption-side-top border-collapse caption-text-foreground",
    className
  )}
>
  <TableCaption {...restProps}>{@render caption?.()}</TableCaption>
  <thead class="[&_tr]:border-b">
    <TableHeader {...restProps}>{@render header?.()}</TableHeader>
  </thead>
  <tbody class="[&_tr]:border-b">
    <TableBody {...restProps}>{@render body?.()}</TableBody>
  </tbody>
  <tfoot class="[&_tr]:border-b">
    <TableFooter {...restProps}>{@render footer?.()}</TableFooter>
  </tfoot>
</div>
```

---

## Date Handling

```typescript
// @internationalized/date
import { CalendarDate, CalendarDateTime } from "@internationalized/date";

// Create date
const date = new CalendarDate(2024, 1, 15);

// Format date
import { formatCalendarDate } from "@internationalized/date";
const formatted = formatCalendarDate(date, "en-US");
```

---

## Mode Switcher

```bash
# Install mode-watcher
npm install mode-watcher
```

```svelte
<!-- src/routes/+layout.svelte -->
<ModeWatcher />
```

```svelte
<!-- Custom mode switcher -->
<script>
  import { ModeWatcher } from "mode-watcher";
</script>

<ModeWatcher
  mode={mode}
  on:modechange={e => setMode(e.detail.mode)}
  class="mode-switcher"
>
  <ModeWatcher.Sun />
  <ModeWatcher.Moon />
</ModeWatcher>
```

---

## Development Workflow

### Scripts

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch",
    "lint": "eslint .",
    "test:unit": "vitest",
    "test": "npm run test:unit -- --run"
  }
}
```

### Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check for errors
npm run check

# Run linter
npm run lint

# Run tests
npm test
```

---

## Common Patterns

### Conditional Rendering

```svelte
{#if condition}
  <!-- Content -->
{:else if condition2}
  <!-- Alternative content -->
{:else}
  <!-- Default content -->
{/if}

{#each array as item (item.id)}
  <div>{item.name}</div>
{/each}

{@render callback?.() ?? () => "default"}
```

### Event Handling

```svelte
<button on:click={() => handleClick()}>
  Click me
</button>

<input bind:value={value} on:input={(e) => handleInput(e)} />
```

### Bindables

```svelte
<!-- Parent -->
<Child bind:someProp={value} (v) => value = v />

<!-- Child -->
<script>
  let {
    someProp = $bindable(null),
    ...restProps
  } = $props();
</script>
```

### Async State

```svelte
<script>
  let { data = $bindable(null) } = $props();
  
  $: isLoading = data === null;
  $: isError = data instanceof Error;
</script>

{#if isLoading}
  <Skeleton />
{:else if isError}
  <p class="text-error">Error: {data.message}</p>
{:else}
  <div>{data.title}</div>
{/if}
```

---

## Tips & Gotchas

### 1. Component Aliases

shadcn-svelte sets up these aliases in `tsconfig.json`:

```json
{
  "$lib/components": "$lib/components",
  "$lib/components/ui": "$lib/components/ui",
  "$lib/hooks": "$lib/hooks",
  "$lib": "$lib",
  "$types": "$types"
}
```

### 2. Import Paths

```typescript
// ✅ Correct
import * as Button from "$lib/components/ui/button/index.js";
import { cn } from "$lib/utils.js";

// ❌ Wrong
import Button from "$lib/components/ui/button";
```

### 3. TypeScript Types

```typescript
import type { ButtonProps } from "$lib/components/ui/button/index.js";
import type { ComponentProps } from "svelte";
```

### 4. Shadcn Component Props

All shadcn components accept:

```typescript
{
  ref?: Ref | null,
  class?: string,
  ...component-specific props
}
```

### 5. Adding New Components

```bash
# Add a component
npx shadcn-svelte add button

# Component gets added to src/lib/components/ui/button/
# Barrel export at src/lib/components/ui/button/index.ts
```

### 6. Removing Components

```bash
npx shadcn-svelte remove button
```

### 7. Updating Components

```bash
npx shadcn-svelte update button
```

---

## Troubleshooting

### Component Not Showing

1. Check import path: `"$lib/components/ui/button/index.js"`
2. Check barrel export exists: `src/lib/components/ui/button/index.ts`
3. Check Tailwind classes are correct

### TypeScript Errors

1. Ensure `$lib` alias is in `tsconfig.json`
2. Check component props match shadcn types
3. Use `ComponentProps<typeof Component>` for generic typing

### Styling Issues

1. Check Tailwind config: `tailwind.config.js`
2. Check base color matches theme: `"mist"`
3. Ensure CSS is imported in `app.html`

---

## References

- [SvelteKit Docs](https://kit.svelte.dev/)
- [shadcn-svelte Docs](https://shadcn-svelte.com/)
- [Svelte Docs](https://svelte.dev/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives/)
