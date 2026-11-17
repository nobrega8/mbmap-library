// Interactive figures for the guides. A guide's markdown carries a plain tag
// such as <mb-byte-order></mb-byte-order>; this module turns it into a small
// working tool. Without JavaScript (or on GitHub) the tag is simply absent and
// the text around it still says everything.

import { locale } from "./i18n.ts";
import { PT } from "./guide-widgets-pt.ts";
import { ZH } from "./guide-widgets-zh.ts";
import { HI } from "./guide-widgets-hi.ts";
import { ES } from "./guide-widgets-es.ts";
import { FR } from "./guide-widgets-fr.ts";
import { BN } from "./guide-widgets-bn.ts";
import { RU } from "./guide-widgets-ru.ts";
import { DE } from "./guide-widgets-de.ts";
import { TR } from "./guide-widgets-tr.ts";
import { TH } from "./guide-widgets-th.ts";
import { HU } from "./guide-widgets-hu.ts";
import { ID } from "./guide-widgets-id.ts";
import { NL } from "./guide-widgets-nl.ts";

// Translations of the figures per language; a language without an entry shows English.
const TEXT: Record<string, Record<string, string> | undefined> = { pt: PT, zh: ZH, hi: HI, es: ES, fr: FR, bn: BN, ru: RU, de: DE, tr: TR, th: TH, hu: HU, id: ID, nl: NL };

/** Text of the figures in the language of the page; English is the key. {name} placeholders are filled from vars. */
const tx = (en: string, vars?: Record<string, string | number>) => {
  const s = TEXT[locale]?.[en] ?? en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
};

const $ = <T extends HTMLElement>(root: ParentNode, sel: string) => root.querySelector(sel) as T;
const hex = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, "0");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const bytesOf = (s: string): number[] | null => {
  const t = s.replace(/0x/gi, " ").replace(/[,;:]/g, " ").trim();
  if (!t) return [];
  const parts = /\s/.test(t) ? t.split(/\s+/) : (t.match(/.{1,2}/g) ?? []);
  const out = parts.map((p) => parseInt(p, 16));
  return out.some((n) => Number.isNaN(n) || n < 0 || n > 255 || parts.some((p) => p.length > 2)) ? null : out;
};

/** Base class: renders once, in the light DOM, inside a figure frame. */
abstract class Widget extends HTMLElement {
  abstract title: string;
  abstract caption: string;
  abstract body(): string;
  abstract wire(): void;
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = "1";
    this.innerHTML = `<figure class="wg"><figcaption class="wg-head"><strong>${this.title}</strong><span>${this.caption}</span></figcaption><div class="wg-body">${this.body()}</div></figure>`;
    this.wire();
  }
}

/* ───────────── byte and word order ───────────── */

const ORDERS: [string, number[], string][] = [
  ["ABCD", [0, 1, 2, 3], "big-endian, high word first"],
  ["CDAB", [2, 3, 0, 1], "low word first"],
  ["BADC", [1, 0, 3, 2], "bytes swapped"],
  ["DCBA", [3, 2, 1, 0], "little-endian"],
];
const LETTERS = ["A", "B", "C", "D"];

class ByteOrder extends Widget {
  title = tx("Try the four orders");
  caption = tx("Type a value to see the registers each order sends, or type the two registers you read to see what they mean.");
  body() {
    return `<div class="wg-tabs" role="tablist"><button data-m="v" aria-selected="true">${tx("Value → registers")}</button><button data-m="r" aria-selected="false">${tx("Registers → value")}</button></div>
    <div data-pane="v"><label>${tx("Value")} <input data-v value="230.5" inputmode="decimal"></label>
      <label>${tx("As")} <select data-t><option value="f">float32</option><option value="u">uint32</option><option value="i">int32</option></select></label></div>
    <div data-pane="r" hidden><label>${tx("Register 1")} <input data-r1 value="4366" maxlength="6"></label><label>${tx("Register 2")} <input data-r2 value="0" maxlength="6"></label><span class="wg-hint">${tx("decimal or 0x hex")}</span></div>
    <div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    let mode = "v";
    const num = (s: string) => (/^0x/i.test(s.trim()) ? parseInt(s, 16) : parseInt(s, 10)) & 0xffff;
    const draw = () => {
      let rows = "";
      if (mode === "v") {
        const t = ($(this, "[data-t]") as HTMLSelectElement).value;
        const val = Number(($(this, "[data-v]") as HTMLInputElement).value);
        if (Number.isNaN(val)) { out.textContent = tx("Enter a number."); return; }
        const dv = new DataView(new ArrayBuffer(4));
        if (t === "f") dv.setFloat32(0, val);
        else if (t === "u") dv.setUint32(0, val >>> 0);
        else dv.setInt32(0, val | 0);
        const b = [0, 1, 2, 3].map((i) => dv.getUint8(i));
        for (const [name, idx, note] of ORDERS) {
          const reg = [idx[0], idx[1], idx[2], idx[3]].map((i) => b[i]);
          rows += `<div class="wg-row"><b>${name}</b><span class="wg-bytes">${reg.map((v, k) => `<i class="bx c${idx[k]}" title="${LETTERS[idx[k]]}">${hex(v)}</i>`).join("")}</span><code>${hex(reg[0] << 8 | reg[1], 4)} ${hex(reg[2] << 8 | reg[3], 4)}</code><small>${tx(note)}</small></div>`;
        }
      } else {
        const r1 = num(($(this, "[data-r1]") as HTMLInputElement).value), r2 = num(($(this, "[data-r2]") as HTMLInputElement).value);
        const given = [r1 >> 8, r1 & 255, r2 >> 8, r2 & 255];
        for (const [name, idx, note] of ORDERS) {
          const abcd: number[] = [0, 0, 0, 0];
          idx.forEach((letter, pos) => (abcd[letter] = given[pos]));
          const dv = new DataView(Uint8Array.from(abcd).buffer);
          const f = dv.getFloat32(0);
          const fs = Number.isFinite(f) ? (Math.abs(f) >= 1e6 || (f !== 0 && Math.abs(f) < 1e-3) ? f.toExponential(3) : String(+f.toFixed(4))) : "NaN";
          rows += `<div class="wg-row"><b>${name}</b><span class="wg-bytes">${given.map((v, k) => `<i class="bx c${idx[k]}">${hex(v)}</i>`).join("")}</span><code>float32 ${fs}</code><code>uint32 ${dv.getUint32(0)}</code><small>${tx(note)}</small></div>`;
        }
      }
      out.innerHTML = rows + `<p class="wg-foot">${tx("Colours follow the bytes of the value:")} <i class="bx c0">A</i> ${tx("most significant")} … <i class="bx c3">D</i> ${tx("least.")}</p>`;
    };
    this.addEventListener("input", draw);
    this.querySelectorAll<HTMLButtonElement>("[data-m]").forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.m!;
        this.querySelectorAll("[data-m]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
        $(this, '[data-pane="v"]').hidden = mode !== "v";
        $(this, '[data-pane="r"]').hidden = mode !== "r";
        draw();
      }),
    );
    draw();
  }
}

/* ───────────── address notation ───────────── */

class AddressConverter extends Widget {
  title = tx("Convert a register number");
  caption = tx("Enter the number as your manual writes it. See the address that goes in the request.");
  body() {
    return `<label>${tx("Manual says")} <input data-n value="40108" inputmode="numeric"></label>
    <label>${tx("Notation")} <select data-s><option value="m">${tx("Modicon (4xxxx, 3xxxx…)")}</option><option value="1">${tx("Number counted from 1")}</option><option value="0">${tx("Protocol address, from 0")}</option></select></label>
    <div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    const draw = () => {
      const n = parseInt(($(this, "[data-n]") as HTMLInputElement).value, 10);
      const s = ($(this, "[data-s]") as HTMLSelectElement).value;
      if (Number.isNaN(n) || n < 0) { out.textContent = tx("Enter a whole number."); return; }
      let addr: number, area = tx("holding registers (function 03)"), fn = 3;
      if (s === "m") {
        const d = n >= 400000 ? 4 : n >= 300000 ? 3 : n >= 100000 ? 1 : n >= 40000 ? 4 : n >= 30000 ? 3 : n >= 10000 ? 1 : 0;
        const base = n >= 100000 ? n % 100000 : n % 10000;
        area = tx(({ 4: "holding registers (function 03)", 3: "input registers (function 04)", 1: "discrete inputs (function 02)", 0: "coils (function 01)" } as Record<number, string>)[d]);
        fn = ({ 4: 3, 3: 4, 1: 2, 0: 1 } as Record<number, number>)[d];
        addr = base - 1;
      } else addr = s === "1" ? n - 1 : n;
      if (addr < 0 || addr > 65535) { out.textContent = tx("That does not fit in a Modbus address (0 to 65535)."); return; }
      const frame = [1, fn, addr >> 8, addr & 255, 0, 1];
      out.innerHTML = `<div class="wg-big">${tx("Send address")} <b>${addr}</b> <small>(0x${hex(addr, 4)})</small></div>
      <p>${s === "m" ? esc(area) : tx("Area chosen by the function code you use.")} ${tx("Tools that count from 1 take {a1}; tools that take the protocol address take {a}.", { a1: `<b>${addr + 1}</b>`, a: `<b>${addr}</b>` })}</p>
      <div class="wg-frame" aria-label="${tx("Request bytes")}">${["unit", "function", "addr hi", "addr lo", "qty hi", "qty lo"].map((l, i) => `<span class="wg-cell" style="--d:${i * 90}ms"><i class="bx c${[3, 0, 1, 1, 2, 2][i]}">${hex(frame[i])}</i><small>${tx(l)}</small></span>`).join("")}</div>`;
    };
    this.addEventListener("input", draw);
    draw();
  }
}

/* ───────────── CRC-16 ───────────── */

export const crc16 = (data: number[]) => {
  let crc = 0xffff;
  for (const b of data) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >> 1) ^ 0xa001 : crc >> 1;
  }
  return crc;
};

class Crc extends Widget {
  title = tx("CRC calculator");
  caption = tx("Paste a frame in hex. Without its CRC you get the two bytes to append; with it, the check result.");
  body() {
    return `<label class="wide">${tx("Frame")} <input data-f value="01 03 00 6B 00 03" spellcheck="false"></label><div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    const draw = () => {
      const b = bytesOf(($(this, "[data-f]") as HTMLInputElement).value);
      if (!b || b.length === 0) { out.textContent = tx("Enter bytes as hex, for example 01 03 00 6B 00 03."); return; }
      const crc = crc16(b);
      const ok = b.length > 2 && crc16(b.slice(0, -2)) === ((b[b.length - 1] << 8) | b[b.length - 2]);
      out.innerHTML = `<div class="wg-frame">${b.map((v, i) => `<span class="wg-cell" style="--d:${i * 40}ms"><i class="bx c${i === 0 ? 3 : i === 1 ? 0 : 1}">${hex(v)}</i></span>`).join("")}<span class="wg-cell"><i class="bx crc">${hex(crc & 255)}</i><small>${tx("CRC lo")}</small></span><span class="wg-cell"><i class="bx crc">${hex(crc >> 8)}</i><small>${tx("CRC hi")}</small></span></div>
      <p>${tx("CRC-16/MODBUS of these {n} bytes: {crc}, sent {low} ({bytes}).", { n: b.length, crc: `<b>0x${hex(crc, 4)}</b>`, low: `<b>${tx("low byte first")}</b>`, bytes: `${hex(crc & 255)} ${hex(crc >> 8)}` })}</p>
      ${b.length > 2 ? `<p class="${ok ? "wg-ok" : "wg-no"}">${ok ? tx("✓ The last two bytes are the correct CRC for the frame before them.") : tx("If this frame already ends with its CRC, those two bytes do not match the rest.")}</p>` : ""}`;
    };
    this.addEventListener("input", draw);
    draw();
  }
}

/* ───────────── RTU against TCP frame ───────────── */

class AduCompare extends Widget {
  title = tx("The same request, on two buses");
  caption = tx("Read 3 holding registers from address 107 of unit 1. Hover a byte to see its role.");
  body() {
    return `<label>${tx("Unit")} <input data-u value="1" size="3"></label><label>${tx("Function")} <select data-fn><option>3</option><option>4</option><option>1</option><option>2</option></select></label><label>${tx("Address")} <input data-a value="107" size="6"></label><label>${tx("Quantity")} <input data-q value="3" size="4"></label><div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    const draw = () => {
      const g = (s: string) => Math.max(0, Math.min(65535, parseInt(($(this, s) as HTMLInputElement).value, 10) || 0));
      const u = Math.min(255, g("[data-u]")), fn = parseInt(($(this, "[data-fn]") as HTMLSelectElement).value, 10), a = g("[data-a]"), q = g("[data-q]");
      const pdu: [number, string, string][] = [[fn, tx("Function code"), "c0"], [a >> 8, tx("Address, high byte"), "c1"], [a & 255, tx("Address, low byte"), "c1"], [q >> 8, tx("Quantity, high byte"), "c2"], [q & 255, tx("Quantity, low byte"), "c2"]];
      const rtuCore = [u, fn, a >> 8, a & 255, q >> 8, q & 255];
      const crc = crc16(rtuCore);
      const cell = (v: number, t: string, c: string, d: number) => `<span class="wg-cell" style="--d:${d}ms"><i class="bx ${c}" title="${t}">${hex(v)}</i></span>`;
      const rtu = [cell(u, tx("Unit ID"), "c3", 0), ...pdu.map((p, i) => cell(p[0], p[1], p[2], 70 * (i + 1))), cell(crc & 255, tx("CRC, low byte"), "crc", 450), cell(crc >> 8, tx("CRC, high byte"), "crc", 520)].join("");
      const mbap = [[0, tx("Transaction ID, high byte")], [1, tx("Transaction ID, low byte")], [0, tx("Protocol ID (always 0)")], [0, tx("Protocol ID (always 0)")], [0, tx("Length, high byte")], [6, tx("Length: bytes that follow")]];
      const tcp = [...mbap.map((m, i) => cell(m[0] as number, m[1] as string, "mb", 70 * i)), cell(u, tx("Unit ID"), "c3", 420), ...pdu.map((p, i) => cell(p[0], p[1], p[2], 490 + 70 * i))].join("");
      out.innerHTML = `<div class="wg-lane"><b>${tx("RTU on RS-485")}</b><div class="wg-frame">${rtu}</div><small>${tx("{n} bytes: unit, PDU, CRC", { n: rtuCore.length + 2 })}</small></div>
      <div class="wg-lane"><b>Modbus TCP</b><div class="wg-frame">${tcp}</div><small>${tx("{n} bytes: MBAP header, unit, PDU, no CRC (TCP already checks)", { n: 6 + 1 + pdu.length })}</small></div>
      <p class="wg-foot"><i class="bx c3">${tx("unit")}</i> <i class="bx c0">${tx("function")}</i> <i class="bx c1">${tx("address")}</i> <i class="bx c2">${tx("quantity")}</i> <i class="bx crc">CRC</i> <i class="bx mb">MBAP</i></p>`;
    };
    this.addEventListener("input", draw);
    draw();
  }
}

/* ───────────── scaling ───────────── */

class Scaling extends Widget {
  title = tx("From raw register to engineering value");
  caption = tx("value = raw × scale + offset. Drag the raw value, or set it as signed.");
  body() {
    return `<label class="wide">${tx("Raw register")} <input data-raw type="range" min="0" max="65535" value="2305"> <output data-ro>2305</output></label>
    <label>${tx("Scale")} <input data-sc value="0.1" size="7"></label><label>${tx("Offset")} <input data-of value="0" size="6"></label><label>${tx("Unit")} <input data-un value="V" size="5"></label>
    <label><input type="checkbox" data-sg> ${tx("read as signed 16-bit")}</label><div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    const draw = () => {
      let raw = +($(this, "[data-raw]") as HTMLInputElement).value;
      const signed = ($(this, "[data-sg]") as HTMLInputElement).checked;
      const r16 = signed && raw > 32767 ? raw - 65536 : raw;
      const sc = Number(($(this, "[data-sc]") as HTMLInputElement).value), of = Number(($(this, "[data-of]") as HTMLInputElement).value);
      ($(this, "[data-ro]") as HTMLOutputElement).textContent = `${raw} (0x${hex(raw, 4)})`;
      const v = r16 * (Number.isNaN(sc) ? 1 : sc) + (Number.isNaN(of) ? 0 : of);
      const note = raw === 0xffff ? tx("0xFFFF is often a device's “no value”, not a reading.") : raw === 0x8000 && signed ? tx("0x8000 as a signed value is often “no value” too.") : "";
      out.innerHTML = `<div class="wg-big">${raw}${signed && raw !== r16 ? ` → ${r16}` : ""} × ${Number.isNaN(sc) ? "?" : sc} ${of ? `+ ${of} ` : ""}= <b>${+v.toFixed(6)} ${esc(($(this, "[data-un]") as HTMLInputElement).value)}</b></div>${note ? `<p class="wg-no">${note}</p>` : ""}
      <div class="wg-meter"><span style="width:${(raw / 65535) * 100}%"></span></div>`;
    };
    this.addEventListener("input", draw);
    draw();
  }
}

/* ───────────── exception codes ───────────── */

const EXC: [number, string, string, string][] = [
  [1, "Illegal function", "The device does not support this function code for this area.", "Use a different function (for example 03 instead of 04) or check the device's supported list."],
  [2, "Illegal data address", "A register in the range does not exist on the device.", "Shorten the block, start at a listed register, or check the address offset."],
  [3, "Illegal data value", "The quantity or the value written is not allowed.", "Reduce the quantity (often limited to 125 or fewer) or write a value inside the range."],
  [4, "Server device failure", "The device failed while handling a valid request.", "Retry later; check the device's own fault state."],
  [5, "Acknowledge", "The request was accepted and needs time.", "Poll again later; do not resend the write."],
  [6, "Server device busy", "The device is busy with a long command.", "Wait, then retry."],
  [8, "Memory parity error", "Extended memory failed its check.", "Rare: a device fault."],
  [10, "Gateway path unavailable", "A gateway could not route the request.", "Check the gateway's unit-ID routing."],
  [11, "Gateway target failed to respond", "The device behind a gateway did not answer.", "Check the serial side: wiring, address, baud rate."],
];

class Exceptions extends Widget {
  title = tx("Exception codes");
  caption = tx("Choose a code to see the response frame and what usually causes it.");
  body() {
    return `<div class="wg-chips">${EXC.map((e, i) => `<button data-i="${i}" aria-pressed="${i === 1}">${hex(e[0])}</button>`).join("")}</div><div class="wg-out" data-out></div>`;
  }
  wire() {
    const out = $(this, "[data-out]");
    const show = (i: number) => {
      const [c, name, why, fix] = EXC[i];
      const core = [1, 0x83, c], crc = crc16(core);
      out.innerHTML = `<div class="wg-frame">${[[1, "unit", "c3"], [0x83, "fn + 0x80", "c0"], [c, "exception", "no"], [crc & 255, "CRC lo", "crc"], [crc >> 8, "CRC hi", "crc"]].map((x, k) => `<span class="wg-cell" style="--d:${k * 90}ms"><i class="bx ${x[2]}">${hex(x[0] as number)}</i><small>${tx(x[1] as string)}</small></span>`).join("")}</div>
      <h4>${hex(c)} ${esc(tx(name))}</h4><p>${esc(tx(why))}</p><p><b>${tx("What to try:")}</b> ${esc(tx(fix))}</p>`;
      this.querySelectorAll("[data-i]").forEach((b) => b.setAttribute("aria-pressed", String((b as HTMLElement).dataset.i === String(i))));
    };
    this.querySelectorAll<HTMLButtonElement>("[data-i]").forEach((b) => b.addEventListener("click", () => show(+b.dataset.i!)));
    show(1);
  }
}

/* ───────────── gateway and unit IDs (animated) ───────────── */

class Gateway extends Widget {
  title = tx("A gateway and its unit IDs");
  caption = tx("Click a device. The request carries its unit ID; the gateway forwards it to the right serial slave.");
  body() {
    const dev = [[1, 40], [2, 100], [3, 160]];
    return `<svg viewBox="0 0 560 220" class="wg-svg" role="img" aria-label="${tx("Master, gateway and three serial devices")}">
      <rect x="10" y="80" width="90" height="60" rx="8" class="n"/><text x="55" y="115" text-anchor="middle">${tx("Master")}</text>
      <rect x="215" y="80" width="110" height="60" rx="8" class="n g"/><text x="270" y="108" text-anchor="middle">${tx("Gateway")}</text><text x="270" y="126" text-anchor="middle" class="s">TCP ⇄ RS-485</text>
      <path d="M100 110 H215" class="w"/><path d="M325 110 H370 V40 M370 110 V100 M370 110 V160" class="w"/>
      ${dev.map(([id, y]) => `<g data-d="${id}" class="dev" tabindex="0" role="button" aria-label="${tx("Device with unit ID {n}", { n: id })}"><path d="M370 ${y} H410" class="w"/><rect x="410" y="${y - 22}" width="140" height="44" rx="8" class="n"/><text x="480" y="${y + 4}" text-anchor="middle">${tx("Device · unit {n}", { n: id })}</text></g>`).join("")}
      <circle r="7" class="pk" cx="100" cy="110" data-pk opacity="0"/>
    </svg><div class="wg-out" data-out>${tx("Click a device.")}</div>`;
  }
  wire() {
    const pk = $(this, "[data-pk]") as unknown as SVGElement, out = $(this, "[data-out]");
    const ys: Record<string, number> = { "1": 40, "2": 100, "3": 160 };
    const go = (id: string) => {
      this.querySelectorAll(".dev").forEach((d) => d.classList.toggle("on", (d as SVGElement).dataset.d === id));
      const path = [[100, 110], [270, 110], [370, 110], [370, ys[id]], [480, ys[id]]];
      let step = 0;
      pk.setAttribute("opacity", "1");
      out.innerHTML = tx("Request: {code} → the gateway routes by unit ID {id} to that device on the serial line. A device answers only to its own ID; use the wrong one and the gateway returns a timeout or exception 0B.", { code: `<code>${tx("unit {n} · function 03 · …", { n: id })}</code>`, id: `<b>${id}</b>` });
      const t0 = performance.now();
      const dur = 500;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / (dur * (path.length - 1)));
        const f = p * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), k = f - i;
        pk.setAttribute("cx", String(path[i][0] + (path[i + 1][0] - path[i][0]) * k));
        pk.setAttribute("cy", String(path[i][1] + (path[i + 1][1] - path[i][1]) * k));
        step = p;
        if (step < 1) requestAnimationFrame(tick);
        else setTimeout(() => pk.setAttribute("opacity", "0.0"), 400);
      };
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(tick);
    };
    this.querySelectorAll<SVGElement>(".dev").forEach((d) => {
      d.addEventListener("click", () => go(d.dataset.d!));
      d.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") go(d.dataset.d!); });
    });
  }
}

/* ───────────── decision flows ───────────── */

type Node = { q?: string; a?: string; yes?: string; no?: string; info?: string };
const FLOWS: Record<string, { title: string; start: string; nodes: Record<string, Node> }> = {
  timeout: {
    title: "No answer at all",
    start: "type",
    nodes: {
      type: { q: "Is the device on RS-485 (serial)?", yes: "ser", no: "tcp" },
      ser: { q: "Is the bus wired A to A and B to B (or swapped once)?", yes: "ser2", no: "a:Swap A and B at one end; many devices label them the other way round.", info: "Polarity swaps are the most common cause of silence." },
      ser2: { q: "Do baud rate, parity and stop bits match the device?", yes: "ser3", no: "a:Set the same baud rate, parity and stop bits on both ends. 8E1 and 8N2 look alike on paper." },
      ser3: { q: "Does the unit ID match, and is only one master on the bus?", yes: "a:Check termination (120 Ω at both ends) and the reply timeout; then try a lower baud rate.", no: "a:Set the right unit ID; two masters on one bus corrupt each other." },
      tcp: { q: "Does a plain TCP connection to port 502 open?", yes: "tcp2", no: "a:Check IP, firewall and that Modbus TCP is enabled on the device (it is often off by default)." },
      tcp2: { q: "Do you get an answer with unit ID 0, 1 or 255?", yes: "a:Use the unit ID that answers; many devices ignore the others.", no: "a:Check whether the device allows only one connection at a time and close other clients." },
    },
  },
  find: {
    title: "Where to look for a register map",
    start: "m",
    nodes: {
      m: { q: "Is the device already in the MBMap library?", yes: "a:Open its page: registers, scaling and byte order are in the map.", no: "doc" },
      doc: { q: "Does the manufacturer publish a “Modbus”, “communication” or “protocol” document?", yes: "a:Download it, then add the map (see Contribute) or open a map request.", no: "oem" },
      oem: { q: "Is it an OEM or rebadged product?", yes: "a:Search the original manufacturer's name and model: the register map is usually the same.", no: "a:Ask the manufacturer's support for the Modbus list, then open a map request with the device name." },
    },
  },
  write: {
    title: "Before you write a register",
    start: "r",
    nodes: {
      r: { q: "Is the register marked writable in the map or manual?", yes: "p", no: "a:Do not write it. A read-only register may accept the write and misbehave." },
      p: { q: "Do you know its range and unit?", yes: "f", no: "a:Read the manual first; a wrong unit can be a 10× setting." },
      f: { q: "Is it written often, or does it live in flash/EEPROM?", yes: "a:Write only when the value changes; flash has a limited number of writes.", no: "a:Write one value, read it back, and check the device's own display." },
    },
  },
};

class Flow extends Widget {
  title = tx("Decision guide");
  caption = tx("Answer the questions.");
  body() { return `<div class="wg-out" data-out></div>`; }
  wire() {
    const f = FLOWS[this.getAttribute("name") ?? ""];
    const out = $(this, "[data-out]");
    if (!f) { out.textContent = tx("Unknown flow."); return; }
    this.querySelector(".wg-head strong")!.textContent = tx(f.title);
    const trail: string[] = [];
    const render = (id: string) => {
      const n = f.nodes[id];
      const steps = trail.map((t) => `<li>${esc(t)}</li>`).join("");
      if (n.q)
        out.innerHTML = `${steps ? `<ol class="wg-trail">${steps}</ol>` : ""}<h4>${esc(tx(n.q))}</h4><div class="wg-yn"><button data-y>${tx("Yes")}</button><button data-n>${tx("No")}</button></div>${trail.length ? `<button class="wg-link" data-reset>${tx("Start over")}</button>` : ""}`;
      out.querySelector("[data-y]")?.addEventListener("click", () => go(id, "yes"));
      out.querySelector("[data-n]")?.addEventListener("click", () => go(id, "no"));
      out.querySelector("[data-reset]")?.addEventListener("click", () => { trail.length = 0; render(f.start); });
    };
    const go = (id: string, branch: "yes" | "no") => {
      const n = f.nodes[id], next = n[branch]!;
      trail.push(`${tx(n.q!)} ${branch === "yes" ? tx("Yes") : tx("No")}`);
      if (next.startsWith("a:"))
        out.innerHTML = `<ol class="wg-trail">${trail.map((t) => `<li>${esc(t)}</li>`).join("")}</ol><div class="wg-answer"><b>→</b> ${esc(tx(next.slice(2)))}</div><button class="wg-link" data-reset>${tx("Start over")}</button>`,
          out.querySelector("[data-reset]")!.addEventListener("click", () => { trail.length = 0; render(f.start); });
      else render(next);
    };
    render(f.start);
  }
}

for (const [tag, cls] of [
  ["mb-byte-order", ByteOrder], ["mb-address", AddressConverter], ["mb-crc", Crc], ["mb-adu", AduCompare],
  ["mb-scaling", Scaling], ["mb-exceptions", Exceptions], ["mb-gateway", Gateway], ["mb-flow", Flow],
] as const)
  if (!customElements.get(tag)) customElements.define(tag, cls as unknown as CustomElementConstructor);
