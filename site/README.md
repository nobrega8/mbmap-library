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
| `PUBLIC_GTM_ID` | `GTM-KC33D3LQ` | Google Tag Manager container; `""` removes analytics and the cookie banner. Loads only after the visitor accepts |
| `MBMAP_ICONS` | on | `0` skips fetching manufacturer icons (offline builds) |

Manufacturer icons are fetched at build time from each map's `vendor_website`, as
Modbench does, cached in `.cache/vendor-icons/` and served from the site.

## Languages

English lives at the root of the site and every other language under its own
prefix (`/pt/`). The languages are listed in `src/i18n/locales.ts` and in
`astro.config.mjs`.

- **Interface text** is in `src/i18n/en.ts` (the source of every string) and one
  file per language (`src/i18n/pt.ts`, `src/i18n/zh.ts`). A key missing from a language shows the
  English text. Strings may hold `{name}` placeholders; nouns that are counted
  have a `.one` and a `.many` key.
- **Pages** are written once, in `src/views/`, and rendered by thin routes in
  `src/pages/` (English) and `src/pages/<locale>/`. A view reads its language
  from `Astro.currentLocale`; browser scripts read it from `<html data-locale>`
  (`src/scripts/i18n.ts`).
- **Guides** are `docs/guides/<slug>.md` in English; a translation goes in
  `docs/guides/<locale>/<slug>.md` and the site falls back to English for any
  guide without one. The figures inside the guides (`src/scripts/guide-widgets.ts`)
  take their text from `src/scripts/guide-widgets-<locale>.ts` (a language without one shows English).
- **Long prose pages** (About, Contribute, Specification, Compatibility, Terms,
  Privacy): a language that has them is listed in `PROSE_LOCALES`
  (`src/i18n/locales.ts`). The text of About, Contribute, Terms and Privacy sits in
  the page's view next to the English; the Specification and Compatibility pages
  render `docs/<locale>/SPEC.md` and `docs/<locale>/COMPATIBILITY.md`. Under a
  language without them the pages show a note and are left out of search engines
  and the sitemap.
- Register names, descriptions and notes in the maps are data and stay as the
  map's author wrote them.

To add a language: add it to `LOCALES`, `LOCALE_NAME`, `LOCALE_TAG` and
`OG_LOCALE` in `src/i18n/locales.ts` and to `astro.config.mjs`, create
`src/i18n/<locale>.ts` and register it in `src/i18n/index.ts`, and add the
`src/pages/<locale>/` routes (copy `src/pages/pt/`).
