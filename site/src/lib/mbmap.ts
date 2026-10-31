// The .mbmap format as SPEC.md describes it, and the labels Modbench uses to
// show it. Shared by the build and the browser scripts, so it imports nothing.

export type Area = "coil" | "discrete" | "input" | "holding";
export type Access = "R" | "W" | "RW";
export type Order = "big" | "little";
export type Status = "verified" | "official" | "unofficial";

export const AREAS: Area[] = ["holding", "input", "coil", "discrete"];
export const STATUSES: Status[] = ["verified", "official", "unofficial"];

/** Area tags as Modbench shows them in its register table. */
export const AREA_TAG: Record<Area, string> = {
  coil: "CO",
  discrete: "DI",
  input: "IR",
  holding: "HR",
};

export const AREA_NAME: Record<Area, string> = {
  coil: "Coil",
  discrete: "Discrete input",
  input: "Input register",
  holding: "Holding register",
};

/** Modbus function codes that read and write each area (SPEC.md §5). */
export const AREA_FUNCTIONS: Record<Area, string> = {
  coil: "FC01 read · FC05/FC15 write",
  discrete: "FC02 read",
  input: "FC04 read",
  holding: "FC03 read · FC06/FC16 write",
};

export const ACCESS_NAME: Record<Access, string> = {
  R: "Read only",
  W: "Write only",
  RW: "Read / write",
};

/** The meaning of each x_status, in the words of README.md. */
export const STATUS_INFO: Record<Status, { label: string; short: string; long: string }> = {
  verified: {
    label: "Verified",
    short: "Tested on a real device",
    long: "Tested on a real device.",
  },
  official: {
    label: "Official",
    short: "From manufacturer documentation, not tested",
    long: "Written from the manufacturer's documentation, but not tested on a device yet.",
  },
  unofficial: {
    label: "Unofficial",
    short: "From unofficial sources, not tested",
    long: "Copied from an unofficial source and not tested. Read it as a draft and check a value on the real device before you rely on the rest.",
  },
};

/** The x_status of a map, with "unverified" (the older name of "official")
    read as "official", as Modbench does. Unknown values give null. */
export function mapStatus(status: unknown): Status | null {
  if (status === "unverified") return "official";
  return STATUSES.includes(status as Status) ? (status as Status) : null;
}

const WIDTH: Record<string, number> = {
  int16: 1,
  uint16: 1,
  int32: 2,
  uint32: 2,
  float32: 2,
  int64: 4,
  uint64: 4,
  float64: 4,
};

/** Registers a value takes, or null for bit types. */
export function registerCount(type: string, length?: number): number | null {
  if (type === "string") return length ?? null;
  return WIDTH[type] ?? null;
}

/** Byte/word order in the ABCD notation Modbench uses ("int32 CDAB"). */
export function orderTag(byteOrder: Order, wordOrder: Order): string {
  if (byteOrder === "big") return wordOrder === "big" ? "ABCD" : "CDAB";
  return wordOrder === "big" ? "BADC" : "DCBA";
}

/** An integer written as a JSON number or a decimal / 0x string (SPEC.md §2.1). */
export function parseInteger(v: unknown): number | null {
  if (typeof v === "number") return Number.isInteger(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s.slice(2), 16);
  return null;
}

/** The type column: "int32 CDAB", "bool bit 3", "uint16 bits 4–7", "string[8]". */
export function typeLabel(r: {
  type: string;
  length?: number;
  bit?: number;
  bits?: number;
  byteOrder: Order;
  wordOrder: Order;
}): string {
  if (r.type === "string") return `string[${r.length ?? "?"}]`;
  if (r.type === "bool") return r.bit != null ? `bool bit ${r.bit}` : "bool";
  if (r.bits != null && r.bit != null) {
    return r.bits === 1
      ? `${r.type} bit ${r.bit}`
      : `${r.type} bits ${r.bit}–${r.bit + r.bits - 1}`;
  }
  const width = WIDTH[r.type];
  if (width && width > 1) return `${r.type} ${orderTag(r.byteOrder, r.wordOrder)}`;
  if (width === 1 && r.byteOrder === "little") return `${r.type} BA`;
  return r.type;
}

/** The number of a register in Modicon notation (40001), when it has one. */
export function modicon(area: Area, wire: number): string | null {
  if (wire < 0 || wire > 65535) return null;
  const prefix = { coil: 0, discrete: 1, input: 3, holding: 4 }[area];
  const n = wire + 1;
  return n <= 9999 ? `${prefix}${String(n).padStart(4, "0")}` : `${prefix}${String(n).padStart(5, "0")}`;
}

export function hex(n: number): string {
  return "0x" + n.toString(16).toUpperCase().padStart(4, "0");
}

export const PROTOCOL_NAME: Record<string, string> = {
  tcp: "Modbus TCP",
  rtu: "Modbus RTU",
  "tcp+rtu": "Modbus TCP and RTU",
};

export const PARITY_NAME: Record<string, string> = { N: "None", E: "Even", O: "Odd" };

export function plural(n: number, one: string, many = one + "s"): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

/** Lower case, without accents, for matching what people type. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
