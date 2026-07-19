---
title: Overview
description: What NullBuilder is, who it serves, and how to wire it into a Zig repo.
order: 1
---

NullBuilder is a repository of reusable GitHub Actions workflows shared by every Null-family Zig project. It is maintainer infrastructure, not something you install or run.

## Who this is for

If you maintain a Zig repository in the [nullclaw org](https://github.com/nullclaw) — or a Zig project of your own with the same shape — NullBuilder gives you drop-in CI, nightly builds, and tag-driven releases from a single `uses:` line. Consumers include [NullClaw](https://claw.nullmenu.ai/) (an AI agent runtime), [NullHub](https://hub.nullmenu.ai/) (a local agent-stack console), [NullTickets](https://tickets.nullmenu.ai/) (a task tracker for AI agents) and [NullBoiler](https://boiler.nullmenu.ai/) (an agent workflow engine).

If you just want to *use* those tools, you never touch NullBuilder. Its output is the release binaries you download.

## Three workflows

| Workflow | Trigger (in your repo) | What it does |
| --- | --- | --- |
| `zig-ci.yml` | push / pull request | Runs tests, cross-compiles ReleaseSmall binaries on a 3-target default matrix, uploads artifacts |
| `zig-nightly.yml` | schedule or manual dispatch | Builds a 12-target matrix, skips already-built commits, optionally publishes a rolling prerelease |
| `zig-release.yml` | `v*` tag push | Builds the 12-target matrix, injects the version from the tag, publishes a GitHub release; optional source archive and Docker image |

Every workflow builds with `-Doptimize=ReleaseSmall` and installs Zig **0.16.0** by default. CI writes a job summary with tests passed, test MaxRSS, and the resulting binary size.

## Wire it in

In a caller repo's workflow file:

```yaml
jobs:
  ci:
    # NullBuilder v1 snapshot; review upstream before updating this full SHA.
    uses: nullclaw/nullbuilder/.github/workflows/zig-ci.yml@2b9c2f2e7bb0ac085baea1c33b4f08beaf5c7fac
    permissions:
      contents: read
    with:
      binary_name: nullclaw
      artifact_prefix: nullclaw
```

`binary_name` is the only required input — the binary your `zig build` produces under `zig-out/bin`. Everything else has a working default. The full input tables live in [Workflows](/docs/reference/workflows/), and the target matrices in [Targets](/docs/reference/targets/).

The release workflow needs explicit write permissions but no caller repository secrets:

```yaml
jobs:
  release:
    # NullBuilder v1 snapshot; review upstream before updating this full SHA.
    uses: nullclaw/nullbuilder/.github/workflows/zig-release.yml@2b9c2f2e7bb0ac085baea1c33b4f08beaf5c7fac
    permissions:
      contents: write
      packages: write # needed only because publish_docker is true
    with:
      binary_name: nullclaw
      artifact_prefix: nullclaw
      publish_docker: true
```

## Versioning

NullBuilder has no tags and no GitHub releases. The `v1` branch is mutable, so the examples above pin its reviewed snapshot, commit `2b9c2f2e7bb0ac085baea1c33b4f08beaf5c7fac`. Review upstream changes before replacing that SHA. The caller passes no repository secrets: the workflow uses GitHub's scoped token and the explicit job permissions shown above.

The pinned caller reference prevents the selected reusable workflow file from moving. At this snapshot, NullBuilder's workflows still reference their own composite helpers through the mutable `v1` branch. The reviewed `setup-zig` helper uses NullBuilder's bundled checksum-verifying installer, but that helper — along with `nightly-decide` and `package-artifact` — must be pinned internally before the chain is fully immutable.

> [!NOTE]
> Pre-1.0: workflow inputs and defaults may change upstream. Keep the full SHA until you have reviewed the next revision and its internal action references.

## Status

Created May 2026 and in real use across the nullclaw org's repositories. There is no license file yet, and the only documentation upstream is the README plus the self-documenting input descriptions in the workflow files themselves. The repo tests its own helpers: the nightly-dedupe and artifact-packaging logic is written in Zig and unit-tested with `zig test` in NullBuilder's own CI.
