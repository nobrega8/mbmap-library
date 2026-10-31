// Images in the library's assets/ folder (tool icons in COMPATIBILITY.md,
// the logo), served from the site so they always match the built commit.
import type { APIRoute, GetStaticPaths } from "astro";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { registry } from "../../lib/registry.ts";

const IMAGE = /\.(png|svg|jpe?g|gif|webp|ico)$/i;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : IMAGE.test(e.name) ? [join(dir, e.name)] : [],
  );
}

export const getStaticPaths = (() => {
  const root = registry().libraryDir;
  let found: string[] = [];
  try {
    found = files(join(root, "assets"));
  } catch {}
  return found.map((f) => ({ params: { path: relative(root, f).split("\\").join("/") }, props: { file: f } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(readFileSync(props.file as string)));
