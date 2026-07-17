---
title: Contributing
description: Toolchain, test culture, shared CI, and how releases work across the repos.
order: 3
verified: v2026.5.29
---

All development happens in the open at [github.com/nullclaw](https://github.com/nullclaw). The repos share one toolchain, one CI system and one release convention, so contributing to a second component feels like the first.

## Toolchain

One version, everywhere:

| Requirement | Value |
| --- | --- |
| Zig | **0.16.0 exactly** — every repo pins it |
| Node/npm | Only for NullHub's embedded Svelte UI |
| Anything else | No — SQLite and C deps are vendored |

The standard loop is the same in every repo:

```bash
git clone https://github.com/nullclaw/<repo>.git
cd <repo>
zig build
zig build test
```

NullClaw uses `zig build test --summary all`; NullTickets adds `bash tests/test_e2e.sh`; NullPantry has suite targets (`zig build test-api`, `test-agent-memory`, `test-vector`) plus opt-in contract tests against external backends (`zig build qdrant-contract` and friends).

## Test culture

Tests are the family's main quality gate, and the numbers are taken seriously: NullClaw carries 7,400+ in-tree tests, NullBoiler 355 unit tests plus an e2e suite with mock workers, nllclw ~330 test blocks (more with the shell tool compiled in), and NullHub runs backend integration tests against a real hub process in a temporary home directory. A PR without tests for its change will be asked for them.

## Shared CI: NullBuilder

CI, nightlies and releases are reusable GitHub Actions workflows in [nullclaw/nullbuilder](https://github.com/nullclaw/nullbuilder), referenced at the `v1` branch. A consuming repo's CI is a few lines:

```yaml
jobs:
  ci:
    uses: nullclaw/nullbuilder/.github/workflows/zig-ci.yml@v1
    permissions:
      contents: read
    with:
      binary_name: nullclaw
      artifact_prefix: nullclaw
```

The CI workflow runs tests, cross-compiles `ReleaseSmall` binaries for a configurable target matrix, and reports test count, MaxRSS and binary size in the job summary — binary size is a tracked metric here, not an afterthought. `zig-nightly.yml` and `zig-release.yml` cover nightly builds (12-target default matrix, including Android via the NDK) and tag-driven releases with optional multi-arch Docker publish to ghcr.io. All third-party actions are pinned to commit SHAs.

## Releases

Versions are CalVer: pushing a `v2026.x.y` tag triggers the release workflow, which injects the version, builds the matrix, and publishes binaries with generated notes. Most repos carry a `RELEASING.md` with their specifics — NullClaw, NullHub, NullBoiler, NullTickets and NullWatch all do.

## Where to contribute

- **Code and issues.** NullClaw ships a `CONTRIBUTING.md`; NullHub has `TESTING.md` describing its testing strategy and roadmap, plus multiple external contributors already. `AGENTS.md` / `CLAUDE.md` files in most repos carry conventions for coding agents — read them, whichever kind of contributor you are.
- **Docs.** NullClaw maintains English and Chinese docs; nllclw is localized into 11 languages. Translation fixes are welcome, low-risk first PRs.
- **Integrations.** Bridges, SDKs and adapters (like the community `nullwatch-python-sdk`) can live outside the org entirely — see [Integrations](/docs/develop/integrations/).

> [!WARNING]
> Check the license before contributing substantial code: NullClaw, NullHub, NullBoiler, NullTickets and nllclw are MIT, but NullPantry, NullWatch, NullDesk, NullCap and NullBuilder currently have **no license file**, which leaves contributions to them in an unclear legal position. If that blocks you, an issue asking for a license is itself a useful contribution.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases — including because of your PR. Breaking changes are allowed; silent ones are not. Note them in the changelog.
