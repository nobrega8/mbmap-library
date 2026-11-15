// The labels of the format (statuses, areas, access, protocols) in a language.

import type { Locale } from "./locales.ts";
import { translate, type Key } from "./index.ts";
import type { Access, Area, Status } from "../lib/mbmap.ts";

export const statusLabel = (l: Locale, s: Status) => translate(l, `status.${s}.label` as Key);
export const statusShort = (l: Locale, s: Status) => translate(l, `status.${s}.short` as Key);
export const statusLong = (l: Locale, s: Status) => translate(l, `status.${s}.long` as Key);
export const areaName = (l: Locale, a: Area) => translate(l, `area.${a}` as Key);
export const accessName = (l: Locale, a: Access) => translate(l, `access.${a}` as Key);
export const protocolName = (l: Locale, p: string) => (`protocol.${p}` in translateKeys ? translate(l, `protocol.${p}` as Key) : p);
export const parityName = (l: Locale, p: string) => (`parity.${p}` in translateKeys ? translate(l, `parity.${p}` as Key) : p);
export const roleLabel = (l: Locale, r: string) => (`role.${r}` in translateKeys ? translate(l, `role.${r}` as Key) : r);
export const roleLong = (l: Locale, r: string) =>
  `role.${r}.long` in translateKeys ? translate(l, `role.${r}.long` as Key) : translate(l, "role.identifies");

import { en } from "./en.ts";
const translateKeys = en as Record<string, string>;
