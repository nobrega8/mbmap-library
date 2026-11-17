// Translations. `t()` falls back to English, so a missing key shows English
// text instead of a hole. Strings may hold {name} placeholders.

import { LOCALE_TAG, type Locale } from "./locales.ts";
import { en } from "./en.ts";
import { pt } from "./pt.ts";
import { zh } from "./zh.ts";
import { hi } from "./hi.ts";
import { es } from "./es.ts";
import { fr } from "./fr.ts";
import { bn } from "./bn.ts";
import { ru } from "./ru.ts";

export type Key = keyof typeof en;
const DICT: Record<Locale, Partial<Record<Key, string>>> = { en, pt, zh, hi, es, fr, bn, ru };

export type Vars = Record<string, string | number>;

export function translate(locale: Locale, key: Key, vars?: Vars): string {
  const s = DICT[locale][key] ?? en[key];
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** A translator bound to a language. */
export function useT(locale: Locale) {
  return (key: Key, vars?: Vars) => translate(locale, key, vars);
}

/**
 * The key of the plural form of a counted noun: base.one, base.many, and for languages that have
 * a third form (Russian: 1 / 2-4 / 5+) base.few. A form a language does not define falls back to
 * "many".
 */
export function pluralKey(locale: Locale, n: number, base: string): Key {
  let form = n === 1 ? "one" : "many";
  if (locale === "ru") {
    const r = new Intl.PluralRules("ru").select(n);
    form = r === "one" || r === "few" ? r : "many";
  }
  const key = `${base}.${form}` as Key;
  return DICT[locale][key] !== undefined || en[key] !== undefined ? key : (`${base}.many` as Key);
}

/** "3 devices": the noun is a key with "one" and "many" forms (key.one, key.many; Russian also key.few). */
export function count(locale: Locale, n: number, base: string): string {
  const num = n.toLocaleString(LOCALE_TAG[locale]);
  // Chinese puts no space between the number and the measure word.
  return `${num}${locale === "zh" ? "" : " "}${translate(locale, pluralKey(locale, n, base))}`;
}

/** The dictionary of a language as it goes to the browser scripts. */
export function clientStrings(locale: Locale, keys: readonly Key[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, translate(locale, k)]));
}
