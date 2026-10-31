// Every device, small enough for the catalogue and the search menu to load
// on any page. Generated from the registry at build time.
import type { APIRoute } from "astro";
import { deviceEntry, registry } from "../../lib/registry.ts";
import { vendorIcons } from "../../lib/vendor-icons.ts";

export const GET: APIRoute = async () => {
  const icons = await vendorIcons();
  return new Response(JSON.stringify(registry().devices.map((d) => deviceEntry(d, icons))), {
    headers: { "Content-Type": "application/json" },
  });
};
