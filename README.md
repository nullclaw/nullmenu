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

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds everything on push to `main`:

- **apex** `nullmenu.ai` — deployed to *this* repo's GitHub Pages via
  `actions/deploy-pages`.
- **subdomains** — each `build/<site>` is force-pushed to the matching
  product repo's `gh-pages` branch (with `CNAME`) via
  `peaceiris/actions-gh-pages`, so docs live next to the code they document.

### One-time setup

1. **Create the repo** `nullclaw/nullmenu` and push this project to `main`.
2. **Token**: create a fine-grained PAT with `contents: write` on every
   product repo; save it as the `NULLMENU_DEPLOY_TOKEN` secret in this repo.
3. **This repo's Pages**: Settings → Pages → Source: *GitHub Actions*;
   Custom domain: `nullmenu.ai` (+ enforce HTTPS).
4. **Each product repo**: after the first deploy creates `gh-pages`,
   Settings → Pages → Source: *Deploy from a branch* → `gh-pages` / root.
   The CNAME file is already in the branch.
5. **DNS** (currently parked at 101domain — repoint it):

   | record | host | value |
   |--------|------|-------|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `nullclaw.github.io` |
   | CNAME | `claw` `hub` `boiler` `tickets` `watch` `pantry` `clw` `desk` `cap` `builder` | `nullclaw.github.io` |

   (GitHub Pages doesn't support wildcard domains — one CNAME per subdomain.)

## Retiring nullclaw.io and nullhub.io

GitHub Pages can't serve real 301s. Two options, best first:

1. **Keep the domains on a redirect host** (Cloudflare free plan: page rules /
   bulk redirects give true 301s): `nullclaw.io/*` → `claw.nullmenu.ai/$1`,
   `nullhub.io/*` → `hub.nullmenu.ai/$1`.
2. **Meta-refresh stubs on the existing Pages repos**:
   `node scripts/make-redirects.js redirects/nullclaw.io.json out/` generates
   an instant client-side redirect page per old path (with
   `<link rel="canonical">` to the new URL) — push that to the old repos.

Old→new path maps live in `redirects/*.json`; edit them if you moved pages.

## Honesty rules baked into the content

Pre-1.0 everywhere; CalVer; benchmark numbers attributed to the project;
no license claims for repos without a license file; `nullhub install` shown
only for the four components hub actually manages (claw, boiler, tickets,
watch). Keep it that way.
