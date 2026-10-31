// The path the site is served under: "" at the root of a domain, or
// "/mbmap-library" on GitHub Pages. Every internal link goes through href().
// Works in the build and in the browser.

export const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/+$/, "");

/**
 * An internal path with the base in front. Pages get a trailing slash
 * ("/devices" → "/mbmap-library/devices/"); files ("/maps/x.mbmap.json")
 * and anchors are kept as they are.
 */
export function href(path: string): string {
  const [, page = "", rest = ""] = /^([^?#]*)(.*)$/.exec(path) ?? [];
  const last = page.split("/").pop() ?? "";
  const withSlash = page.endsWith("/") || last.includes(".") ? page : `${page}/`;
  return BASE + withSlash + rest;
}
