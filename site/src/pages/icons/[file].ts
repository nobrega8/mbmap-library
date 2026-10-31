// Manufacturer icons, fetched at build time (lib/vendor-icons.ts)
import type { APIRoute, GetStaticPaths } from "astro";
import { vendorIcons } from "../../lib/vendor-icons.ts";

export const getStaticPaths = (async () => {
  const files = new Map<string, Uint8Array>();
  for (const icon of (await vendorIcons()).values()) files.set(icon.file, icon.bytes);
  return [...files].map(([file, bytes]) => ({ params: { file }, props: { bytes } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => new Response(props.bytes as Uint8Array<ArrayBuffer>);
