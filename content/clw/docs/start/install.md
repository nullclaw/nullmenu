---
title: Install
description: Release binary, build from source, or container image.
order: 1
verified: v2026.6.1
---

nllclw ships as one standalone binary — no Node, Python, curl, or provider SDKs at runtime. Pick a release asset, build from source, or pull the container image.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Release tags are date-based (CalVer), e.g. `v2026.6.1`.

## Release binary

Prebuilt binaries are attached to [GitHub Releases](https://github.com/nullclaw/nllclw/releases). Assets are built for Linux, macOS, Windows, and Android. Linux, macOS, and Android assets use `.bin`; Windows assets use `.zip`.

Download the asset for your OS and CPU, make it executable on Unix-like systems, then run:

```bash
chmod +x nllclw
./nllclw --help
```

If `--help` prints, you are done. Continue with the [quickstart](/docs/start/quickstart/).

## Build from source

You need Zig `0.16.0` exactly — the package metadata pins the minimum compiler in `build.zig.zon`. Get it from the [official Zig downloads page](https://ziglang.org/download/), then:

```bash
git clone https://github.com/nullclaw/nllclw.git
cd nllclw
zig build --release=small
./zig-out/bin/nllclw --help
```

The ReleaseSmall binary comes out at 899,784 bytes; stripped, 813,760 bytes — measured by the project, with reproduction commands in the repo's `docs/en/benchmarks.md`.

To run the test suite:

```bash
zig build test --summary all
```

385/385 tests pass on the default build; 390/390 with `-Dshell-tool=true`.

> [!WARNING]
> The optional `shell_exec` tool does not exist in the default binary. If you want it, you must build it in explicitly with `zig build -Dshell-tool=true`. See [Tools and memory](/docs/guides/tools-and-memory/) before you do.

## Container image

A container image is published to GitHub Container Registry:

```bash
docker run --rm ghcr.io/nullclaw/nllclw:v2026.6.1 --help
```

## Where files go

The binary itself can live anywhere. Everything else is kept out of your project directory:

- config: `~/.config/nllclw/config.json` (or `$XDG_CONFIG_HOME/nllclw/`; on Windows, `%APPDATA%\nllclw\`)
- state (memory, facts, schedules): `~/.local/state/nllclw` (or `$XDG_STATE_HOME/nllclw`; on Windows, `%LOCALAPPDATA%\nllclw`)

## Uninstall

```bash
./nllclw uninstall
```

This removes the nllclw user config and state directories. Delete the binary itself by hand.

## Next

Run the setup wizard — see the [quickstart](/docs/start/quickstart/). If you outgrow the paring knife and want 50+ providers and 19 chat channels, the bigger sibling is [NullClaw](https://claw.nullmenu.ai/).
