// The languages of the site. English is the default and lives at the root
// of the site; every other locale lives under its own prefix (/pt/, /zh/, /hi/, /es/, /fr/, /bn/, /ru/, /de/, /tr/, /th/, /hu/, /id/, /nl/).
// Imports nothing, so the build and the browser scripts can share it.

export const LOCALES = ["en", "pt", "zh", "hi", "es", "fr", "bn", "ru", "de", "tr", "th", "hu", "id", "nl"] as const;
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
  bn: "বাংলা",
  ru: "Русский",
  de: "Deutsch",
  tr: "Türkçe",
  th: "ไทย",
  hu: "Magyar",
  id: "Bahasa Indonesia",
  nl: "Nederlands",
};

/** BCP 47 tag for `lang`, Open Graph and date formatting. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
  zh: "zh-CN",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  bn: "bn-BD",
  ru: "ru-RU",
  de: "de-DE",
  tr: "tr-TR",
  th: "th-TH",
  hu: "hu-HU",
  id: "id-ID",
  nl: "nl-NL",
};

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_GB",
  pt: "pt_PT",
  zh: "zh_CN",
  hi: "hi_IN",
  es: "es_ES",
  fr: "fr_FR",
  bn: "bn_BD",
  ru: "ru_RU",
  de: "de_DE",
  tr: "tr_TR",
  th: "th_TH",
  hu: "hu_HU",
  id: "id_ID",
  nl: "nl_NL",
};

/** The flag shown next to each language: the file name in assets/flags/ (served at /library/assets/flags/<name>.png). */
export const LOCALE_FLAG: Record<Locale, string> = {
  en: "united-kingdom",
  pt: "portugal",
  zh: "china",
  hi: "india",
  es: "spain",
  fr: "france",
  bn: "bangladesh",
  ru: "russia",
  de: "germany",
  tr: "turkey",
  th: "thailand",
  hu: "hungary",
  id: "indonesia",
  nl: "netherlands",
};

/** Languages that have the long prose pages (About, Contribute, Specification, Compatibility, Terms, Privacy). */
export const PROSE_LOCALES: readonly Locale[] = ["en", "pt", "zh", "hi", "es", "fr", "bn", "ru", "de", "tr", "th", "hu", "id", "nl"];

export function isLocale(v: unknown): v is Locale {
  return LOCALES.includes(v as Locale);
}
