// One row of a device list. Used by the pages at build time and by the
// catalogue script in the browser, so both draw the same markup.

import { PROTOCOL_NAME, STATUS_INFO } from "./mbmap.ts";
import { icon } from "./icons.ts";
import { escapeHtml, highlight, type DeviceEntry } from "../scripts/search-core.ts";

export function deviceRow(e: DeviceEntry, opts: { query?: string; line?: string; vendor?: boolean } = {}): string {
  const q = opts.query ?? "";
  const mark = (s: string) => (q ? highlight(s, q) : escapeHtml(s));
  const status = e.s
    ? `<span class="status ${e.s}" title="${STATUS_INFO[e.s].short}">${icon(e.s, 15)}<span>${STATUS_INFO[e.s].label}</span></span>`
    : `<span class="status faint">No status</span>`;
  const others = e.ms?.length ? `<span class="also" title="${escapeHtml(e.ms.join(", "))}">${mark(e.ms.join(", "))}</span>` : "";
  const match = opts.line ? `<span class="match">Register: ${highlight(opts.line, q)}</span>` : "";
  const vendor =
    opts.vendor === false
      ? ""
      : `<td class="c-vendor"><span class="vendor-cell">${vendorTile(e.v, e.i)}<span class="vendor-name">${mark(e.v)}</span></span></td>`;
  return `<tr class="linked">${vendor}<td class="c-model"><a class="row-link" href="${registerLink(e.u, opts.line)}">${mark(e.m)}</a>${others}${match}</td><td class="desc-cell"${e.d ? ` title="${escapeHtml(e.d)}"` : ""}>${e.d ? mark(e.d) : ""}</td><td class="c-status">${status}</td><td class="c-proto faint">${e.p ? escapeHtml(PROTOCOL_NAME[e.p]?.replace("Modbus ", "") ?? e.p) : ""}</td><td class="c-regs num">${e.r.toLocaleString("en-US")}</td></tr>`;
}

export function deviceHead(vendor = true): string {
  return `<tr>${vendor ? '<th scope="col">Manufacturer</th>' : ""}<th scope="col">Model</th><th scope="col">Description</th><th scope="col">Status</th><th scope="col" class="c-proto" title="As stated in the map">Protocol</th><th scope="col" class="r">Registers</th></tr>`;
}

/** Rows per page of the catalogue */
export const CATALOGUE_PAGE = 50;

/** A device page, opened on a register search when the hit was a register. */
export function registerLink(url: string, line?: string): string {
  return line ? `${url}?r=${encodeURIComponent(line)}` : url;
}

/** A manufacturer's icon, or the first letter of its name when there is none
    or it fails to load (Modbench's VendorIcon). */
export function vendorTile(name: string, icon?: string, large = false): string {
  const img = icon ? `<img src="${icon}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : "";
  return `<span class="vtile${large ? " lg" : ""}" aria-hidden="true">${img}<span>${escapeHtml(name.trim().charAt(0).toUpperCase() || "?")}</span></span>`;
}
