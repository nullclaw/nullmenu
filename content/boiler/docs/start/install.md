---
title: Install
description: Prebuilt binaries for seven targets, source builds with Zig 0.16.0, NullHub, or Docker Compose.
order: 1
verified: v2026.5.29
---

NullBoiler ships as a single static binary with SQLite vendored inside. There is no external database, no message broker, and nothing to provision — the stockpot arrives ready to fill.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Releases use CalVer tags (v2026.x.y).

## Prebuilt binary

Every release attaches binaries for seven targets:

| Platform | Asset |
| --- | --- |
| Linux x86_64 | `nullboiler-linux-x86_64.bin` |
| Linux aarch64 | `nullboiler-linux-aarch64.bin` |
| Linux riscv64 | `nullboiler-linux-riscv64.bin` |
| macOS aarch64 | `nullboiler-macos-aarch64.bin` |
| macOS x86_64 | `nullboiler-macos-x86_64.bin` |
| Windows x86_64 | `nullboiler-windows-x86_64.exe` (also `.zip`) |
| Windows aarch64 | `nullboiler-windows-aarch64.exe` (also `.zip`) |

Download, mark executable, check the version:

```bash
curl -LO https://github.com/nullclaw/nullboiler/releases/latest/download/nullboiler-macos-aarch64.bin
chmod +x nullboiler-macos-aarch64.bin
./nullboiler-macos-aarch64.bin --version
```

Swap the asset name for your platform from the table above.

## Build from source

You need Zig `0.16.0` exactly — the repo pins it. SQLite is vendored, so there are no system dependencies to hunt down. (The vendored MQTT and Redis client stubs compile but those transports are not functional yet.)

```bash
git clone https://github.com/nullclaw/nullboiler
cd nullboiler
zig build
./zig-out/bin/nullboiler --version
```

Start the server against a config file:

```bash
./zig-out/bin/nullboiler --config config.json --port 8080 --db nullboiler.db
```

The repo ships a `config.example.json` you can copy as a starting point. See [Configuration](/docs/reference/configuration/) for every field.

## Via NullHub

If you run the rest of the family through [NullHub](https://hub.nullmenu.ai/), it installs and supervises NullBoiler like any other component:

```bash
nullhub install nullboiler
```

## Docker Compose

The repo carries a `docker-compose.yml` with profile-based stacks. From a repo checkout:

```bash
# orchestrator only
docker compose up -d nullboiler

# orchestrator + a NullClaw worker
docker compose --profile nullclaw up -d

# full async stack: nullboiler + nullclaw + nulltickets
docker compose --profile nulltickets up -d
```

The compose guide in the repo (`docs/docker-compose-nulltickets-nullclaw.md`) covers the token alignment between services and a full-stack smoke test.

## Where config lives

- Default path: `~/.nullboiler/config.json`
- Override the instance home with `NULLBOILER_HOME=/path/to/dir` — `config.json` is then read from that directory
- Point directly at a file with `--config /path/to/config.json`

Relative paths inside the config (`db`, `strategies_dir`, `tracker.workflows_dir`, `tracker.workspace.root`) resolve relative to the config file itself, so an instance directory stays self-contained.

Next: [Quickstart](/docs/start/quickstart/) — wire up one worker and create your first run.
