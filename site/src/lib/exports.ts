// Other formats of a map, built at build time from the same data as the
// device page: a CSV of every register and a Home Assistant `modbus:`
// configuration. The .mbmap.json file stays the source; these are
// conveniences, and say so in their header.

import type { MapInfo, Register } from "./normalize.ts";
import { modicon, orderTag, registerCount } from "./mbmap.ts";

export interface ExportFormat {
  /** Extension added to the map's file name */
  ext: string;
  label: string;
  mime: string;
  build: (info: MapInfo, pageUrl: string) => string;
}

const csvCell = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const CSV_COLUMNS = [
  "name",
  "group",
  "area",
  "address",
  "wire_address",
  "modicon",
  "type",
  "registers",
  "bit",
  "bits",
  "length",
  "byte_word_order",
  "scale",
  "scale_factor",
  "offset",
  "unit",
  "access",
  "enum",
  "role",
  "description",
] as const;

function csvRow(r: Register): string[] {
  const enumText = r.enumTable?.map(([k, v]) => `${k}=${v}`).join("; ") ?? "";
  const width = registerCount(r.type, r.length);
  return [
    r.name,
    r.group ?? "",
    r.area,
    String(r.address),
    String(r.wire),
    modicon(r.area, r.wire) ?? "",
    r.type,
    width == null ? "" : String(width),
    r.bit == null ? "" : String(r.bit),
    r.bits == null ? "" : String(r.bits),
    r.length == null ? "" : String(r.length),
    width != null && width > 1 && r.type !== "string" ? orderTag(r.byteOrder, r.wordOrder) : "",
    r.scale == null ? "" : String(r.scale),
    r.scaleFactor ?? "",
    r.offset == null ? "" : String(r.offset),
    r.unit ?? "",
    r.access,
    enumText,
    r.role ?? "",
    r.description ?? "",
  ];
}

/** Every register, one per line. `address` is as the map writes it,
    `wire_address` what goes in the Modbus frame. */
export function toCsv(info: MapInfo): string {
  const lines = [CSV_COLUMNS.join(","), ...info.registers.map((r) => csvRow(r).map(csvCell).join(","))];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

// Home Assistant (https://www.home-assistant.io/integrations/modbus/)

const HA_TYPES = new Set(["int16", "uint16", "int32", "uint32", "int64", "uint64", "float32", "float64", "string"]);
const HA_INPUT: Partial<Record<Register["area"], string>> = { holding: "holding", input: "input" };

const yamlStr = (s: string) => JSON.stringify(s);

function swap(r: Register): string | null {
  const width = registerCount(r.type, r.length) ?? 1;
  if (r.type === "string") return null;
  const byte = r.byteOrder === "little";
  const word = width > 1 && r.wordOrder === "little";
  if (byte && word) return "word_byte";
  if (word) return "word";
  if (byte) return "byte";
  return null;
}

function decimals(scale: number | undefined): number {
  if (scale == null || scale >= 1) return 0;
  return Math.min(6, Math.max(0, Math.ceil(-Math.log10(scale) - 1e-9)));
}

/** A `modbus:` block with one sensor per readable number or text register and
    one binary sensor per readable coil or discrete input. Registers Home
    Assistant cannot read as they are (bits inside a register, scale factor
    registers) are listed as comments. */
export function toHomeAssistant(info: MapInfo, pageUrl: string): string {
  const out: string[] = [];
  const skipped: string[] = [];
  const sensors: string[] = [];
  const binary: string[] = [];
  const slug = `${info.vendor} ${info.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const seen = new Map<string, number>();
  const uid = (name: string) => {
    const base = `${slug}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`.slice(0, 120);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base}_${n}` : base;
  };

  for (const r of info.registers) {
    if (r.access === "W") continue;
    if (r.area === "coil" || r.area === "discrete") {
      binary.push(
        [
          `      - name: ${yamlStr(r.name)}`,
          `        unique_id: ${uid(r.name)}`,
          `        slave: ${info.unitId}`,
          `        address: ${r.wire}`,
          `        input_type: ${r.area === "coil" ? "coil" : "discrete_input"}`,
        ].join("\n"),
      );
      continue;
    }
    const input = HA_INPUT[r.area];
    if (!input || !HA_TYPES.has(r.type) || r.bit != null || r.scaleFactor) {
      skipped.push(`${r.name} (${r.area} ${r.wire}, ${r.type}${r.bit != null ? ` bit ${r.bit}` : ""}${r.scaleFactor ? `, scale factor ${r.scaleFactor}` : ""})`);
      continue;
    }
    const lines = [
      `      - name: ${yamlStr(r.name)}`,
      `        unique_id: ${uid(r.name)}`,
      `        slave: ${info.unitId}`,
      `        address: ${r.wire}`,
      `        input_type: ${input}`,
      `        data_type: ${r.type}`,
    ];
    if (r.type === "string") lines.push(`        count: ${r.length ?? 1}`);
    const s = swap(r);
    if (s) lines.push(`        swap: ${s}`);
    if (r.scale != null) lines.push(`        scale: ${r.scale}`, `        precision: ${decimals(r.scale)}`);
    if (r.offset != null) lines.push(`        offset: ${r.offset}`);
    if (r.unit && r.type !== "string") lines.push(`        unit_of_measurement: ${yamlStr(r.unit)}`);
    if (r.enumTable) lines.push(`        # values: ${r.enumTable.map(([k, v]) => `${k} = ${v}`).join(", ").slice(0, 300)}`);
    sensors.push(lines.join("\n"));
  }

  const rtu = info.protocol === "rtu";
  out.push(
    `# Home Assistant Modbus configuration for the ${info.vendor} ${info.model}`,
    `# Generated from ${pageUrl}`,
    `# Check the host or serial port and the slave address before use; values from the map are defaults.`,
    `# Writable settings are left out: add them as needed (modbus.write_register).`,
    ``,
    `modbus:`,
    `  - name: ${slug}`,
  );
  if (rtu) {
    out.push(
      `    type: serial`,
      `    method: rtu`,
      `    port: /dev/ttyUSB0`,
      `    baudrate: ${info.baudrate}`,
      `    bytesize: ${info.databits}`,
      `    parity: ${info.parity}`,
      `    stopbits: ${info.stopbits}`,
    );
  } else {
    out.push(`    type: tcp`, `    host: 192.168.1.100`, `    port: ${info.port}`);
  }
  if (sensors.length) out.push(`    sensors:`, ...sensors);
  if (binary.length) out.push(`    binary_sensors:`, ...binary);
  if (skipped.length) {
    out.push(``, `# Not included (Home Assistant cannot read them directly):`, ...skipped.map((s) => `#   ${s}`));
  }
  return out.join("\n") + "\n";
}

export const EXPORTS: ExportFormat[] = [
  { ext: ".csv", label: "CSV", mime: "text/csv; charset=utf-8", build: (info) => toCsv(info) },
  { ext: ".ha.yaml", label: "Home Assistant", mime: "text/yaml; charset=utf-8", build: toHomeAssistant },
];

/** /exports/<vendor>/<model><ext> */
export const exportPath = (mapPath: string, ext: string) =>
  `exports/${mapPath.slice("maps/".length).replace(/\.mbmap\.json$/, "")}${ext}`;
