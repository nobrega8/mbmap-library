// A device page: the register table (search, filters, order, pages and
// details) and the raw file. The page carries the first rows; the whole map
// is fetched once, from the copy of the file served next to the page, and
// read with the same code the build uses.

import { parseMap, type MapInfo, type Register } from "../lib/normalize.ts";
import { REGISTER_COLUMNS, REGISTER_PAGE, registerDetail, registerRow } from "../lib/register-row.ts";
import { fold, parseInteger, plural } from "../lib/mbmap.ts";
import { highlightJson } from "../lib/json-highlight.ts";
import { staggerRows } from "./motion.ts";
import { copy, toast } from "./shell.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const table = $("reg-table")!;
const body = $("reg-body")!;
const q = $<HTMLInputElement>("reg-q")!;
const area = $<HTMLSelectElement>("reg-area");
const access = $<HTMLSelectElement>("reg-access");
const group = $<HTMLSelectElement>("reg-group");
const sort = $<HTMLSelectElement>("reg-sort")!;
const count = $("reg-count")!;
const empty = $("reg-empty")!;
const pager = $("reg-pager")!;
const pageLabel = $("reg-page")!;
const prev = $<HTMLButtonElement>("reg-prev")!;
const next = $<HTMLButtonElement>("reg-next")!;
const mapUrl = table.dataset.map!;
const addressBase = Number(table.dataset.base) || 0;

let text: Promise<string> | null = null;
let map: MapInfo | null = null;
let page = 1;
const open = new Set<number>();

function fetchText(): Promise<string> {
  text ??= fetch(mapUrl).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  });
  text.catch(() => (text = null));
  return text;
}

// ── tabs ──
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
function selectTab(id: string, focus = false) {
  for (const t of tabs) {
    const on = t.getAttribute("aria-controls") === id;
    t.setAttribute("aria-selected", String(on));
    t.classList.toggle("on", on);
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")!)!.hidden = !on;
    if (on && focus) t.focus();
  }
  if (id === "raw") showRaw();
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => {
    const id = t.getAttribute("aria-controls")!;
    selectTab(id);
    history.replaceState(null, "", id === "raw" ? "#raw" : location.pathname + location.search);
  });
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
    selectTab(n.getAttribute("aria-controls")!, true);
  });
});
document.querySelectorAll<HTMLAnchorElement>("[data-tab-link]").forEach((a) =>
  a.addEventListener("click", () => {
    selectTab(a.dataset.tabLink!);
  }),
);
if (location.hash === "#raw") selectTab("raw");

// ── registers ──
function matches(r: Register, words: string[], num: number | null): boolean {
  if (num != null && (r.address === num || r.wire === num)) return true;
  if (!words.length) return num == null;
  const hay = fold(`${r.name} ${r.group ?? ""} ${r.description ?? ""} ${r.unit ?? ""} ${r.address}`);
  return words.every((w) => hay.includes(w));
}

function filtered(): Register[] {
  if (!map) return [];
  const query = q.value.trim();
  const num = /^(\d+|0x[0-9a-f]+)$/i.test(query) ? parseInteger(query) : null;
  const words = num != null && /^0x/i.test(query) ? [] : fold(query).split(/\s+/).filter(Boolean);
  let regs = map.registers.filter(
    (r) =>
      (!area?.value || r.area === area.value) &&
      (!access?.value || (access.value === "w" ? r.access !== "R" : r.access === access.value)) &&
      (!group?.value || r.group === group.value) &&
      (!query || matches(r, words, num)),
  );
  if (sort.value === "address") regs = [...regs].sort((a, b) => a.area.localeCompare(b.area) || a.wire - b.wire);
  else if (sort.value === "name") regs = [...regs].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  return regs;
}

function render(animate = true) {
  if (!map) return;
  const regs = filtered();
  const pages = Math.max(1, Math.ceil(regs.length / REGISTER_PAGE));
  page = Math.min(page, pages);
  const query = q.value.trim();
  const mark = /^0x/i.test(query) ? "" : query;
  body.innerHTML = regs
    .slice((page - 1) * REGISTER_PAGE, page * REGISTER_PAGE)
    .map((r) => {
      const row = registerRow(r, mark);
      return open.has(r.i)
        ? row.replace('aria-expanded="false"', 'aria-expanded="true"').replace("<tr ", '<tr class="open" ') +
            registerDetail(r, addressBase, REGISTER_COLUMNS.length)
        : row;
    })
    .join("");
  if (animate) staggerRows(body);
  const total = map.registers.length;
  count.textContent = regs.length === total ? plural(total, "register") : `${plural(regs.length, "register")} of ${total.toLocaleString("en-US")}`;
  table.hidden = !regs.length;
  empty.hidden = regs.length > 0;
  pager.hidden = pages < 2;
  pageLabel.textContent = `Page ${page} of ${pages}`;
  prev.disabled = page <= 1;
  next.disabled = page >= pages;
}

function update() {
  page = 1;
  render();
}

let typing = 0;
q.addEventListener("input", () => {
  clearTimeout(typing);
  typing = window.setTimeout(update, 80);
});
for (const s of [area, access, group, sort]) s?.addEventListener("change", update);
prev.addEventListener("click", () => {
  page--;
  render();
  table.scrollIntoView({ block: "start" });
});
next.addEventListener("click", () => {
  page++;
  render();
  table.scrollIntoView({ block: "start" });
});

body.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const copyBtn = target.closest<HTMLButtonElement>("button.copy");
  if (copyBtn) {
    copy(copyBtn.dataset.copy!, `Copied address ${copyBtn.dataset.copy}`);
    return;
  }
  const nameBtn = target.closest<HTMLButtonElement>("button.reg-name");
  if (!nameBtn || !map) return;
  const tr = nameBtn.closest("tr")!;
  const i = Number(tr.dataset.i);
  const r = map.registers.find((x) => x.i === i);
  if (!r) return;
  if (open.has(i)) {
    open.delete(i);
    tr.classList.remove("open");
    nameBtn.setAttribute("aria-expanded", "false");
    tr.nextElementSibling?.classList.contains("reg-detail") && tr.nextElementSibling.remove();
  } else {
    open.add(i);
    tr.classList.add("open");
    nameBtn.setAttribute("aria-expanded", "true");
    tr.insertAdjacentHTML("afterend", registerDetail(r, addressBase, REGISTER_COLUMNS.length));
  }
});

// A search link from the catalogue (?r=register name) fills the search
const fromSearch = new URLSearchParams(location.search).get("r");
if (fromSearch) q.value = fromSearch;

fetchText()
  .then((t) => {
    map = parseMap(t);
    render(Boolean(q.value));
  })
  .catch(() => {
    count.textContent = "The full register list could not be loaded: showing the first page only.";
  });

// ── raw JSON ──
const HIGHLIGHT_LIMIT = 512 * 1024;
let rawShown = false;

function showRaw() {
  if (rawShown) return;
  rawShown = true;
  const code = $("raw-code")!;
  fetchText()
    .then((t) => {
      if (t.length <= HIGHLIGHT_LIMIT) code.innerHTML = highlightJson(t);
      else code.textContent = t;
    })
    .catch(() => {
      rawShown = false;
      code.textContent = "The file could not be loaded. Use Download or Raw on GitHub instead.";
    });
}

$("raw-copy")!.addEventListener("click", () =>
  fetchText().then(
    (t) => copy(t, "Copied the map file"),
    () => toast("The file could not be loaded"),
  ),
);
