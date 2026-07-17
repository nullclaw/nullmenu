---
title: Workflows
description: Inputs, permissions and behavior of the three reusable workflows.
order: 1
---

All configuration happens through `with:` inputs on the three `workflow_call` workflows. There are no config files, and the only environment contract for callers is `BUILD_VERSION`, exported to pre-build and source-prepare hooks. `binary_name` is required everywhere; every other input has a default.

## zig-ci.yml

Runs tests, then a ReleaseSmall cross-build per matrix target. Requires `permissions: contents: read`.

| Input | Default | Notes |
| --- | --- | --- |
| `binary_name` | — (required) | Binary produced under `zig-out/bin` |
| `artifact_prefix` | `""` | Prefix for uploaded artifacts; falls back to `binary_name` |
| `zig_version` | `"0.16.0"` | Zig version to install |
| `targets_json` | 3 targets | JSON matrix; see [Targets](/docs/reference/targets/) |
| `node_version` | `""` | Optional Node.js to install before custom commands |
| `node_cache_dependency_path` | `""` | Enables npm caching in setup-node |
| `setup_command` | `""` | Runs after tool setup, before tests |
| `pre_test_command` | `""` | Runs immediately before tests |
| `test_command` | `"zig build test --summary all"` | The test invocation |
| `pre_build_command` | `""` | Runs immediately before the ReleaseSmall build |
| `build_args` | `""` | Extra arguments appended to `zig build` |
| `e2e_command` | `""` | Runs after the build, on one matrix target only |
| `e2e_target` | `"linux-x86_64"` | Matrix `target` name that runs `e2e_command` |
| `upload_artifacts` | `true` | Upload host binaries as CI artifacts |

Hook order within each matrix job: `setup_command` → `pre_test_command` → tests → `pre_build_command` → build → `e2e_command` (matching target only). Each hook command reaches `bash -euo pipefail` through an environment variable, so its text is never templated into the workflow YAML. The build cache covers `.zig-cache` and `~/.cache/zig`, keyed on your Zig sources, `build.zig`, `build.zig.zon` and `vendor/`.

Every job appends a summary table: tests passed, test MaxRSS, and ReleaseSmall binary size in MB and bytes.

## zig-nightly.yml

Builds the full 12-target matrix on a schedule. Requires `permissions: actions: read` and `contents: read` (plus `contents: write` in the caller if `publish_release` is on).

| Input | Default | Notes |
| --- | --- | --- |
| `binary_name` | — (required) | Binary produced under `zig-out/bin` |
| `artifact_prefix` | `""` | Falls back to `binary_name` |
| `zig_version` | `"0.16.0"` | |
| `android_api_level` | `"24"` | For Android targets |
| `android_ndk_version` | `"29.0.14206865"` | For Android targets |
| `targets_json` | 12 targets | See [Targets](/docs/reference/targets/) |
| `node_version` / `node_cache_dependency_path` | `""` | As in CI |
| `pre_build_command` | `""` | `BUILD_VERSION` is available in its environment |
| `build_args` | `""` | Extra `zig build` arguments |
| `retention_days` | `14` | Artifact retention |
| `force` | `false` | Build even if this commit already has a successful nightly |
| `dedupe_workflow_name` | `"Nightly"` | Caller workflow name used for the dedupe check |
| `publish_release` | `false` | Maintain a rolling GitHub prerelease |
| `release_tag` | `"nightly"` | Tag of the rolling prerelease |
| `release_title` | `"Nightly"` | Title prefix of the rolling prerelease |

A preflight job fetches the repository's workflow runs from the GitHub API and hands them to a small Zig program that looks for a previous successful run of the same workflow (scheduled or manually dispatched) on the same commit; on a match the build is skipped unless `force` is set. Nightly versions look like `nightly-YYYYMMDD-<short-sha>` and are injected via `-Dversion`.

Each nightly binary is packaged with a `.sha256` checksum file and a `manifest-<target>.json` recording `built_at`, `commit`, `run_id`, `run_url`, `target`, `zig_target` and `version`. With `publish_release: true`, the workflow replaces the assets of the rolling prerelease on each run and retargets its tag.

## zig-release.yml

Triggers on `v*` tag pushes in the caller. Requires `permissions: contents: write` and `packages: write`, plus `secrets: inherit`.

| Input | Default | Notes |
| --- | --- | --- |
| `binary_name` | — (required) | |
| `artifact_prefix` | `""` | Falls back to `binary_name` |
| `zig_version` | `"0.16.0"` | |
| `android_api_level` / `android_ndk_version` | `"24"` / `"29.0.14206865"` | |
| `targets_json` | 12 targets | Same default matrix as nightly |
| `node_version` / `node_cache_dependency_path` | `""` | As in CI |
| `pre_build_command` | `""` | `BUILD_VERSION` is available |
| `build_args` | `""` | |
| `source_archive` | `false` | Build and attach a source tarball |
| `source_prepare_command` | `""` | Runs before archiving; `BUILD_VERSION` available |
| `source_archive_name` | `""` | Defaults to `<prefix>-source-<tag>.tar.gz` |
| `source_archive_excludes` | `.git`, `.zig-cache`, `zig-out` | Newline-separated tar excludes |
| `generate_release_notes` | `true` | GitHub-generated notes |
| `publish_docker` | `false` | Push a multi-arch image to ghcr.io |

The version is taken from the tag with the `v` stripped and injected as `-Dversion`. Release assets are named `<prefix>-<target>.bin` (or `.exe` on Windows, which additionally gets a `.zip`). If a release for the tag already exists, its assets are updated instead of failing.

With `publish_docker: true`, a follow-up job builds `linux/amd64` and `linux/arm64` images with buildx + QEMU, pushes to `ghcr.io/<owner>/<repo>` with the semver tag and `latest`, and uses GitHub Actions layer caching.

## Composite actions

Three helpers under `.github/actions/`, referenced with the same `@v1`:

| Action | Purpose |
| --- | --- |
| `setup-zig` | Wraps `mlugg/setup-zig@v2` (referenced by tag, not commit SHA); default version 0.16.0 |
| `nightly-decide` | Runs a Zig program over a workflow-runs API dump (`--runs-json`, `--current-run-id`, `--head-sha`, `--workflow-name`, `--force`) and prints `should_build=`, `reason=`, `matched_run_id=`, `matched_run_url=` |
| `package-artifact` | Runs a Zig program (`--binary`, `--target`, `--zig-target`, `--version`, `--repository`, `--commit`, `--run-id`, `--server-url`, `--built-at`) that writes `<binary>.sha256` and `manifest-<target>.json` |

`nightly-decide` and `package-artifact` are written in Zig — seven `zig test` blocks between them — and tested in NullBuilder's own CI on every push and pull request.

> [!NOTE]
> Pre-1.0: inputs and defaults above may change on the `v1` branch. The workflow files' own input descriptions are the source of truth.
