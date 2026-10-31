// One register in the table of a device page, and its details. Used at build
// time for the first page of rows and by the browser for the rest.

import type { Register } from "./normalize.ts";
import {
  ACCESS_NAME,
  AREA_FUNCTIONS,
  AREA_NAME,
  AREA_TAG,
  hex,
  modicon,
  registerCount,
  typeLabel,
} from "./mbmap.ts";
import { icon } from "./icons.ts";
import { escapeHtml, highlight } from "../scripts/search-core.ts";

/** Rows per page of a register table */
export const REGISTER_PAGE = 100;

export const REGISTER_COLUMNS = ["Area", "Address", "Name", "Type", "Access", "Unit", "Scale", "Description"];

function scaleText(r: Register): string {
  const parts: string[] = [];
  if (r.scaleFactor) parts.push(`×10^${r.scaleFactor}`);
  if (r.scale != null) parts.push(`×${r.scale}`);
  if (r.offset != null) parts.push(`${r.offset < 0 ? "−" : "+"}${Math.abs(r.offset)}`);
  return parts.join(" ");
}

export function registerRow(r: Register, query = ""): string {
  const mark = (s: string) => (query ? highlight(s, query) : escapeHtml(s));
  const group = r.group ? ` <span class="grp">${mark(r.group)}</span>` : "";
  const desc = r.description ?? "";
  const tags = [
    r.enumTable ? `<span class="tag" title="Has a translation table">enum</span>` : "",
    r.role ? `<span class="tag" title="Identifies the device">${escapeHtml(r.role)}</span>` : "",
    r.firmwareMin || r.firmwareMax ? `<span class="tag" title="Only some firmware versions">fw</span>` : "",
  ].join("");
  return `<tr data-i="${r.i}">
<td class="c-area"><span class="area" title="${AREA_NAME[r.area]}">${AREA_TAG[r.area]}</span></td>
<td class="c-addr"><span class="addr mono">${mark(String(r.address))}</span><button type="button" class="copy" data-copy="${r.address}" title="Copy address ${r.address}" aria-label="Copy address ${r.address}">${icon("copy", 13)}</button></td>
<td class="c-name"><button type="button" class="reg-name" aria-expanded="false" aria-controls="reg-d-${r.i}"><span class="nm">${mark(r.name)}</span>${group}${tags}</button></td>
<td class="c-type mono">${escapeHtml(typeLabel(r))}</td>
<td class="c-access mono" title="${ACCESS_NAME[r.access]}">${r.access}</td>
<td class="c-unit">${r.unit ? escapeHtml(r.unit) : ""}</td>
<td class="c-scale mono">${escapeHtml(scaleText(r))}</td>
<td class="c-desc"${desc ? ` title="${escapeHtml(desc)}"` : ""}>${mark(desc)}</td>
</tr>`;
}

/** Everything the map says about one register, shown under its row. */
export function registerDetail(r: Register, addressBase: number, columns: number): string {
  const rows: [string, string][] = [];
  const add = (k: string, v: string | undefined | null) => {
    if (v != null && v !== "") rows.push([k, v]);
  };
  const width = registerCount(r.type, r.length);
  add("Area", `${AREA_NAME[r.area]} <span class="faint">(${AREA_FUNCTIONS[r.area]})</span>`);
  add(
    "Address",
    `<span class="mono">${r.address}</span> <span class="faint">as written, ${addressBase}-based</span>`,
  );
  if (r.wire >= 0 && r.wire <= 65535) {
    const m = modicon(r.area, r.wire);
    add(
      "On the wire",
      `<span class="mono">${r.wire} · ${hex(r.wire)}</span>${m ? ` <span class="faint">Modicon</span> <span class="mono">${m}</span>` : ""}`,
    );
  }
  add("Type", `<span class="mono">${escapeHtml(typeLabel(r))}</span>${width ? ` <span class="faint">${width} register${width > 1 ? "s" : ""}</span>` : ""}`);
  if (width && width > 1) add("Byte / word order", `${r.byteOrder} / ${r.wordOrder}`);
  add("Access", ACCESS_NAME[r.access]);
  add("Unit", r.unit && escapeHtml(r.unit));
  if (r.scale != null || r.offset != null || r.scaleFactor) {
    const sf = r.scaleFactor ? ` × 10^<span class="mono">${escapeHtml(r.scaleFactor)}</span>` : "";
    add("Value", `raw${sf} × ${r.scale ?? 1}${r.offset != null ? ` + ${r.offset}` : ""}`);
  }
  if (r.writeMin != null || r.writeMax != null)
    add("Write limits", `${r.writeMin ?? "—"} to ${r.writeMax ?? "—"}${r.unit ? ` ${escapeHtml(r.unit)}` : ""}`);
  if (r.firmwareMin || r.firmwareMax)
    add("Firmware", `${r.firmwareMin ? `from ${escapeHtml(r.firmwareMin)}` : ""}${r.firmwareMin && r.firmwareMax ? " " : ""}${r.firmwareMax ? `up to ${escapeHtml(r.firmwareMax)}` : ""}`);
  add("Role", r.role && `Identifies the device: <span class="mono">${escapeHtml(r.role)}</span>`);
  add("Reference value", r.reference && `<span class="mono">${escapeHtml(r.reference)}</span>`);
  add("Group", r.group && escapeHtml(r.group));
  add("Description", r.description && escapeHtml(r.description));
  add("Comment", r.comment && escapeHtml(r.comment));

  const facts = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  const table = r.enumTable
    ? `<div class="enum"><div class="key">Values${r.enumName ? ` · <span class="mono">${escapeHtml(r.enumName)}</span>` : ""}</div><table class="table"><tbody>${r.enumTable
        .map(([k, v]) => `<tr><td class="mono">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
        .join("")}</tbody></table></div>`
    : "";
  return `<tr class="reg-detail" id="reg-d-${r.i}"><td colspan="${columns}"><div class="detail-in"><dl class="facts">${facts}</dl>${table}</div></td></tr>`;
}
