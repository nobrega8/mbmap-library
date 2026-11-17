// Markdown files of the library (SPEC.md, COMPATIBILITY.md) rendered at
// build time. Relative links point back to the file's neighbours on GitHub,
// tables scroll on their own, and JSON blocks are coloured like raw maps.

import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { BRANCH, REPO_URL, libraryFile, rawUrl } from "./registry.ts";
import { highlightJson } from "./json-highlight.ts";
import { href, pageHref } from "./base.ts";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locales.ts";

let processor: ReturnType<typeof createMarkdownProcessor> | null = null;

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

const unescape = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** A library document in a language (docs/<locale>/<name>), or the English one when it has not been translated. */
export async function renderLibraryMarkdown(name: string, locale: Locale = DEFAULT_LOCALE): Promise<{ html: string; title: string; headings: Heading[]; translated: boolean } | null> {
  const own = locale === DEFAULT_LOCALE ? null : libraryFile(`docs/${locale}/${name}`);
  const src = own ?? libraryFile(name);
  if (src == null) return null;
  const translated = own != null || locale === DEFAULT_LOCALE;
  processor ??= createMarkdownProcessor({ syntaxHighlight: false, gfm: true, smartypants: false });
  // The page draws its own title
  const title = /^# (.*)\n/.exec(src)?.[1]?.replace(/`/g, "") ?? name;
  const body = src.replace(/^# .*\n+/, "");
  const { code, metadata } = await (await processor).render(body);
  const html = code
    .replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (_, path: string) => {
      const kind = path.endsWith("/") ? "tree" : "blob";
      return `href="${REPO_URL}/${kind}/${BRANCH}/${path.replace(/^\.\//, "")}"`;
    })
    // Relative images: the library's assets/ are served by the site itself
    .replace(/src="(?!https?:|data:)([^"]+)"/g, (_, path: string) => {
      const p = path.replace(/^\.\//, "");
      return `src="${p.startsWith("assets/") ? href(`/library/${p}`) : rawUrl(p)}"`;
    })
    .replace(/<table>/g, '<div class="table-wrap"><table class="table md">')
    .replace(/<\/table>/g, "</table></div>")
    .replace(
      /<pre><code class="language-json">([\s\S]*?)<\/code><\/pre>/g,
      (_, c: string) => `<pre class="json"><code>${highlightJson(unescape(c))}</code></pre>`,
    );
  return { html, title, headings: metadata.headings as Heading[], translated };
}

/** A guide from docs/guides/, with links to other guides and site pages kept on the site. */
/** The source of a guide in a language, or the English one when it has not been translated. */
export function guideSource(slug: string, locale: Locale = DEFAULT_LOCALE): { src: string; translated: boolean } | null {
  const own = locale === DEFAULT_LOCALE ? null : libraryFile(`docs/guides/${locale}/${slug}.md`);
  if (own != null) return { src: own, translated: true };
  const en = libraryFile(`docs/guides/${slug}.md`);
  return en == null ? null : { src: en, translated: locale === DEFAULT_LOCALE };
}

export async function renderGuide(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<{ html: string; title: string; headings: Heading[]; translated: boolean } | null> {
  const found = guideSource(slug, locale);
  if (found == null) return null;
  const { src, translated } = found;
  processor ??= createMarkdownProcessor({ syntaxHighlight: false, gfm: true, smartypants: false });
  const title = /^# (.*)\n/.exec(src)?.[1]?.replace(/`/g, "") ?? slug;
  const body = src.replace(/^# .*\n+/, "");
  const { code, metadata } = await (await processor).render(body);
  const html = code
    .replace(/href="(?!https?:|#|mailto:)([^"]+)"/g, (_, path: string) =>
      path.startsWith("/") ? `href="${pageHref(path, locale)}"` : `href="${pageHref(`/guides/${path.replace(/\.md$/, "")}`, locale)}"`,
    )
    .replace(/<table>/g, '<div class="table-wrap"><table class="table md">')
    .replace(/<\/table>/g, "</table></div>");
  return { html, title, headings: metadata.headings as Heading[], translated };
}

/** The first paragraph of a guide, for its description and the guide list. */
export function guideSummary(slug: string, locale: Locale = DEFAULT_LOCALE): string {
  const src = guideSource(slug, locale)?.src ?? "";
  const para = src.replace(/^# .*\n+/, "").split(/\n\n/)[0] ?? "";
  return para.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*`]/g, "").replace(/\s+/g, " ").trim();
}
