<script lang="ts">
  import { page } from "$app/state";

  let {
    title,
    description,
  }: {
    /** Full title, already in "Page · Michael Larson" form. */
    title: string;
    /** Meta description — also reused for OG/Twitter descriptions. */
    description: string;
  } = $props();

  const SITE_NAME = "Michael Larson";
  const ORIGIN = "https://mike-larson.me";
  const OG_IMAGE = `${ORIGIN}/images/seattle-waterfront.jpg`;

  /** Absolute canonical URL for the current page. */
  const canonical = $derived(
    page.url.pathname === "/"
      ? `${ORIGIN}/`
      : ORIGIN + page.url.pathname,
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />

  <!-- Open Graph (LinkedIn / Slack / Facebook / messengers) -->
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={OG_IMAGE} />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={OG_IMAGE} />
</svelte:head>
