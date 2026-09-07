// Fully static page — no server data needed per request. Prerendered at
// build time so first visits skip the Netlify Function entirely (faster
// TTFB, cheaper, better Lighthouse scores).
export const prerender = true;
