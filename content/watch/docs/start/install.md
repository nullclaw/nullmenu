---
title: Install
description: Prebuilt binaries, the Docker image, building from Zig source, or installing through NullHub.
order: 1
verified: v2026.5.29
---

NullWatch ships as a single static binary — 313 to 653 KB depending on target, as measured by the project. It needs no database, no daemon manager and no external services; state lives in plain files under `~/.nullwatch`.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Releases use CalVer (`v2026.x.y`); the latest is `v2026.5.29`.

## Prebuilt binaries

Every release attaches binaries for seven targets:

| Platform | Asset |
| --- | --- |
| Linux x86_64 | `nullwatch-linux-x86_64.bin` |
| Linux aarch64 | `nullwatch-linux-aarch64.bin` |
| Linux riscv64 | `nullwatch-linux-riscv64.bin` |
| macOS aarch64 (Apple Silicon) | `nullwatch-macos-aarch64.bin` |
| macOS x86_64 | `nullwatch-macos-x86_64.bin` |
| Windows x86_64 | `nullwatch-windows-x86_64.exe` / `.zip` |
| Windows aarch64 | `nullwatch-windows-aarch64.exe` / `.zip` |

Download the one for your machine and make it executable:

```bash
curl -LO https://github.com/nullclaw/nullwatch/releases/latest/download/nullwatch-macos-aarch64.bin
chmod +x nullwatch-macos-aarch64.bin
./nullwatch-macos-aarch64.bin serve
```

There is no Homebrew formula for NullWatch yet.

## Docker

A container image is published at `ghcr.io/nullclaw/nullwatch` (tags `latest` and `v2026.5.29`). It runs `serve` on port 7710 out of the box:

```bash
docker run --rm -p 7710:7710 ghcr.io/nullclaw/nullwatch:latest
```

State lives at `/nullwatch-data` inside the container; mount a volume there if the JSONL data should outlive it.

## Build from source

You need Zig 0.16.0 — `build.zig.zon` declares `minimum_zig_version = "0.16.0"`, so older toolchains won't build it.

```bash
git clone https://github.com/nullclaw/nullwatch
cd nullwatch
zig build
```

The README drives every command through `zig build run`:

```bash
zig build run -- serve
```

All examples in these docs use that form. If you installed a prebuilt binary, replace `zig build run --` with the binary name (`./nullwatch-macos-aarch64.bin serve`).

## Install through NullHub

If you run the stack under [NullHub](https://hub.nullmenu.ai/), it can install and supervise NullWatch like any other managed component:

```bash
nullhub install nullwatch
```

NullWatch stays headless either way — it exports a manifest with `--export-manifest` and accepts wizard answers via `--from-json`, so NullHub owns the setup UI while NullWatch owns the data. NullHub finds the running service through the `NULLWATCH_URL` environment variable (for example `NULLWATCH_URL=http://127.0.0.1:7710`).

## Verify

Start the server and check its health endpoint:

```bash
zig build run -- serve
curl http://127.0.0.1:7710/health
```

## Where things live

The first run creates a home directory:

| Path | Purpose |
| --- | --- |
| `~/.nullwatch/config.json` | Single JSON config file |
| `~/.nullwatch/data/` | JSONL storage for spans, evals and runs |

The default config:

```json
{
  "host": "127.0.0.1",
  "port": 7710,
  "data_dir": "data",
  "api_token": null
}
```

`data_dir` resolves relative to the config file, which is how `data` becomes `~/.nullwatch/data`. Set `api_token` to require a bearer token on API requests — see the [API reference](/docs/reference/api/). The E2E suite also uses a `NULLWATCH_HOME` environment variable to point the binary at an alternate home directory.

> [!WARNING]
> The repo has no license file yet. Check the repository before depending on it in contexts where licensing matters.

Next: seed demo data and take a first reading in the [quickstart](/docs/start/quickstart/).
