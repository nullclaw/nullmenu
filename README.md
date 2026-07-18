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

Three theme modes — system, light and dark — derive from each product's accent
via `color-mix`. The preference is persisted across the product subdomains.
The hero runs a WebGPU Navier–Stokes ink simulation (canvas fallback), and
product pages bake platform-aware binary downloads from GitHub Releases.

## Add a product

1. Add an entry to `src/lib/site/sites.js` (accent, course, docsSections, …).
2. Drop `content/<id>/product.json` + `content/<id>/docs/<section>/<slug>.md`.
3. Configure DNS and GitHub Pages for the repository named by the registry entry.

The build list and deployment targets are derived from the registry; there is
no second matrix to keep in sync. `pnpm check:content` and `pnpm check:infra`
fail if content, domains or repositories drift.

## Deploy

Push to `main` — `.github/workflows/deploy.yml` builds every site, deploys
the ten product builds to staged refs, promotes their `gh-pages` branches with
lease protection, then deploys the apex last. Promotion or apex failures roll
the product refs back without overwriting a ref changed by another publisher.
Subdomain pushes require `NULLMENU_DEPLOY_TOKEN` with `contents: write` on the
product repositories.

`nullclaw.io` and `nullhub.io` cannot return real cross-domain 308 responses
from GitHub Pages. `pnpm build:redirects` therefore produces Cloudflare Pages
workers and equivalent Vercel rules. To activate the workflow deploys:

1. Create Cloudflare Pages projects named `nullclaw-io-redirect` and
   `nullhub-io-redirect`.
2. Add repository secrets `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`; the token needs Pages edit access.
3. Bind `nullclaw.io` and `nullhub.io` (including the desired `www` aliases)
   to those projects and remove their GitHub Pages custom-domain bindings.
4. Verify with `curl -I` that representative legacy paths return `308` and the
   expected `Location` header.

Without both secrets the legacy job intentionally reports that it is inactive;
the generated bundles are still validated in CI.

## Release trust

Download recommendations are pinned to the tags and SHA-256 values in
`src/lib/content/release-digests.json`. When intentionally updating a product
version, update the site registry and regenerate the manifest from the published
assets:

```bash
node scripts/update-release-digests.js --generate
pnpm test:release
pnpm test:release:network
```

The weekly workflow streams and re-hashes all pinned assets; it does not adopt a
new tag automatically.

## License

MIT — see [LICENSE](LICENSE). Bundled fonts are OFL-licensed
([attribution](static/fonts/LICENSE.md)).
