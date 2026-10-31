// @ts-check
import { defineConfig } from "astro/config";

// Where the site is published. The GitHub Pages workflow passes both from
// actions/configure-pages, so a custom domain needs no change here:
//   SITE_ORIGIN  https://nobrega8.github.io (or the custom domain)
//   BASE_PATH    /mbmap-library (or "" at the root of a domain)
const site = process.env.SITE_ORIGIN || "https://nobrega8.github.io";
const base = process.env.BASE_PATH ?? "/mbmap-library";

export default defineConfig({
  site,
  base: base || "/",
  // Pages are folders (/devices/abb/acs580/index.html) so GitHub Pages
  // serves every URL without a redirect.
  trailingSlash: "always",
  build: { format: "directory" },
  compressHTML: true,
});
