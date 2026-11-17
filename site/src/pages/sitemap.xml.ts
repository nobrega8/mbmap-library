import { pageHref } from "../lib/base.ts";
// Every page of the site, in every language that has it, each with links to
// its other-language versions. Device pages carry the date of their map's last
// revision, when the map gives one. Pages that are only English under another
// language (the long prose pages of a language without them, untranslated guides) are left out.
import type { APIRoute } from "astro";
import { registry } from "../lib/registry.ts";
import { GUIDES } from "../lib/guides.ts";
import { guideSource } from "../lib/markdown.ts";
import { localizeUrl } from "../lib/base.ts";
import { LOCALES, LOCALE_TAG, PROSE_LOCALES, type Locale } from "../i18n/locales.ts";

export const GET: APIRoute = ({ site }) => {
  const { devices, manufacturers, commitDate } = registry();
  const abs = (path: string) => new URL(path, site).href;
  /** A page in every language, with the alternate links; `only` limits the languages */
  const page = (at: (l: Locale) => string, lastmod?: string | null, only: readonly Locale[] = LOCALES) =>
    only
      .map((l) => {
        const links = only.map((o) => `<xhtml:link rel="alternate" hreflang="${LOCALE_TAG[o]}" href="${abs(at(o))}"/>`).join("");
        return `<url><loc>${abs(at(l))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${only.length > 1 ? links : ""}</url>`;
      })
      .join("\n");
  const route = (path: string, lastmod?: string | null, only?: readonly Locale[]) => page((l) => pageHref(path, l), lastmod, only);
  const urls = [
    route("/", commitDate),
    route("/devices", commitDate),
    route("/manufacturers", commitDate),
    route("/guides"),
    ...GUIDES.map((g) => route(`/guides/${g.slug}`, null, LOCALES.filter((l) => guideSource(g.slug, l)?.translated))),
    ...["/spec", "/compatibility", "/contribute", "/about", "/terms", "/privacy"].map((p) => route(p, null, PROSE_LOCALES)),
    ...manufacturers.map((m) => page((l) => localizeUrl(m.url, l))),
    ...devices.map((d) => page((l) => localizeUrl(d.url, l), d.info.revised ?? d.added?.slice(0, 10))),
  ];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
