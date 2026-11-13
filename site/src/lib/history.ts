// How many maps the library had of each status over time, read from the git
// history of index.json at build time. One point per day (the last index of
// that day). Days before the index recorded a status are left out. Returns an
// empty list when the history cannot be read (a shallow clone, no git).

import { execFileSync } from "node:child_process";
import { registry } from "./registry.ts";
import type { Status } from "./mbmap.ts";

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  counts: Record<Status, number>;
}

// Statuses the index used before the current names.
const RENAMED: Record<string, Status> = { unverified: "official" };

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 256 << 20 });
}

let cache: HistoryPoint[] | undefined;

export function statusHistory(): HistoryPoint[] {
  if (cache) return cache;
  const points: HistoryPoint[] = [];
  try {
    const dir = registry().libraryDir;
    const log = git(dir, "log", "--format=%H %cs", "--", "index.json").trim().split("\n");
    const lastOfDay = new Map<string, string>();
    for (const line of log) {
      const [hash, date] = line.split(" ");
      if (hash && date && !lastOfDay.has(date)) lastOfDay.set(date, hash); // log is newest first
    }
    for (const [date, hash] of [...lastOfDay].sort(([a], [b]) => a.localeCompare(b))) {
      const index = JSON.parse(git(dir, "show", `${hash}:index.json`));
      const counts: Record<Status, number> = { verified: 0, official: 0, unofficial: 0 };
      let seen = false;
      for (const m of index.maps ?? []) {
        const s = (RENAMED[m.status] ?? m.status) as Status;
        if (s in counts) {
          counts[s]++;
          seen = true;
        }
      }
      if (seen) points.push({ date, counts });
    }
  } catch {
    return (cache = []);
  }
  return (cache = points);
}
