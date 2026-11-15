// One row of a device list. Used by the pages at build time and by the
// catalogue script in the browser, so both draw the same markup.

import { localizeUrl } from "./base.ts";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locales.ts";
import { translate } from "../i18n/index.ts";
import { protocolName, statusLabel, statusShort } from "../i18n/labels.ts";
import { icon } from "./icons.ts";
import { escapeHtml, highlight, type DeviceEntry } from "../scripts/search-core.ts";

export function deviceRow(e: DeviceEntry, opts: { query?: string; line?: string; vendor?: boolean; locale?: Locale } = {}): string {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const q = opts.query ?? "";
  const mark = (s: string) => (q ? highlight(s, q) : escapeHtml(s));
  const status = e.s
    ? `<span class="status ${e.s}" title="${statusShort(locale, e.s)}">${icon(e.s, 15)}<span>${statusLabel(locale, e.s)}</span></span>`
    : `<span class="status faint">${translate(locale, "status.none")}</span>`;
  const others = e.ms?.length ? `<span class="also" title="${escapeHtml(e.ms.join(", "))}">${mark(e.ms.join(", "))}</span>` : "";
  const match = opts.line ? `<span class="match">${translate(locale, "search.registerLine", { line: highlight(opts.line, q) })}</span>` : "";
  const vendor =
    opts.vendor === false
      ? ""
      : `<td class="c-vendor"><span class="vendor-cell">${vendorTile(e.v, e.i)}<span class="vendor-name">${mark(e.v)}</span></span></td>`;
  return `<tr class="linked">${vendor}<td class="c-model"><a class="row-link" href="${registerLink(localizeUrl(e.u, locale), opts.line)}">${mark(e.m)}</a>${others}${match}</td><td class="desc-cell"${e.d ? ` title="${escapeHtml(e.d)}"` : ""}>${e.d ? mark(e.d) : ""}</td><td class="c-status">${status}</td><td class="c-proto faint">${e.p ? escapeHtml(protocolName(locale, e.p).replace("Modbus ", "")) : ""}</td><td class="c-regs num">${e.r.toLocaleString(locale === "pt" ? "pt-PT" : "en-US")}</td></tr>`;
}

export function deviceHead(vendor = true, locale: Locale = DEFAULT_LOCALE): string {
  const t = (k: Parameters<typeof translate>[1]) => translate(locale, k);
  return `<tr>${vendor ? `<th scope="col">${t("list.manufacturer")}</th>` : ""}<th scope="col">${t("list.model")}</th><th scope="col">${t("list.description")}</th><th scope="col">${t("list.status")}</th><th scope="col" class="c-proto" title="${t("list.protocolTitle")}">${t("list.protocol")}</th><th scope="col" class="r">${t("list.registers")}</th></tr>`;
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
