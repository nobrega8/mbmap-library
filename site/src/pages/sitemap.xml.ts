import { href } from "../lib/base.ts";
// Every page of the site. Device pages carry the date of their map's last
// revision, when the map gives one.
import type { APIRoute } from "astro";
import { registry } from "../lib/registry.ts";

export const GET: APIRoute = ({ site }) => {
  const { devices, manufacturers, commitDate } = registry();
  const url = (path: string, lastmod?: string | null) =>
    `<url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
  const urls = [
    url(href("/"), commitDate),
    url(href("/devices"), commitDate),
    url(href("/manufacturers"), commitDate),
    url(href("/spec")),
    url(href("/compatibility")),
    url(href("/contribute")),
    url(href("/about")),
    ...manufacturers.map((m) => url(m.url)),
    ...devices.map((d) => url(d.url, d.info.revised ?? d.added?.slice(0, 10))),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
