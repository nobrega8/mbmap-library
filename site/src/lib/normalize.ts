// Reads a parsed .mbmap file into the shape the site shows. Lenient on
// purpose: SPEC.md defaults fill in missing keys, and a register that cannot
// be shown is counted and left out instead of failing the whole page. The
// library's own validator (tools/validate) is what enforces the spec.

import {
  type Access,
  type Area,
  type Order,
  type Status,
  AREAS,
  mapStatus,
  parseInteger,
} from "./mbmap.ts";

export interface Source {
  title: string;
  version?: string;
  date?: string;
  url?: string;
  note?: string;
}

export interface Register {
  /** Position in the file's registers array */
  i: number;
  name: string;
  group?: string;
  area: Area;
  /** As written in the map, in its address_base */
  address: number;
  /** On the wire: address − address_base */
  wire: number;
  type: string;
  length?: number;
  bit?: number;
  bits?: number;
  scale?: number;
  scaleFactor?: string;
  offset?: number;
  unit?: string;
  access: Access;
  byteOrder: Order;
  wordOrder: Order;
  writeMin?: number;
  writeMax?: number;
  /** Translation table, resolved from a name in enums when needed */
  enumName?: string;
  enumTable?: [string, string][];
  reference?: string;
  role?: string;
  firmwareMin?: string;
  firmwareMax?: string;
  description?: string;
  comment?: string;
}

export interface MapInfo {
  vendor: string;
  model: string;
  models: string[];
  description?: string;
  vendorWebsite?: string;
  status: Status | null;
  revision?: number;
  revised?: string;
  firmware?: string;
  firmwareMin?: string;
  firmwareMax?: string;
  source?: string;
  sources: Source[];
  notes: string[];
  /** Keys the file sets, so the page can tell a default from a stated value */
  stated: string[];
  protocol: string;
  unitId: number;
  port: number;
  baudrate: number;
  parity: string;
  databits: number;
  stopbits: number;
  byteOrder: Order;
  wordOrder: Order;
  addressBase: number;
  maxReadRegisters: number;
  maxReadBits: number;
  enumCount: number;
  registers: Register[];
  /** Registers left out because a required key was missing or wrong */
  skipped: number;
}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() !== "" ? v : undefined;

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function oneOf<T extends string | number>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function intIn(v: unknown, min: number, max: number, fallback: number): number {
  const n = parseInteger(v);
  return n != null && n >= min && n <= max ? n : fallback;
}

/** A translation table as sorted [raw, label] pairs. */
function table(v: unknown): [string, string][] | undefined {
  if (!isObject(v)) return undefined;
  const rows = Object.entries(v)
    .filter((e): e is [string, string] => typeof e[1] === "string")
    .map(([k, label]) => [k, label] as [string, string]);
  if (!rows.length) return undefined;
  return rows.sort((a, b) => (parseInteger(a[0]) ?? 0) - (parseInteger(b[0]) ?? 0));
}

function register(raw: unknown, i: number, map: MapInfo, enums: Json): Register | null {
  if (!isObject(raw)) return null;
  const name = str(raw.name);
  const area = AREAS.includes(raw.area as Area) ? (raw.area as Area) : null;
  const address = parseInteger(raw.address);
  const type = str(raw.type);
  if (!name || !area || address == null || !type) return null;

  const r: Register = {
    i,
    name,
    area,
    address,
    wire: address - map.addressBase,
    type,
    access: oneOf(raw.access, ["R", "W", "RW"] as const, "R"),
    byteOrder: oneOf(raw.byte_order, ["big", "little"] as const, map.byteOrder),
    wordOrder: oneOf(raw.word_order, ["big", "little"] as const, map.wordOrder),
  };
  const group = str(raw.group);
  if (group) r.group = group;
  const length = parseInteger(raw.length);
  if (length != null) r.length = length;
  const bit = parseInteger(raw.bit);
  if (bit != null) r.bit = bit;
  const bits = parseInteger(raw.bits);
  if (bits != null) r.bits = bits;
  const scale = num(raw.scale);
  if (scale != null && scale !== 1) r.scale = scale;
  const offset = num(raw.offset);
  if (offset != null && offset !== 0) r.offset = offset;
  const scaleFactor = str(raw.scale_factor);
  if (scaleFactor) r.scaleFactor = scaleFactor;
  const unit = str(raw.unit);
  if (unit) r.unit = unit;
  const writeMin = num(raw.write_min);
  if (writeMin != null) r.writeMin = writeMin;
  const writeMax = num(raw.write_max);
  if (writeMax != null) r.writeMax = writeMax;
  if (typeof raw.enum === "string") {
    r.enumName = raw.enum;
    r.enumTable = table(enums[raw.enum]);
  } else {
    r.enumTable = table(raw.enum);
  }
  if (!r.enumTable) delete r.enumTable;
  if (raw.reference !== undefined) {
    r.reference = typeof raw.reference === "string" ? raw.reference : JSON.stringify(raw.reference);
  }
  for (const [key, prop] of [
    ["role", "role"],
    ["firmware_min", "firmwareMin"],
    ["firmware_max", "firmwareMax"],
    ["description", "description"],
    ["comment", "comment"],
  ] as const) {
    const v = str(raw[key]);
    if (v) r[prop] = v;
  }
  return r;
}

/** Normalises a parsed map. Throws only when the file is not a map at all. */
export function normalizeMap(doc: unknown): MapInfo {
  if (!isObject(doc)) throw new Error("not a JSON object");
  const vendor = str(doc.vendor);
  const model = str(doc.model);
  if (!vendor || !model) throw new Error("vendor or model missing");
  if (!Array.isArray(doc.registers)) throw new Error("registers missing");

  const models = Array.isArray(doc.models)
    ? doc.models.filter((m): m is string => typeof m === "string" && m !== "")
    : [];
  const sources = Array.isArray(doc.sources)
    ? doc.sources.filter(isObject).flatMap((s): Source[] => {
        const title = str(s.title);
        if (!title) return [];
        const out: Source = { title };
        for (const k of ["version", "date", "note"] as const) {
          const v = str(s[k]);
          if (v) out[k] = v;
        }
        const url = str(s.url);
        if (url && /^https?:\/\//.test(url)) out.url = url;
        return [out];
      })
    : [];
  const enums = isObject(doc.enums) ? doc.enums : {};

  const map: MapInfo = {
    vendor,
    model,
    models: models.length ? models : [model],
    description: str(doc.description),
    vendorWebsite: str(doc.vendor_website),
    status: mapStatus(doc.x_status),
    revision: parseInteger(doc.revision) ?? undefined,
    revised: str(doc.revised),
    firmware: str(doc.firmware),
    firmwareMin: str(doc.firmware_min),
    firmwareMax: str(doc.firmware_max),
    source: str(doc.source),
    sources,
    notes: Array.isArray(doc.notes) ? doc.notes.filter((n): n is string => typeof n === "string") : [],
    stated: Object.keys(doc),
    protocol: oneOf(doc.protocol, ["tcp", "rtu", "tcp+rtu"] as const, "tcp+rtu"),
    unitId: intIn(doc.unit_id, 0, 255, 1),
    port: intIn(doc.port, 1, 65535, 502),
    baudrate: intIn(doc.baudrate, 1, 10_000_000, 9600),
    parity: oneOf(doc.parity, ["N", "E", "O"] as const, "E"),
    databits: oneOf(parseInteger(doc.databits), [7, 8], 8),
    stopbits: oneOf(parseInteger(doc.stopbits), [1, 2], 1),
    byteOrder: oneOf(doc.byte_order, ["big", "little"] as const, "big"),
    wordOrder: oneOf(doc.word_order, ["big", "little"] as const, "big"),
    addressBase: oneOf(parseInteger(doc.address_base), [0, 1], 0),
    maxReadRegisters: intIn(doc.max_read_registers, 1, 125, 125),
    maxReadBits: intIn(doc.max_read_bits, 1, 2000, 2000),
    enumCount: Object.keys(enums).length,
    registers: [],
    skipped: 0,
  };

  doc.registers.forEach((raw, i) => {
    const r = register(raw, i, map, enums);
    if (r) map.registers.push(r);
    else map.skipped++;
  });
  return map;
}

/** Parses the text of a map file, accepting a leading BOM (SPEC.md §2). */
export function parseMap(text: string): MapInfo {
  return normalizeMap(JSON.parse(text.replace(/^﻿/, "")));
}
