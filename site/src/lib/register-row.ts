// One register in the table of a device page, and its details. Used at build
// time for the first page of rows and by the browser for the rest.

import type { Register } from "./normalize.ts";
import { AREA_FUNCTIONS, AREA_TAG, hex, modicon, registerCount, typeLabel } from "./mbmap.ts";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locales.ts";
import { translate } from "../i18n/index.ts";
import { accessName, areaName, roleLabel, roleLong } from "../i18n/labels.ts";
import { icon } from "./icons.ts";
import { escapeHtml, highlight } from "../scripts/search-core.ts";

/** Rows per page of a register table */
export const REGISTER_PAGE = 100;

/** The columns of the table: the class suffix and the key of the heading. */
export const REGISTER_COLUMNS = [
  ["area", "reg.colArea"],
  ["address", "reg.colAddress"],
  ["name", "reg.colName"],
  ["type", "reg.colType"],
  ["access", "reg.colAccess"],
  ["unit", "reg.colUnit"],
  ["scale", "reg.colScale"],
  ["description", "reg.colDescription"],
] as const;

function scaleText(r: Register): string {
  const parts: string[] = [];
  if (r.scaleFactor) parts.push(`×10^${r.scaleFactor}`);
  if (r.scale != null) parts.push(`×${r.scale}`);
  if (r.offset != null) parts.push(`${r.offset < 0 ? "−" : "+"}${Math.abs(r.offset)}`);
  return parts.join(" ");
}

/** Tooltip of a role tag. */
export function roleTitle(role: string, locale: Locale = DEFAULT_LOCALE): string {
  return translate(locale, "role.identifiesLong", { long: roleLong(locale, role) });
}

export function registerRow(r: Register, query = "", locale: Locale = DEFAULT_LOCALE): string {
  const T = (k: Parameters<typeof translate>[1], v?: Parameters<typeof translate>[2]) => translate(locale, k, v);
  const mark = (s: string) => (query ? highlight(s, query) : escapeHtml(s));
  const group = r.group ? ` <span class="grp">${mark(r.group)}</span>` : "";
  const desc = r.description ?? "";
  const tags = [
    r.enumTable ? `<span class="tag" title="${T("reg.tagEnum")}">enum</span>` : "",
    r.parts ? `<span class="tag" title="${T("reg.tagParts")}">parts</span>` : "",
    r.role ? `<span class="tag role" title="${escapeHtml(roleTitle(r.role, locale))}">${escapeHtml(roleLabel(locale, r.role))}</span>` : "",
    r.firmwareMin || r.firmwareMax ? `<span class="tag" title="${T("reg.tagFw")}">fw</span>` : "",
  ].join("");
  return `<tr data-i="${r.i}">
<td class="c-area"><span class="area" title="${areaName(locale, r.area)}">${AREA_TAG[r.area]}</span></td>
<td class="c-addr"><span class="addr mono">${mark(String(r.address))}</span><button type="button" class="copy" data-copy="${r.address}" title="${T("reg.copyAddress", { n: r.address })}" aria-label="${T("reg.copyAddress", { n: r.address })}">${icon("copy", 13)}</button></td>
<td class="c-name"><button type="button" class="reg-name" aria-expanded="false" aria-controls="reg-d-${r.i}"><span class="nm">${mark(r.name)}</span>${group}${tags}</button></td>
<td class="c-type mono">${escapeHtml(typeLabel(r))}</td>
<td class="c-access mono" title="${accessName(locale, r.access)}">${r.access}</td>
<td class="c-unit">${r.unit ? escapeHtml(r.unit) : ""}</td>
<td class="c-scale mono">${escapeHtml(scaleText(r))}</td>
<td class="c-desc"${desc ? ` title="${escapeHtml(desc)}"` : ""}>${mark(desc)}</td>
</tr>`;
}

/** Everything the map says about one register, shown under its row. */
export function registerDetail(r: Register, addressBase: number, columns: number, locale: Locale = DEFAULT_LOCALE): string {
  const T = (k: Parameters<typeof translate>[1], v?: Parameters<typeof translate>[2]) => translate(locale, k, v);
  const rows: [string, string][] = [];
  const add = (k: string, v: string | undefined | null) => {
    if (v != null && v !== "") rows.push([k, v]);
  };
  const width = registerCount(r.type, r.length);
  add(T("reg.dArea"), `${areaName(locale, r.area)} <span class="faint">(${AREA_FUNCTIONS[r.area]})</span>`);
  add(
    T("reg.dAddress"),
    `<span class="mono">${r.address}</span> <span class="faint">${T("reg.asWritten", { base: addressBase })}</span>`,
  );
  if (r.wire >= 0 && r.wire <= 65535) {
    const m = modicon(r.area, r.wire);
    add(
      T("reg.dWire"),
      `<span class="mono">${r.wire} · ${hex(r.wire)}</span>${m ? ` <span class="faint">Modicon</span> <span class="mono">${m}</span>` : ""}`,
    );
  }
  add(T("reg.dType"), `<span class="mono">${escapeHtml(typeLabel(r))}</span>${width ? ` <span class="faint">${T(width > 1 ? "reg.registersWide.many" : "reg.registersWide.one", { n: width })}</span>` : ""}`);
  if (width && width > 1) add(T("reg.dOrder"), `${r.byteOrder} / ${r.wordOrder}`);
  add(T("reg.dAccess"), accessName(locale, r.access));
  add(T("reg.dUnit"), r.unit && escapeHtml(r.unit));
  if (r.scale != null || r.offset != null || r.scaleFactor) {
    const sf = r.scaleFactor ? ` × 10^<span class="mono">${escapeHtml(r.scaleFactor)}</span>` : "";
    add(T("reg.dValue"), `raw${sf} × ${r.scale ?? 1}${r.offset != null ? ` + ${r.offset}` : ""}`);
  }
  if (r.writeMin != null || r.writeMax != null)
    add(T("reg.dWriteLimits"), `${r.writeMin ?? "—"} ${T("reg.to")} ${r.writeMax ?? "—"}${r.unit ? ` ${escapeHtml(r.unit)}` : ""}`);
  if (r.firmwareMin || r.firmwareMax)
    add(T("reg.dFirmware"), `${r.firmwareMin ? T("reg.from", { v: escapeHtml(r.firmwareMin) }) : ""}${r.firmwareMin && r.firmwareMax ? " " : ""}${r.firmwareMax ? T("reg.upTo", { v: escapeHtml(r.firmwareMax) }) : ""}`);
  add(
    T("reg.dRole"),
    r.role &&
      `<span class="mono">${escapeHtml(r.role)}</span> <span class="faint">${escapeHtml(roleLong(locale, r.role))}</span>`,
  );
  add(T("reg.dReference"), r.reference && `<span class="mono">${escapeHtml(r.reference)}</span>`);
  add(T("reg.dGroup"), r.group && escapeHtml(r.group));
  add(T("reg.dDescription"), r.description && escapeHtml(r.description));
  add(T("reg.dComment"), r.comment && escapeHtml(r.comment));

  const facts = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  const table = r.enumTable
    ? `<div class="enum"><div class="key">${T("reg.values")}${r.enumName ? ` · <span class="mono">${escapeHtml(r.enumName)}</span>` : ""}</div><table class="table"><tbody>${r.enumTable
        .map(([k, v]) => `<tr><td class="mono">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
        .join("")}</tbody></table></div>`
    : "";
  const parts = r.parts
    ? `<div class="enum"><div class="key">${T("reg.partsTitle")} <span class="faint">· ${T("reg.partsNote")}</span></div><table class="table"><thead><tr><th>${T("reg.partName")}</th><th>${T("reg.partRegisters")}</th><th>${T("reg.partType")}</th><th>${T("reg.partDescription")}</th></tr></thead><tbody>${r.parts
        .map((p) => {
          const first = r.address + p.offset;
          const range = p.count > 1 ? `${first}–${first + p.count - 1}` : String(first);
          return `<tr><td>${escapeHtml(p.name)}</td><td class="mono">${range}</td><td class="mono">${escapeHtml(p.type)}</td><td>${p.description ? escapeHtml(p.description) : ""}</td></tr>`;
        })
        .join("")}</tbody></table></div>`
    : "";
  return `<tr class="reg-detail" id="reg-d-${r.i}"><td colspan="${columns}"><div class="detail-in"><dl class="facts">${facts}</dl>${parts}${table}</div></td></tr>`;
}
