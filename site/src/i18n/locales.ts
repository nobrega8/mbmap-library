// The languages of the site. English is the default and lives at the root
// of the site; every other locale lives under its own prefix (/pt/).
// Imports nothing, so the build and the browser scripts can share it.

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Name of each language in that language, for the switcher. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

/** BCP 47 tag for `lang`, Open Graph and date formatting. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
};

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  pt: "pt_PT",
};

export function isLocale(v: unknown): v is Locale {
  return LOCALES.includes(v as Locale);
}
