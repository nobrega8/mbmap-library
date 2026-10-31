// The home page: live results under the search field, the example map's
// tabs, rolling numbers and sections that rise into view.

import { STATUS_INFO } from "../lib/mbmap.ts";
import { icon } from "../lib/icons.ts";
import { href } from "../lib/base.ts";
import { registerLink, vendorTile } from "../lib/device-row.ts";
import { type Hit, REGISTER_QUERY_MIN, escapeHtml, highlight, loadDevices, loadRegisters, search } from "./search-core.ts";
import { revealOnScroll, rollNumbers } from "./motion.ts";

const form = document.getElementById("hero-form") as HTMLFormElement;
const input = document.getElementById("hero-q") as HTMLInputElement;
const list = document.getElementById("hero-results") as HTMLUListElement;
const LIMIT = 6;
let hits: Hit[] = [];
let selected = -1;
let seq = 0;

function close() {
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
}

function render(q: string) {
  if (!q) return close();
  const items = hits.slice(0, LIMIT).map((h, i) => {
    const e = h.entry;
    const status = e.s ? `<span class="status ${e.s}" title="${STATUS_INFO[e.s].label}">${icon(e.s, 14)}</span>` : "";
    const sub = h.line ? `Register: ${highlight(h.line, q)}` : e.d ? highlight(e.d, q) : `${e.r} registers`;
    return `<li class="cmd-item" role="option" id="hr-${i}" aria-selected="${i === selected}"><a href="${registerLink(e.u, h.line)}" tabindex="-1">${vendorTile(e.v, e.i)}<span class="cmd-text"><span class="cmd-title">${highlight(e.v, q)} <b>${highlight(e.m, q)}</b></span><span class="cmd-sub">${sub}</span></span>${status}</a></li>`;
  });
  const all = `<li class="cmd-group key"><a href="${href(`/devices?q=${encodeURIComponent(q)}`)}">${hits.length ? `See all ${hits.length} results` : `No devices match “${escapeHtml(q)}”`} →</a></li>`;
  list.innerHTML = items.join("") + all;
  list.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

async function update() {
  const q = input.value.trim();
  const mine = ++seq;
  selected = -1;
  if (!q) return close();
  try {
    const entries = await loadDevices();
    if (mine !== seq) return;
    hits = search(entries, q);
    render(q);
    if (q.length < REGISTER_QUERY_MIN) return;
    const regs = await loadRegisters();
    if (mine !== seq) return;
    hits = search(entries, q, regs);
    render(q);
  } catch {
    // The full catalogue still works: Enter submits the form
  }
}

function move(step: number) {
  const n = Math.min(hits.length, LIMIT);
  if (!n) return;
  selected = (selected + step + n) % n;
  list.querySelectorAll(".cmd-item").forEach((li, i) => li.setAttribute("aria-selected", String(i === selected)));
  input.setAttribute("aria-activedescendant", `hr-${selected}`);
}

let typing = 0;
input.addEventListener("input", () => {
  clearTimeout(typing);
  typing = window.setTimeout(update, 60);
});
input.addEventListener("focus", () => input.value.trim() && update());
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    move(e.key === "ArrowDown" ? 1 : -1);
  } else if (e.key === "Escape") {
    close();
  }
});
form.addEventListener("submit", (e) => {
  const h = hits[selected];
  if (h) {
    e.preventDefault();
    location.href = registerLink(h.entry.u, h.line);
  }
});
document.addEventListener("click", (e) => {
  if (!form.contains(e.target as Node)) close();
});

// The example map: registers or the file
const tabs = [...document.querySelectorAll<HTMLButtonElement>(".preview-tabs [role=tab]")];
for (const t of tabs) {
  t.addEventListener("click", () => {
    for (const o of tabs) {
      const on = o === t;
      o.classList.toggle("on", on);
      o.setAttribute("aria-selected", String(on));
      o.tabIndex = on ? 0 : -1;
      document.getElementById(o.getAttribute("aria-controls")!)!.hidden = !on;
    }
  });
}

rollNumbers();
revealOnScroll();
