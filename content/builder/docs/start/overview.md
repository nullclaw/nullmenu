---
title: Overview
description: What NullBuilder is, who it serves, and how to wire it into a Zig repo.
order: 1
---

NullBuilder is a repository of reusable GitHub Actions workflows shared by every Null-family Zig project. It is maintainer infrastructure — the mise en place of the kitchen — not something you install or run.

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
    uses: nullclaw/nullbuilder/.github/workflows/zig-ci.yml@v1
    permissions:
      contents: read
    with:
      binary_name: nullclaw
      artifact_prefix: nullclaw
```

`binary_name` is the only required input — the binary your `zig build` produces under `zig-out/bin`. Everything else has a working default. The full input tables live in [Workflows](/docs/reference/workflows/), and the target matrices in [Targets](/docs/reference/targets/).

The release workflow needs write permissions and inherited secrets:

```yaml
jobs:
  release:
    uses: nullclaw/nullbuilder/.github/workflows/zig-release.yml@v1
    permissions:
      contents: write
      packages: write
    secrets: inherit
    with:
      binary_name: nullclaw
      artifact_prefix: nullclaw
      publish_docker: true
```

## Versioning

NullBuilder has no tags and no GitHub releases. Callers pin to the `v1` **branch** — that is what `@v1` in the `uses:` line resolves to. Inside the workflows the story is stricter: every third-party action is pinned to a full commit SHA, and Dependabot keeps those pins current.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. For NullBuilder specifically that means workflow inputs and defaults may change on the `v1` branch without a tagged release.

## Status

Created May 2026 and in real use across the nullclaw org's repositories. There is no license file yet, and the only documentation upstream is the README plus the self-documenting input descriptions in the workflow files themselves. The repo tests its own helpers: the nightly-dedupe and artifact-packaging logic is written in Zig and unit-tested with `zig test` in NullBuilder's own CI.
