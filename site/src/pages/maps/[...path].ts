// The map files, copied byte for byte so a download is the file in the
// repository, and index.json is served next to them for tools.
import type { APIRoute, GetStaticPaths } from "astro";
import { mapFile, registry } from "../../lib/registry.ts";

export const getStaticPaths = (() =>
  registry().devices.map((d) => ({
    params: { path: d.path.slice("maps/".length) },
    props: { path: d.path },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
  const d = registry().devices.find((x) => x.path === props.path)!;
  return new Response(new Uint8Array(mapFile(d)), { headers: { "Content-Type": "application/json" } });
};
