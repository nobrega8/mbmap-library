// The map of each device in other formats (CSV, Home Assistant), built from
// the same data as its page.
import type { APIRoute, GetStaticPaths } from "astro";
import { registry } from "../../lib/registry.ts";
import { EXPORTS, exportPath } from "../../lib/exports.ts";

export const getStaticPaths = (() =>
  registry().devices.flatMap((d) =>
    EXPORTS.map((f) => ({
      params: { path: exportPath(d.path, f.ext).slice("exports/".length) },
      props: { path: d.path, ext: f.ext },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const d = registry().devices.find((x) => x.path === props.path)!;
  const f = EXPORTS.find((x) => x.ext === props.ext)!;
  const pageUrl = new URL(d.url, site).href;
  return new Response(f.build(d.info, pageUrl), { headers: { "Content-Type": f.mime } });
};
