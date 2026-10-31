// The device catalogue on the home page: search, manufacturer and status
// filters, sorting and pages, all in the browser over /search/devices.json.
// The state lives in the URL (?q=&vendor=&status=&sort=&page=) so a search
// can be shared and the back button works.

import { CATALOGUE_PAGE, deviceRow } from "../lib/device-row.ts";
import { plural } from "../lib/mbmap.ts";
import { staggerRows } from "./motion.ts";
import { type DeviceEntry, type Hit, REGISTER_QUERY_MIN, loadDevices, loadRegisters, search } from "./search-core.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const q = $<HTMLInputElement>("cat-q");
const vendor = $<HTMLSelectElement>("cat-vendor");
const statusGroup = $("cat-status");
const sort = $<HTMLSelectElement>("cat-sort");
const body = $("cat-body");
const table = $("cat-table");
const count = $("cat-count");
const empty = $("cat-empty");
const pager = $("cat-pager");
const pageLabel = $("cat-page");
const prev = $<HTMLButtonElement>("cat-prev");
const next = $<HTMLButtonElement>("cat-next");

let entries: DeviceEntry[] = [];
let regs: string[][] | null = null;
let status = "";
let page = 1;

function readUrl() {
  const p = new URLSearchParams(location.search);
  q.value = p.get("q") ?? "";
  vendor.value = p.get("vendor") ?? "";
  if (vendor.selectedIndex < 0) vendor.value = "";
  sort.value = p.get("sort") ?? "";
  if (sort.selectedIndex < 0) sort.value = "";
  status = p.get("status") ?? "";
  page = Math.max(1, Number(p.get("page")) || 1);
  showStatus();
}

function writeUrl() {
  const p = new URLSearchParams();
  if (q.value.trim()) p.set("q", q.value.trim());
  if (vendor.value) p.set("vendor", vendor.value);
  if (status) p.set("status", status);
  if (sort.value) p.set("sort", sort.value);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  history.replaceState(null, "", s ? `?${s}${location.hash}` : location.pathname + location.hash);
}

function showStatus() {
  statusGroup.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
    const on = b.dataset.status === status;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
  });
}

const byName = (a: DeviceEntry, b: DeviceEntry) =>
  a.v.localeCompare(b.v, "en", { sensitivity: "base", numeric: true }) ||
  a.m.localeCompare(b.m, "en", { sensitivity: "base", numeric: true });

function results(): Hit[] {
  const query = q.value.trim();
  let hits = search(entries, query, regs);
  if (vendor.value) hits = hits.filter((h) => h.entry.vs === vendor.value);
  if (status) hits = hits.filter((h) => h.entry.s === status);
  const s = sort.value;
  if (s === "name" || (!s && !query)) hits.sort((a, b) => byName(a.entry, b.entry));
  else if (s === "added") hits.sort((a, b) => (b.entry.a ?? "").localeCompare(a.entry.a ?? "") || byName(a.entry, b.entry));
  else if (s === "registers") hits.sort((a, b) => b.entry.r - a.entry.r || byName(a.entry, b.entry));
  return hits;
}

function render(animate = true) {
  const query = q.value.trim();
  const hits = results();
  const pages = Math.max(1, Math.ceil(hits.length / CATALOGUE_PAGE));
  page = Math.min(page, pages);
  const shown = hits.slice((page - 1) * CATALOGUE_PAGE, page * CATALOGUE_PAGE);
  body.innerHTML = shown.map((h) => deviceRow(h.entry, { query, line: h.line })).join("");
  if (animate) staggerRows(body);

  const filtered = query || vendor.value || status;
  count.textContent = filtered
    ? `${plural(hits.length, "map")} of ${entries.length.toLocaleString("en-US")}`
    : plural(entries.length, "map");
  if (query.length >= REGISTER_QUERY_MIN && !regs) count.textContent += " · searching register names…";

  table.hidden = !hits.length;
  empty.hidden = hits.length > 0;
  pager.hidden = pages < 2;
  pageLabel.textContent = `Page ${page} of ${pages}`;
  prev.disabled = page <= 1;
  next.disabled = page >= pages;
  writeUrl();
}

let seq = 0;
async function update(resetPage = true, animate = true) {
  if (resetPage) page = 1;
  render(animate);
  if (q.value.trim().length >= REGISTER_QUERY_MIN && !regs) {
    const mine = ++seq;
    try {
      regs = await loadRegisters();
    } catch {
      count.textContent += " (register names could not be loaded)";
      return;
    }
    if (mine === seq) render();
  }
}

function turn(step: number) {
  page += step;
  render();
  $("catalogue").scrollIntoView({ block: "start" });
}

let typing = 0;
q.addEventListener("input", () => {
  clearTimeout(typing);
  typing = window.setTimeout(() => update(), 80);
});
q.addEventListener("keydown", (e) => {
  // Enter opens the first result, as in the search menu
  if (e.key === "Enter") {
    const first = body.querySelector<HTMLAnchorElement>("a.row-link");
    if (first && q.value.trim()) location.href = first.href;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    body.querySelector<HTMLAnchorElement>("a.row-link")?.focus();
  }
});
// Arrow keys move between rows once one has focus
body.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const links = [...body.querySelectorAll<HTMLAnchorElement>("a.row-link")];
  const i = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (i < 0) return;
  e.preventDefault();
  if (e.key === "ArrowUp" && i === 0) q.focus();
  else links[Math.min(links.length - 1, i + (e.key === "ArrowDown" ? 1 : -1))]?.focus();
});
vendor.addEventListener("change", () => update());
sort.addEventListener("change", () => update());
statusGroup.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-status]");
  if (!b) return;
  status = b.dataset.status ?? "";
  showStatus();
  update();
});
prev.addEventListener("click", () => turn(-1));
next.addEventListener("click", () => turn(1));
$("cat-clear").addEventListener("click", () => {
  q.value = "";
  vendor.value = "";
  sort.value = "";
  status = "";
  showStatus();
  update();
  q.focus();
});

readUrl();
loadDevices()
  .then((all) => {
    entries = all;
    // Rows drawn by the build stay still; a search from the URL animates in
    update(false, location.search !== "");
  })
  .catch(() => {
    count.textContent = "The catalogue could not be loaded: search is unavailable. The first maps are listed below.";
  });
