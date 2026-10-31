// Manufacturer icons, found as Modbench finds them (src-tauri/src/online.rs):
// the icon links of the vendor_website home page, best first, then the usual
// favicon paths, on the host with and without "www.". Fetched at build time
// and served from the site, so visitors never contact the vendors' sites.
// Cached in .cache/vendor-icons; a site without an icon is asked again after
// RETRY_MISSING. MBMAP_ICONS=0 skips the network (offline builds).

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { registry, siteRoot } from "./registry.ts";
import { href } from "./base.ts";

const MAX_PAGE_BYTES = 1024 * 1024;
const MAX_ICON_BYTES = 512 * 1024;
const TIMEOUT_MS = 8000;
const RETRY_MISSING = 7 * 24 * 60 * 60 * 1000;
const PARALLEL = 12;
const UA = "Mozilla/5.0 (compatible; MBMapRegistry/1.0; +https://github.com/nobrega8/mbmap-library)";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/x-icon": "ico",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** The image type of an icon file, from its first bytes. */
function imageType(b: Uint8Array): string | null {
  const starts = (...xs: number[]) => xs.every((x, i) => b[i] === x);
  if (starts(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (starts(0, 0, 1, 0)) return "image/x-icon";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (starts(0xff, 0xd8)) return "image/jpeg";
  if (b.length > 12 && starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return "image/webp";
  const head = new TextDecoder().decode(b.slice(0, 1024)).toLowerCase();
  return head.includes("<svg") ? "image/svg+xml" : null;
}

function attributes(tag: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of tag.matchAll(/([a-zA-Z-]+)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g)) {
    out.set(m[1]!.toLowerCase(), (m[2] ?? "").replace(/^["']|["']$/g, ""));
  }
  return out;
}

/** Icon links in a page, best first: SVG, then larger sizes, then touch icons. */
export function iconLinks(html: string): string[] {
  const found: [number, string][] = [];
  for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
    const a = attributes(m[1]!);
    const rel = (a.get("rel") ?? "").toLowerCase();
    const link = a.get("href");
    if (!link || !rel.split(/\s+/).some((r) => r === "icon" || r === "apple-touch-icon")) continue;
    const size = Math.max(0, ...(a.get("sizes") ?? "").split(/\s+/).map((d) => parseInt(d, 10) || 0));
    const svg = link.toLowerCase().endsWith(".svg") || a.get("type") === "image/svg+xml";
    found.push([svg ? 1000 : size > 0 ? size : rel.includes("apple-touch-icon") ? 180 : 16, link]);
  }
  return found.sort((x, y) => y[0] - x[0]).map(([, l]) => l);
}

async function get(url: URL, cap: number, headOnly = false): Promise<{ url: URL; type: string; body: Uint8Array } | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok || !r.body) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    const reader = r.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
      if (size > cap) {
        reader.cancel().catch(() => {});
        if (!headOnly) return null;
        break;
      }
      if (headOnly && new TextDecoder().decode(value).toLowerCase().includes("</head>")) {
        reader.cancel().catch(() => {});
        break;
      }
    }
    const body = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      body.set(c.subarray(0, Math.min(c.length, size - at)), at);
      at += c.length;
      if (at >= size) break;
    }
    return { url: new URL(r.url), type: r.headers.get("content-type") ?? "", body };
  } catch {
    return null;
  }
}

async function iconFromSite(home: URL): Promise<Uint8Array | null> {
  const candidates: URL[] = [];
  const page = await get(home, MAX_PAGE_BYTES, true);
  if (page && (page.type.includes("html") || !page.type)) {
    for (const l of iconLinks(new TextDecoder().decode(page.body))) {
      try {
        candidates.push(new URL(l, page.url));
      } catch {}
    }
  }
  for (const p of ["/favicon.ico", "/favicon.png", "/favicon.svg", "/apple-touch-icon.png"]) candidates.push(new URL(p, home));
  for (const url of candidates.slice(0, 8)) {
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    const r = await get(url, MAX_ICON_BYTES);
    if (r && imageType(r.body)) return r.body;
  }
  return null;
}

function homeOf(website: string): URL | null {
  try {
    const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    return new URL(`${u.protocol}//${u.host}/`);
  } catch {
    return null;
  }
}

async function fetchIcon(home: URL): Promise<Uint8Array | null> {
  const variants = [home];
  const alt = home.hostname.startsWith("www.") ? home.hostname.slice(4) : `www.${home.hostname}`;
  variants.push(new URL(`${home.protocol}//${alt}/`));
  for (const v of variants) {
    const found = await iconFromSite(v);
    if (found) return found;
  }
  return null;
}

export interface VendorIcon {
  /** File name under /icons/ */
  file: string;
  bytes: Uint8Array;
}

async function iconFor(cacheDir: string, website: string): Promise<VendorIcon | null> {
  const home = homeOf(website);
  if (!home) return null;
  const host = home.hostname.replace(/[^a-z0-9.-]/gi, "_");
  const cached = join(cacheDir, host);
  try {
    const bytes = new Uint8Array(readFileSync(cached));
    const type = imageType(bytes);
    if (type) return { file: `${host}.${EXT[type]}`, bytes };
    // An empty file marks a site without an icon; ask again later
    if (Date.now() - statSync(cached).mtimeMs < RETRY_MISSING) return null;
  } catch {}
  if (process.env.MBMAP_ICONS === "0") return null;
  const bytes = await fetchIcon(home);
  writeFileSync(cached, bytes ?? new Uint8Array());
  const type = bytes && imageType(bytes);
  return bytes && type ? { file: `${host}.${EXT[type]}`, bytes } : null;
}

let all: Promise<Map<string, VendorIcon>> | null = null;

/** Icons by manufacturer slug; manufacturers without one are left out. */
export function vendorIcons(): Promise<Map<string, VendorIcon>> {
  all ??= (async () => {
    const cacheDir = join(siteRoot(), ".cache", "vendor-icons");
    mkdirSync(cacheDir, { recursive: true });
    const makers = registry().manufacturers.filter((m) => m.website);
    const out = new Map<string, VendorIcon>();
    let next = 0;
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        while (next < makers.length) {
          const m = makers[next++]!;
          const icon = await iconFor(cacheDir, m.website!);
          if (icon) out.set(m.slug, icon);
        }
      }),
    );
    console.log(`[mbmap] icons for ${out.size} of ${registry().manufacturers.length} manufacturers`);
    return out;
  })();
  return all;
}

/** The URL of a manufacturer's icon on this site, if it has one. */
export async function vendorIconUrl(slug: string): Promise<string | undefined> {
  const icon = (await vendorIcons()).get(slug);
  return icon ? href(`/icons/${icon.file}`) : undefined;
}
