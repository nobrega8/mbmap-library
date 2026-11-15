// The language of the page, for the browser scripts. Base.astro sets
// data-locale on <html>; the dictionaries are the same ones the build uses.

import { translate, type Key, type Vars } from "../i18n/index.ts";
import { isLocale, DEFAULT_LOCALE, type Locale } from "../i18n/locales.ts";

const attr = document.documentElement.dataset.locale;
export const locale: Locale = isLocale(attr) ? attr : DEFAULT_LOCALE;

export const t = (key: Key, vars?: Vars) => translate(locale, key, vars);
