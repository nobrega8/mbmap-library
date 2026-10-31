// Register names and descriptions of every map, one string per device in the
// order of devices.json, lines separated by "\n". Loaded only when someone
// searches, as it is far larger than the device list.
import type { APIRoute } from "astro";
import { registry } from "../../lib/registry.ts";

export const GET: APIRoute = () => {
  const lines = registry().devices.map((d) => {
    const seen = new Set<string>();
    for (const r of d.info.registers) seen.add(r.name);
    for (const r of d.info.registers) if (r.description && !seen.has(r.description)) seen.add(r.description);
    return [...seen].join("\n");
  });
  return new Response(JSON.stringify(lines), { headers: { "Content-Type": "application/json" } });
};
