// The registry, read once per build from the mbmap-library repository on
// GitHub. index.json says which maps exist; each map file is read for its
// details. Nothing is stored anywhere else: every number on the site is
// counted here.
//
// Where the library comes from:
//   MBMAP_LIBRARY_DIR   a checkout to read (default: this repository, the
//                       folder above site/, when it holds index.json)
//   otherwise           a clone of MBMAP_LIBRARY_REPO at MBMAP_LIBRARY_REF
//                       (default: nobrega8/mbmap-library, main) in .cache/

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { type MapInfo, type Register, parseMap } from "./normalize.ts";
import { type Area, type Status, AREAS, STATUSES, fold, mapStatus } from "./mbmap.ts";
import type { DeviceEntry } from "../scripts/search-core.ts";
import { href } from "./base.ts";

export const REPO = "nobrega8/mbmap-library";
export const REPO_URL = `https://github.com/${REPO}`;
export const BRANCH = process.env.MBMAP_LIBRARY_REF || "main";
export const blobUrl = (path: string) => `${REPO_URL}/blob/${BRANCH}/${path}`;
export const rawUrl = (path: string) =>
  `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`;

export interface Device {
  /** maps/<vendorSlug>/<modelSlug>.mbmap.json */
  path: string;
  vendorSlug: string;
  modelSlug: string;
  /** /devices/<vendorSlug>/<modelSlug> */
  url: string;
  sha256: string;
  size: number;
  /** When the file was first added to the library (ISO 8601, UTC), from git */
  added: string | null;
  info: MapInfo;
  status: Status | null;
  registerCount: number;
  areaCounts: Partial<Record<Area, number>>;
  groups: string[];
}

export interface Manufacturer {
  name: string;
  slug: string;
  url: string;
  website?: string;
  devices: Device[];
  statusCounts: Record<Status, number>;
  registerCount: number;
}

export interface Registry {
  devices: Device[];
  manufacturers: Manufacturer[];
  statusCounts: Record<Status, number>;
  registerCount: number;
  /** Commit the site was built from */
  commit: string | null;
  commitDate: string | null;
  /** Problems found while reading, printed in the build log */
  warnings: string[];
  libraryDir: string;
}

const SLUG = /^[a-z0-9][a-z0-9._-]*$/;
const MAP_PATH = /^maps\/([^/]+)\/([^/]+)\.mbmap\.json$/;

const here = dirname(fileURLToPath(import.meta.url));
// src/lib → site/ (in dev) or dist/.prerender chunks (in the build): walk up
// to the folder that holds package.json.
export function siteRoot(): string {
  let dir = here;
  while (!existsSync(join(dir, "astro.config.mjs")) && dirname(dir) !== dir) dir = dirname(dir);
  return existsSync(join(dir, "astro.config.mjs")) ? dir : process.cwd();
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 << 20 });
}

function locateLibrary(): string {
  const fromEnv = process.env.MBMAP_LIBRARY_DIR;
  if (fromEnv) return resolve(fromEnv);
  const root = siteRoot();
  const parent = resolve(root, "..");
  if (!process.env.MBMAP_LIBRARY_REPO && existsSync(join(parent, "index.json")) && existsSync(join(parent, "maps"))) {
    return parent;
  }
  // Built on its own: clone the library. Trees only up front; git fetches the
  // blobs of the checked-out files, and the history stays available for the
  // dates the maps were added.
  const repo = process.env.MBMAP_LIBRARY_REPO || `${REPO_URL}.git`;
  const dir = join(root, ".cache", "mbmap-library");
  if (existsSync(join(dir, ".git"))) {
    git(dir, "fetch", "--quiet", "--filter=blob:none", "origin", BRANCH);
    git(dir, "checkout", "--quiet", "--force", "FETCH_HEAD");
  } else {
    execFileSync("git", ["clone", "--quiet", "--filter=blob:none", "--branch", BRANCH, repo, dir], { stdio: "inherit" });
  }
  return dir;
}

/** First date each map path appears in the history, for "recently added". */
function addedDates(dir: string, warnings: string[]): Map<string, string> {
  const dates = new Map<string, string>();
  try {
    if (git(dir, "rev-parse", "--is-shallow-repository").trim() === "true") {
      // CI checkouts are often shallow; without the history there are no dates
      try {
        git(dir, "fetch", "--quiet", "--unshallow", "--filter=blob:none");
      } catch {
        warnings.push("git history is shallow and could not be deepened: no dates for recently added maps");
        return dates;
      }
    }
    const log = git(dir, "log", "--no-renames", "--diff-filter=A", "--name-only", "--format=@%cI", "--", "maps");
    let date = "";
    for (const line of log.split("\n")) {
      // In UTC, so the timestamps sort as strings
      if (line.startsWith("@")) date = new Date(line.slice(1)).toISOString();
      // newest first, so the last date seen for a path is its first addition
      else if (line.endsWith(".mbmap.json")) dates.set(line, date);
    }
  } catch {
    warnings.push("git history not available: no dates for recently added maps");
  }
  return dates;
}

function commitInfo(dir: string): [string | null, string | null] {
  try {
    const [hash, date] = git(dir, "log", "-1", "--format=%H %cI").trim().split(" ");
    return [hash ?? null, date?.slice(0, 10) ?? null];
  } catch {
    return [null, null];
  }
}

interface IndexEntry {
  path: string;
  sha256?: string;
  vendor: string;
  model: string;
}

/** The entries of index.json that can be used; the rest become warnings. */
function readIndex(dir: string, warnings: string[]): IndexEntry[] {
  const file = join(dir, "index.json");
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`index.json could not be read from ${file}: ${(e as Error).message}`);
  }
  const maps = (doc as { maps?: unknown })?.maps;
  if (!Array.isArray(maps)) throw new Error("index.json has no maps array");

  const seen = new Set<string>();
  return maps.flatMap((e, i): IndexEntry[] => {
    const path = (e as IndexEntry)?.path;
    const m = typeof path === "string" ? MAP_PATH.exec(path) : null;
    if (!m || !SLUG.test(m[1]!) || !SLUG.test(m[2]!) || path.includes("..")) {
      warnings.push(`index.json maps[${i}]: unusable path ${JSON.stringify(path)}`);
      return [];
    }
    if (seen.has(path)) {
      warnings.push(`index.json maps[${i}]: ${path} is listed twice`);
      return [];
    }
    seen.add(path);
    return [e as IndexEntry];
  });
}

function emptyCounts(): Record<Status, number> {
  return { verified: 0, official: 0, unofficial: 0 };
}

function load(): Registry {
  const warnings: string[] = [];
  const dir = locateLibrary();
  const dates = addedDates(dir, warnings);
  const [commit, commitDate] = commitInfo(dir);
  const devices: Device[] = [];

  for (const entry of readIndex(dir, warnings)) {
    const file = resolve(dir, entry.path);
    if (!file.startsWith(resolve(dir, "maps") + sep)) continue;
    let bytes: Buffer;
    try {
      bytes = readFileSync(file);
    } catch {
      warnings.push(`${entry.path}: listed in index.json but the file is missing`);
      continue;
    }
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    if (entry.sha256 && entry.sha256 !== sha256) {
      warnings.push(`${entry.path}: sha256 differs from index.json (index not rebuilt?)`);
    }
    let info: MapInfo;
    try {
      info = parseMap(bytes.toString("utf8"));
    } catch (e) {
      warnings.push(`${entry.path}: left out, ${(e as Error).message}`);
      continue;
    }
    if (info.skipped) warnings.push(`${entry.path}: ${info.skipped} register(s) could not be read`);

    const [, vendorSlug, modelSlug] = MAP_PATH.exec(entry.path)!;
    const areaCounts: Partial<Record<Area, number>> = {};
    const groups = new Set<string>();
    for (const r of info.registers) {
      areaCounts[r.area] = (areaCounts[r.area] ?? 0) + 1;
      if (r.group) groups.add(r.group);
    }
    devices.push({
      path: entry.path,
      vendorSlug: vendorSlug!,
      modelSlug: modelSlug!,
      url: href(`/devices/${vendorSlug}/${modelSlug}`),
      sha256,
      size: bytes.length,
      added: dates.get(entry.path) ?? null,
      info,
      status: info.status ?? mapStatus((entry as { status?: unknown }).status),
      registerCount: info.registers.length,
      areaCounts,
      groups: [...groups],
    });
  }

  if (!devices.length) throw new Error("no maps could be read: refusing to build an empty registry");

  const byName = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
  devices.sort((a, b) => byName(a.info.vendor, b.info.vendor) || byName(a.info.model, b.info.model));

  const vendors = new Map<string, Manufacturer>();
  const statusCounts = emptyCounts();
  let registerCount = 0;
  for (const d of devices) {
    let v = vendors.get(d.vendorSlug);
    if (!v) {
      v = {
        name: d.info.vendor,
        slug: d.vendorSlug,
        url: href(`/manufacturers/${d.vendorSlug}`),
        website: d.info.vendorWebsite,
        devices: [],
        statusCounts: emptyCounts(),
        registerCount: 0,
      };
      vendors.set(d.vendorSlug, v);
    }
    v.devices.push(d);
    v.registerCount += d.registerCount;
    v.website ??= d.info.vendorWebsite;
    if (d.status) {
      v.statusCounts[d.status]++;
      statusCounts[d.status]++;
    }
    registerCount += d.registerCount;
  }

  return {
    devices,
    manufacturers: [...vendors.values()],
    statusCounts,
    registerCount,
    commit,
    commitDate,
    warnings,
    libraryDir: dir,
  };
}

let cached: Registry | null = null;

/** The registry, read on first use and kept for the rest of the build. */
export function registry(): Registry {
  if (!cached) {
    cached = load();
    const { devices, manufacturers, warnings, libraryDir } = cached;
    console.log(`[mbmap] ${devices.length} maps, ${manufacturers.length} manufacturers from ${libraryDir}`);
    for (const w of warnings) console.warn(`[mbmap] ${w}`);
  }
  return cached;
}

export function mapFile(d: Device): Buffer {
  return readFileSync(join(registry().libraryDir, d.path));
}

export function libraryFile(name: string): string | null {
  try {
    return readFileSync(join(registry().libraryDir, name), "utf8");
  } catch {
    return null;
  }
}

export function findDevice(vendorSlug: string, modelSlug: string): Device | undefined {
  return registry().devices.find((d) => d.vendorSlug === vendorSlug && d.modelSlug === modelSlug);
}

/** Status counts in a fixed order, for the status bar and legends. */
export function statusList(counts: Record<Status, number>): [Status, number][] {
  return STATUSES.map((s) => [s, counts[s]]);
}

/** Text that search matches for a device (registers are searched separately). */
export function deviceSearchText(d: Device): string {
  return fold([d.info.vendor, d.info.model, ...d.info.models, d.info.description ?? ""].join(" "));
}

export { AREAS, type Register };

/** The device as listed in /search/devices.json. */
export function deviceEntry(d: Device, icons?: Map<string, { file: string }>): DeviceEntry {
  const e: DeviceEntry = {
    u: d.url,
    v: d.info.vendor,
    vs: d.vendorSlug,
    m: d.info.model,
    s: d.status,
    r: d.registerCount,
  };
  const other = otherModels(d);
  if (other.length) e.ms = other;
  if (d.info.description) e.d = d.info.description;
  // Only what the map states: a missing protocol is a default, not a fact
  if (d.info.stated.includes("protocol")) e.p = d.info.protocol;
  if (d.added) e.a = d.added;
  const icon = icons?.get(d.vendorSlug);
  if (icon) e.i = href(`/icons/${icon.file}`);
  return e;
}

/** Model names the map covers that its display name does not already show
    ("A41 / A42" already shows A41 and A42). */
export function otherModels(d: Device): string[] {
  const shown = fold(d.info.model);
  return d.info.models.filter((m) => !shown.includes(fold(m)));
}
