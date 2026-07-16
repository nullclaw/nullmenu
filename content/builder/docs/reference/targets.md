---
title: Targets
description: Default target matrices, custom matrices, and how Android builds work.
order: 2
---

NullBuilder cross-compiles ReleaseSmall binaries from a JSON target matrix. CI defaults to three targets; nightly and release default to twelve across five OS families.

## Default CI matrix (zig-ci.yml)

| target | Runner | zig_target |
| --- | --- | --- |
| `linux-x86_64` | ubuntu-latest | `x86_64-linux-musl` |
| `macos-aarch64` | macos-latest | `aarch64-macos` |
| `windows-x86_64` | windows-latest | `x86_64-windows` |

## Default nightly and release matrix

| target | Runner | zig_target | Notes |
| --- | --- | --- | --- |
| `linux-x86_64` | ubuntu-latest | `x86_64-linux-musl` | |
| `linux-aarch64` | ubuntu-latest | `aarch64-linux-musl` | |
| `linux-arm32-gnu` | ubuntu-latest | `arm-linux-gnueabihf` | |
| `linux-arm32-musl` | ubuntu-latest | `arm-linux-musleabihf` | |
| `linux-riscv64` | ubuntu-latest | `riscv64-linux-musl` | |
| `android-aarch64` | ubuntu-latest | `aarch64-linux-android` | NDK build |
| `android-armv7` | ubuntu-latest | `arm-linux-androideabi` | `zig_cpu: baseline+v7a` |
| `android-x86_64` | ubuntu-latest | `x86_64-linux-android` | NDK build |
| `macos-aarch64` | macos-latest | `aarch64-macos` | |
| `macos-x86_64` | macos-latest | `x86_64-macos` | |
| `windows-x86_64` | windows-latest | `x86_64-windows` | `ext: .exe` |
| `windows-aarch64` | windows-latest | `aarch64-windows` | `ext: .exe` |

Linux binaries are musl-linked static builds except the arm32 `gnu` flavor. Everything is compiled with `-Doptimize=ReleaseSmall` and, for nightly and release, a `-Dversion` injected by the workflow.

## Custom matrices

Pass `targets_json` to override the matrix. Each entry needs `os` (runner label), `target` (your artifact name suffix) and `zig_target` (the Zig triple); `zig_cpu` and `ext` are optional. From the README — NullHub trims CI to four targets and adds Node for its UI build:

```yaml
jobs:
  zig:
    uses: nullclaw/nullbuilder/.github/workflows/zig-ci.yml@v1
    permissions:
      contents: read
    with:
      binary_name: nullhub
      artifact_prefix: nullhub
      node_version: 22
      node_cache_dependency_path: ui/package-lock.json
      test_command: zig build test -Dembed-ui=false -Dbuild-ui=false --summary all
      pre_build_command: |
        npm --prefix ui ci --no-audit --no-fund
        npm --prefix ui run build
      build_args: -Dbuild-ui=false
      e2e_command: bash tests/test_e2e.sh
      targets_json: >-
        [
          {"os":"ubuntu-latest","target":"linux-x86_64","zig_target":"x86_64-linux-musl"},
          {"os":"ubuntu-latest","target":"linux-aarch64","zig_target":"aarch64-linux-musl"},
          {"os":"macos-latest","target":"macos-aarch64","zig_target":"aarch64-macos"},
          {"os":"windows-latest","target":"windows-x86_64","zig_target":"x86_64-windows"}
        ]
```

> [!TIP]
> `e2e_target` must match a `target` name in your matrix — the e2e command runs on that one job only (default `linux-x86_64`).

## How Android builds work

No Gradle. Targets whose name starts with `android-` get, on the Ubuntu runner:

1. JDK 17 (Temurin) and the Android SDK.
2. The NDK, installed via `sdkmanager --install "ndk;<version>"` — default `29.0.14206865`.
3. A generated libc file pointing Zig at the NDK sysroot (`include_dir`, `sys_include_dir`, `crt_dir` for the API level).

The API level (default `24`) is appended to the triple — e.g. `aarch64-linux-android.24` — and the build runs as plain `zig build -Dtarget=... --libc <file>`. Override with `android_api_level` and `android_ndk_version` on the nightly and release workflows.

## Artifact naming

| Context | Name |
| --- | --- |
| CI artifact | `<prefix>-<target>` (contains the raw binary) |
| Nightly artifact | `<prefix>-nightly-<short-sha>-<target>`, binary named `<prefix>-<target>` plus metadata |
| Release asset | `<prefix>-<target>.bin`, or `<prefix>-<target>.exe` + `.zip` on Windows |
| Source archive | `<prefix>-source-<tag>.tar.gz` (when `source_archive: true`) |

`<prefix>` is `artifact_prefix`, falling back to `binary_name`. Workflow inputs are documented in [Workflows](/docs/reference/workflows/).

> [!NOTE]
> Pre-1.0: the default matrices may change on the `v1` branch. Pin your own `targets_json` if you need a fixed set.
