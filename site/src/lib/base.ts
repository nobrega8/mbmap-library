// The path the site is served under: "" at the root of a domain, or
// "/mbmap-library" on GitHub Pages. Every internal link goes through href()
// (shared files) or pageHref() (pages, which exist once per language).
// Works in the build and in the browser.

import { DEFAULT_LOCALE, type Locale } from "../i18n/locales.ts";

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

/** The same for a page, in a language: "/devices" in Portuguese is
    "/mbmap-library/pt/devices/". English stays at the root. */
export function pageHref(path: string, locale: Locale = DEFAULT_LOCALE): string {
  return href(locale === DEFAULT_LOCALE ? path : `/${locale}${path === "/" ? "" : path}`);
}

/** An address the registry already built (BASE + "/devices/x/y/") in a language. */
export function localizeUrl(url: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || !url.startsWith(BASE + "/")) return url;
  return `${BASE}/${locale}${url.slice(BASE.length)}`;
}

/** The address of the same page in English, from any language. */
export function stripLocale(pathname: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return pathname;
  const prefix = `${BASE}/${locale}`;
  if (pathname === prefix || pathname.startsWith(prefix + "/")) return BASE + (pathname.slice(prefix.length) || "/");
  return pathname;
}
