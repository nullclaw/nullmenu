---
title: Install
description: Get the NullHub binary — Docker, prebuilt release, or build from source.
order: 1
verified: v2026.5.29
---

NullHub is one self-contained binary: the Zig backend and the Svelte dashboard are compiled together, so there is nothing else to deploy. Pick whichever of the three routes below fits your machine.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Releases are calendar-versioned (v2026.x.y).

## Docker

The image serves the dashboard on port 19800 and keeps all state in a volume mounted at `/nullhub-data`:

```bash
docker run --rm -p 19800:19800 -v nullhub-data:/nullhub-data ghcr.io/nullclaw/nullhub:latest
```

The default image runs as an unprivileged user (uid 65534). If you need the container to run as root — the Dockerfile calls this "autonomous mode", an explicit opt-in — build the root target:

```bash
docker build --target release-root -t nullhub:root .
```

## Prebuilt binary

Every release attaches binaries for seven targets:

| Platform | Asset |
| --- | --- |
| macOS, Apple silicon | `nullhub-macos-aarch64.bin` |
| macOS, Intel | `nullhub-macos-x86_64.bin` |
| Linux, x86_64 | `nullhub-linux-x86_64.bin` |
| Linux, aarch64 | `nullhub-linux-aarch64.bin` |
| Linux, riscv64 | `nullhub-linux-riscv64.bin` |
| Windows, x86_64 | `nullhub-windows-x86_64.exe` (also `.zip`) |
| Windows, aarch64 | `nullhub-windows-aarch64.exe` (also `.zip`) |

Download from [GitHub releases](https://github.com/nullclaw/nullhub/releases), make it executable, run it:

```bash
curl -fL https://github.com/nullclaw/nullhub/releases/latest/download/nullhub-macos-aarch64.bin -o nullhub
chmod +x nullhub
./nullhub
```

There is no Homebrew formula for NullHub yet. (If you only want the agent, [NullClaw](https://claw.nullmenu.ai/) does have one.)

## Build from source

Requires Zig 0.16.0 exactly, plus `npm` to build the embedded Svelte UI:

```bash
zig build
./zig-out/bin/nullhub
```

The resulting binary includes the built web UI — it does not depend on a runtime `ui/build` directory.

## Prerequisites

At runtime NullHub needs two ordinary tools:

- `curl` — fetches releases and component binaries
- `tar` — extracts UI module bundles

If either is missing, NullHub tries to install it automatically through whatever package manager it finds: `apt`, `dnf`, `yum`, `pacman`, `zypper`, `apk`, `brew`, `winget`, or `choco`.

## Run as an OS service

Once you are happy with it, register NullHub as a systemd or launchd service so it survives reboots:

```bash
nullhub service install
nullhub service status
```

`nullhub service uninstall` removes it again.

## Where things live

All state — config, instances, downloaded binaries, logs, cached manifests — sits under `~/.nullhub/`. Deleting that directory is a full reset.

Next: [Quickstart](/docs/start/quickstart/).
