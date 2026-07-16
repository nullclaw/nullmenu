---
title: Install NullHub
description: Get the control plane running via Docker, a release binary, or from source.
order: 3
verified: v2026.5.29
---

NullHub is a single binary with an embedded dashboard that installs and supervises the rest of the stack. Three ways to get it; all end at the same place: `http://nullhub.localhost:19800`.

## Option A: Docker

The quickest way to try it:

```bash
docker run --rm -p 19800:19800 -v nullhub-data:/nullhub-data ghcr.io/nullclaw/nullhub:latest
```

Then open [http://nullhub.localhost:19800](http://nullhub.localhost:19800). The named volume keeps hub state across container restarts.

## Option B: release binary

Prebuilt binaries for 7 targets are attached to each [GitHub release](https://github.com/nullclaw/nullhub/releases) — Linux (x86_64, aarch64, riscv64), macOS (x86_64, aarch64) and Windows (x86_64, aarch64). Download the one for your platform, make it executable, and run it:

```bash
chmod +x nullhub-macos-aarch64.bin
./nullhub-macos-aarch64.bin
```

Running `nullhub` with no arguments starts the server and opens your browser. Where Bonjour or Avahi is available it publishes `nullhub.local` over mDNS and prefers that name; otherwise it falls back to `nullhub.localhost` and finally `127.0.0.1`.

> [!NOTE]
> There is no Homebrew formula for NullHub yet. `brew install` works for NullClaw only.

## Option C: build from source

Requires Zig 0.16.0 exactly, plus npm for the embedded Svelte UI:

```bash
git clone https://github.com/nullclaw/nullhub.git
cd nullhub
zig build
./zig-out/bin/nullhub
```

The UI is compiled into the binary — no `ui/build` directory needed at runtime.

## Runtime prerequisites

NullHub uses `curl` and `tar` to download and unpack components. If they are missing, it auto-installs them through whatever package manager it finds (apt, dnf, yum, pacman, zypper, apk, brew, winget, choco).

## Run it as a service

Once you are happy with it, register NullHub as an OS service so it survives reboots:

```bash
nullhub service install
nullhub service status
```

This writes a systemd unit on Linux or a launchd agent on macOS. `nullhub service uninstall` removes it.

## Check your install

```bash
nullhub version
nullhub status
```

`status` prints a table of managed instances — empty for now. All hub state lives under `~/.nullhub/` (config, instances, binaries, logs, cached manifests).

> [!WARNING]
> Pre-1.0: config and CLI may change between releases. Read the release notes before updating the hub itself.

Next: [Run your first agent](/docs/start/run-your-first-agent/) — install NullClaw through the hub and talk to it.
