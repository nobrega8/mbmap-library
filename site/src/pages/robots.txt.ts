import { href } from "../lib/base.ts";
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: ${href("/search/")}\n\nSitemap: ${new URL(href("/sitemap.xml"), site).href}\n`, {
    headers: { "Content-Type": "text/plain" },
  });
