---
title: Install
description: Get the NullTickets binary — release download, source build, or NullHub.
order: 1
verified: v2026.5.29
---

NullTickets ships as one static binary with SQLite vendored in. There is no database server to run and no runtime to install — the ticket rail arrives as a single piece of metal.

## Release binary

Each release attaches prebuilt binaries for seven targets:

| Asset | Platform |
| --- | --- |
| `nulltickets-linux-x86_64.bin` | Linux, x86_64 |
| `nulltickets-linux-aarch64.bin` | Linux, ARM64 |
| `nulltickets-linux-riscv64.bin` | Linux, RISC-V |
| `nulltickets-macos-x86_64.bin` | macOS, Intel |
| `nulltickets-macos-aarch64.bin` | macOS, Apple silicon |
| `nulltickets-windows-x86_64.exe` | Windows, x86_64 |
| `nulltickets-windows-aarch64.exe` | Windows, ARM64 |

Download, mark executable, run:

```bash
curl -LO https://github.com/nullclaw/nulltickets/releases/download/v2026.5.29/nulltickets-macos-aarch64.bin
chmod +x nulltickets-macos-aarch64.bin
./nulltickets-macos-aarch64.bin --port 7700 --db tracker.db
```

Releases use CalVer (`v2026.x.y`). There is no Homebrew formula or install script; the binary is the whole product.

## Build from source

You need Zig `0.16.0` — exactly that version, not "any recent Zig". SQLite is vendored as a static dependency, so there is nothing else to fetch.

```bash
git clone https://github.com/nullclaw/nulltickets
cd nulltickets
zig build
```

The binary lands at `zig-out/bin/nulltickets`. To build and start in one step:

```bash
zig build run -- --port 7700 --db tracker.db
```

Defaults are `--port 7700` and `--db nulltickets.db`. See [Configuration](/docs/reference/configuration/) for the config file and environment variable.

## Verify the build

```bash
zig build test            # unit tests
bash tests/test_e2e.sh    # end-to-end API flow
```

The e2e script drives a full claim → events → transition cycle against a live server. If it passes, your build works.

## Via NullHub

If you run the wider Null stack, [NullHub](https://hub.nullmenu.ai/) can install and supervise NullTickets for you — the repo exports a NullHub manifest (`src/export_manifest.zig`) and supports JSON config bootstrap (`src/from_json.zig`).

```bash
nullhub install nulltickets
```

## Docker

A `Dockerfile` ships at the repo root. No published container image is documented, so build your own if you want the tracker containerized.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Pin the release tag you deploy.

Next: [Quickstart](/docs/start/quickstart/) — from an empty database to a completed task.
