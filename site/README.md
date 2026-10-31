# Registry website

The public catalogue of the maps in this repository, published on GitHub Pages
by [`.github/workflows/site.yml`](../.github/workflows/site.yml) on every push to
`main`. It is a static [Astro](https://astro.build) site with no backend: every
page, count and search index is built from the files in this repository
(`index.json`, `maps/`, `SPEC.md`, `COMPATIBILITY.md`) at build time, so the
site always matches `main`.

Its look is Modbench's: `src/styles/modbench.css` is copied from
`modbench/src/app.css`; update both together.

```sh
cd site
npm ci
npm run dev      # http://localhost:4321/mbmap-library/
npm run build    # dist/
npm run check    # type check
```

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `SITE_ORIGIN` | `https://nobrega8.github.io` | Origin for canonical URLs and the sitemap (set by the workflow) |
| `BASE_PATH` | `/mbmap-library` | Path the site is served under; `""` at the root of a domain (set by the workflow) |
| `MBMAP_LIBRARY_DIR` | the folder above `site/` | A checkout of the library to read instead |
| `MBMAP_LIBRARY_REPO`, `MBMAP_LIBRARY_REF` | GitHub, `main` | Clone the library into `.cache/` instead of reading this checkout |
| `MBMAP_ICONS` | on | `0` skips fetching manufacturer icons (offline builds) |

Manufacturer icons are fetched at build time from each map's `vendor_website`, as
Modbench does, cached in `.cache/vendor-icons/` and served from the site.
