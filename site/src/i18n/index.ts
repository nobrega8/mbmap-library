// Translations. `t()` falls back to English, so a missing key shows English
// text instead of a hole. Strings may hold {name} placeholders.

import { LOCALE_TAG, type Locale } from "./locales.ts";
import { en } from "./en.ts";
import { pt } from "./pt.ts";
import { zh } from "./zh.ts";
import { hi } from "./hi.ts";
import { es } from "./es.ts";

export type Key = keyof typeof en;
const DICT: Record<Locale, Partial<Record<Key, string>>> = { en, pt, zh, hi, es };

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: Key, vars?: Vars): string {
  const s = DICT[locale][key] ?? en[key];
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** A translator bound to a language. */
export function useT(locale: Locale) {
  return (key: Key, vars?: Vars) => translate(locale, key, vars);
}

/** "3 devices": the noun is a key with "one" and "many" forms (key.one, key.many). */
export function count(locale: Locale, n: number, base: string): string {
  const num = n.toLocaleString(LOCALE_TAG[locale]);
  const key = `${base}.${n === 1 ? "one" : "many"}` as Key;
  // Chinese puts no space between the number and the measure word.
  return `${num}${locale === "zh" ? "" : " "}${translate(locale, key)}`;
}

/** The dictionary of a language as it goes to the browser scripts. */
export function clientStrings(locale: Locale, keys: readonly Key[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, translate(locale, k)]));
}
