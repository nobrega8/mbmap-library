// The languages of the site. English is the default and lives at the root
// of the site; every other locale lives under its own prefix (/pt/, /zh/, /hi/, /es/, /fr/).
// Imports nothing, so the build and the browser scripts can share it.

export const LOCALES = ["en", "pt", "zh", "hi", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Name of each language in that language, for the switcher. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  zh: "简体中文",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
};

/** BCP 47 tag for `lang`, Open Graph and date formatting. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
};

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  pt: "pt_PT",
  zh: "zh_CN",
  hi: "hi_IN",
  es: "es_ES",
  fr: "fr_FR",
};

/** The flag shown next to each language: the file name in assets/flags/ (served at /library/assets/flags/<name>.png). */
export const LOCALE_FLAG: Record<Locale, string> = {
  en: "united-kingdom",
  pt: "portugal",
  zh: "china",
  hi: "india",
  es: "spain",
  fr: "france",
};

/** Languages that have the long prose pages (About, Contribute, Specification, Compatibility, Terms, Privacy). */
export const PROSE_LOCALES: readonly Locale[] = ["en", "pt", "zh", "hi", "es", "fr"];

export function isLocale(v: unknown): v is Locale {
  return LOCALES.includes(v as Locale);
}
