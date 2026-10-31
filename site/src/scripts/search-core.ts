// Client-side search over the registry: the device list (always) and the
// register names (loaded on the first query long enough to need them).
// Case-insensitive, accent-insensitive, every word must match.

import { type Status, fold } from "../lib/mbmap.ts";
import { href } from "../lib/base.ts";

/** One device in /search/devices.json; short keys keep the file small. */
export interface DeviceEntry {
  /** page URL */
  u: string;
  /** vendor, vendor slug, model */
  v: string;
  vs: string;
  m: string;
  /** other model names the map covers */
  ms?: string[];
  d?: string;
  s: Status | null;
  /** register count */
  r: number;
  /** protocol, when the map states it */
  p?: string;
  /** date added to the library */
  a?: string;
  /** manufacturer icon URL */
  i?: string;
}

export interface Hit {
  entry: DeviceEntry;
  index: number;
  score: number;
  /** The register name or description that matched, for a register hit */
  line?: string;
}

/** Shortest query that also searches register names */
export const REGISTER_QUERY_MIN = 3;

let devices: Promise<DeviceEntry[]> | null = null;
let registers: Promise<string[][]> | null = null;
let folded: string[] | null = null;

export function loadDevices(): Promise<DeviceEntry[]> {
  devices ??= fetch(href("/search/devices.json"))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<DeviceEntry[]>;
    })
    .catch((e) => {
      devices = null; // try again next time
      throw e;
    });
  return devices;
}

export function loadRegisters(): Promise<string[][]> {
  registers ??= fetch(href("/search/registers.json"))
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<string[]>;
    })
    .then((all) => all.map((s) => (s ? s.split("\n") : [])))
    .catch((e) => {
      registers = null;
      throw e;
    });
  return registers;
}

export function tokens(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

function deviceText(e: DeviceEntry): string {
  return fold([e.v, e.m, ...(e.ms ?? []), e.d ?? ""].join(" "));
}

/**
 * Devices that match every word of the query, best first. A word can match
 * the manufacturer, model names or description; words left over must all
 * match one register name or description, when register lines are given.
 */
export function search(entries: DeviceEntry[], query: string, regLines?: string[][] | null): Hit[] {
  const words = tokens(query);
  if (!words.length) return entries.map((entry, index) => ({ entry, index, score: 0 }));
  folded ??= entries.map(deviceText);

  const hits: Hit[] = [];
  entries.forEach((entry, index) => {
    const text = folded![index]!;
    const model = fold(entry.m);
    const vendor = fold(entry.v);
    let score = 0;
    const rest: string[] = [];
    for (const w of words) {
      if (!text.includes(w)) {
        rest.push(w);
        continue;
      }
      if (model === w) score += 12;
      else if (model.startsWith(w)) score += 6;
      else if (model.includes(w)) score += 4;
      else if (vendor.startsWith(w)) score += 3;
      else if (vendor.includes(w)) score += 2;
      else score += 1;
    }
    if (!rest.length) {
      hits.push({ entry, index, score: score + 100 });
      return;
    }
    const lines = regLines?.[index];
    if (!lines) return;
    const line = lines.find((l) => {
      const f = fold(l);
      return rest.every((w) => f.includes(w));
    });
    if (line) hits.push({ entry, index, score, line });
  });
  return hits.sort((a, b) => b.score - a.score);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export { escapeHtml };

/** HTML of `text` with the query's words marked. */
export function highlight(text: string, query: string): string {
  const words = query
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return escapeHtml(text);
  const re = new RegExp(`(${words.join("|")})`, "gi");
  return text
    .split(re)
    .map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join("");
}
