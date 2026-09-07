import type { RequestHandler } from "@sveltejs/kit";
import { getAllLinks, ROUTES } from "$lib/config/routes.js";

const ORIGIN = "https://mike-larson.me";

/** Static routes that exist but aren't in the sidebar nav config. */
const EXTRA_PATHS = ["/", "/resume"];

export const GET = (async () => {
  const paths = new Set<string>(EXTRA_PATHS);
  for (const link of getAllLinks(ROUTES)) {
    if (!link.isExternal && link.slug) paths.add(`/${link.slug}`);
  }

  const urls = [...paths]
    .sort()
    .map((loc) => `  <url><loc>${ORIGIN}${loc === "/" ? "/" : loc}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}) satisfies RequestHandler;
