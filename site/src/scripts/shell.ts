// What every page does: the theme button, the menu on small screens, the
// ⌘K / Ctrl+K search menu (as in Modbench) and copy confirmations.

import { STATUS_INFO } from "../lib/mbmap.ts";
import { icon } from "../lib/icons.ts";
import { href } from "../lib/base.ts";
import { registerLink, vendorTile } from "../lib/device-row.ts";
import { slidePill } from "./motion.ts";

document.querySelectorAll<HTMLElement>(".tabs, [data-pill], .segmented").forEach(slidePill);
import {
  type Hit,
  REGISTER_QUERY_MIN,
  escapeHtml,
  highlight,
  loadDevices,
  loadRegisters,
  search,
} from "./search-core.ts";

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
document.querySelectorAll<HTMLElement>("[data-mod]").forEach((k) => {
  k.textContent = isMac ? "⌘K" : "Ctrl K";
});

// ── theme: system → light → dark, stored like Modbench's setting ──
const themeBtn = document.getElementById("theme") as HTMLButtonElement;
const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];
function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}
function showTheme(t: Theme) {
  themeBtn.innerHTML = icon(t === "system" ? "system" : t === "light" ? "sun" : "moon");
  themeBtn.title = `Theme: ${t}`;
  themeBtn.setAttribute("aria-label", themeBtn.title);
}
themeBtn.addEventListener("click", () => {
  const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length]!;
  if (next === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = next;
  try {
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  } catch {}
  showTheme(next);
});
showTheme(currentTheme());

// ── menu on small screens ──
const bar = document.getElementById("bar")!;
const menuBtn = document.getElementById("menu")!;
menuBtn.addEventListener("click", () => {
  const open = bar.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
});

// ── toast and copy ──
const toastEl = document.getElementById("toast")!;
let toastTimer = 0;
export function toast(text: string) {
  toastEl.textContent = text;
  toastEl.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("on"), 1600);
}

export async function copy(text: string, what = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast(what);
  } catch {
    toast("Could not copy: the browser refused access to the clipboard");
  }
}

// ── search menu ──
const dialog = document.getElementById("cmd") as HTMLDialogElement;
const input = document.getElementById("cmd-input") as HTMLInputElement;
const list = document.getElementById("cmd-list") as HTMLUListElement;
let hits: Hit[] = [];
let selected = 0;
let seq = 0;
const LIMIT = 30;

function itemHtml(h: Hit, i: number, q: string): string {
  const e = h.entry;
  const status = e.s
    ? `<span class="status ${e.s}" title="${STATUS_INFO[e.s].label}">${icon(e.s, 14)}</span>`
    : "";
  const sub = h.line
    ? `Register: ${highlight(h.line, q)}`
    : e.d
      ? highlight(e.d, q)
      : `${e.r} registers`;
  return `<li class="cmd-item" role="option" id="cmd-${i}" aria-selected="${i === selected}">
    <a href="${registerLink(e.u, h.line)}" tabindex="-1">${vendorTile(e.v, e.i)}
    <span class="cmd-text"><span class="cmd-title">${highlight(e.v, q)} <b>${highlight(e.m, q)}</b></span>
    <span class="cmd-sub">${sub}</span></span>${status}</a></li>`;
}

function render(q: string, note = "") {
  if (!hits.length) {
    list.innerHTML = q
      ? `<li class="empty"><strong>No maps match “${escapeHtml(q)}”</strong>${note || `Try a model number, a manufacturer or a register name. Missing a device? <a href="${href("/contribute")}">Request or add it</a>.`}</li>`
      : `<li class="empty">${note || "Type a manufacturer, a model or a register name."}</li>`;
    input.removeAttribute("aria-activedescendant");
    return;
  }
  list.innerHTML = hits.slice(0, LIMIT).map((h, i) => itemHtml(h, i, q)).join("") +
    (note ? `<li class="cmd-group key">${note}</li>` : "");
  input.setAttribute("aria-activedescendant", `cmd-${selected}`);
}

async function update() {
  const q = input.value.trim();
  const mine = ++seq;
  selected = 0;
  let entries;
  try {
    entries = await loadDevices();
  } catch {
    hits = [];
    render(q, "The registry could not be loaded. Check your connection and try again.");
    return;
  }
  if (mine !== seq) return;
  if (!q) {
    hits = [];
    render("");
    return;
  }
  hits = search(entries, q);
  render(q, q.length >= REGISTER_QUERY_MIN ? "Searching register names…" : "");
  if (q.length < REGISTER_QUERY_MIN) return;
  try {
    const regs = await loadRegisters();
    if (mine !== seq) return;
    hits = search(entries, q, regs);
    render(q);
  } catch {
    if (mine === seq) render(q, "Register names could not be loaded");
  }
}

function move(step: number) {
  const n = Math.min(hits.length, LIMIT);
  if (!n) return;
  list.querySelector(`#cmd-${selected}`)?.setAttribute("aria-selected", "false");
  selected = (selected + step + n) % n;
  const li = list.querySelector(`#cmd-${selected}`);
  li?.setAttribute("aria-selected", "true");
  li?.scrollIntoView({ block: "nearest" });
  input.setAttribute("aria-activedescendant", `cmd-${selected}`);
}

export function openSearch(initial = "") {
  if (dialog.open) return;
  input.value = initial;
  dialog.showModal();
  input.focus();
  update();
}

input.addEventListener("input", update);
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    move(e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Enter") {
    const h = hits[selected];
    if (h) location.href = registerLink(h.entry.u, h.line);
  }
});
list.addEventListener("mousemove", (e) => {
  const li = (e.target as HTMLElement).closest<HTMLElement>(".cmd-item");
  if (!li) return;
  const i = Number(li.id.slice(4));
  if (i !== selected) move(i - selected);
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});
document.querySelectorAll("[data-cmd-open]").forEach((b) => b.addEventListener("click", () => openSearch()));

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (dialog.open) dialog.close();
    else openSearch();
    return;
  }
  // "/" focuses the page's own search when it has one, or opens the menu
  if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    const own = document.querySelector<HTMLInputElement>("[data-page-search]");
    if (own) own.focus();
    else openSearch();
  }
});
