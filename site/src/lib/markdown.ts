// Markdown files of the library (SPEC.md, COMPATIBILITY.md) rendered at
// build time. Relative links point back to the file's neighbours on GitHub,
// tables scroll on their own, and JSON blocks are coloured like raw maps.

import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { BRANCH, REPO_URL, libraryFile, rawUrl } from "./registry.ts";
import { highlightJson } from "./json-highlight.ts";
import { href } from "./base.ts";

let processor: ReturnType<typeof createMarkdownProcessor> | null = null;

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

const unescape = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

export async function renderLibraryMarkdown(name: string): Promise<{ html: string; title: string; headings: Heading[] } | null> {
  const src = libraryFile(name);
  if (src == null) return null;
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
  return { html, title, headings: metadata.headings as Heading[] };
}
