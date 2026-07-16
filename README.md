# nullmenu — the Null ecosystem sites

One SvelteKit codebase that builds **eleven static sites**: the apex
[nullmenu.ai](https://nullmenu.ai) plus a subdomain per product
(`claw.nullmenu.ai`, `hub.nullmenu.ai`, …). Svelte 5, static adapter,
fully prerendered — no server anywhere.

```
src/lib/site/sites.js     ← the registry: theme, copy, docs sections per site
src/lib/home/             ← MenuHome (apex) + ProductHome (template)
content/<site>/docs/      ← markdown docs (section/slug.md with frontmatter)
content/<site>/product.json ← product-page data (hero, metrics, install, features)
build/<site>/             ← one deployable static site per id
```

## Develop

```bash
pnpm install
pnpm dev              # apex (menu) on :5173
pnpm dev:claw         # claw on :5174 — or: PUBLIC_SITE=<id> vite dev
```

## Build

```bash
node scripts/build-all.js          # all sites → build/<id>
node scripts/build-all.js claw hub # just some
```

Every site ships `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt`,
and a Markdown twin for every docs page (`/docs/x/y/` ⇄ `/docs/x/y.md`).

## Add a product

1. Add an entry to `src/lib/site/sites.js` (accent, course, docsSections, …).
2. Drop `content/<id>/product.json` + `content/<id>/docs/<section>/<slug>.md`.
3. Add the site to the deploy matrix in `.github/workflows/deploy.yml`.
4. DNS + Pages setup for the new subdomain (below).

## Deploy

Push to `main` — `.github/workflows/deploy.yml` builds every site, deploys
the apex to this repo's GitHub Pages and each `build/<site>` to the matching
product repo's `gh-pages` branch, so docs live next to the code they document.
