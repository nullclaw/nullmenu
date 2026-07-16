---
title: Build and run
description: Compile NullCap with Zig 0.16.0, connect it to NullHub, and start the overlay.
order: 2
---

NullCap has no published releases, so the install is the build. You need Zig 0.16.0 exactly, and a NullHub running locally before the overlay is useful.

## Prerequisites

- **Zig 0.16.0** — the repo pins this version; other versions are not expected to work.
- **A running [NullHub](https://hub.nullmenu.ai/)** at `http://127.0.0.1:19800` with a NullClaw instance behind it. NullCap sends every model, image and transcription request there and nowhere else.
- macOS, Windows or Linux. On Linux, audio and display backends (X11, ALSA, PulseAudio/PipeWire) are loaded at runtime.

> [!NOTE]
> NullCap is not installable via `nullhub install` today. Build it from source alongside your hub.

## Build

```bash
zig build        # compile
zig build test   # run the static test suite
```

Release-style and cross-compiled binaries come from the same build graph:

```bash
zig build -Doptimize=ReleaseSafe
zig build -Dtarget=x86_64-windows -Doptimize=ReleaseSafe
zig build -Dtarget=x86_64-linux-musl -Doptimize=ReleaseSafe
zig build -Dtarget=aarch64-macos -Doptimize=ReleaseSafe
```

For macOS targets on non-Xcode hosts, pass `-Dmacos-sdk=/path/to/MacOSX.sdk` or set `SDKROOT`; Xcode hosts auto-detect the SDK via `xcrun`.

On macOS you can also produce an app bundle:

```bash
zig build app-bundle -Doptimize=ReleaseSafe
open zig-out/nullCap.app
```

Nix users get the same result from the flake:

```bash
nix build              # → result/bin/nullcap
nix run . -- doctor
```

## First run

Check the environment, then bootstrap:

```bash
zig build run -- doctor                    # environment and readiness check
zig build run -- onboarding apply          # privacy preset + seed workflow profiles
zig build run -- diagnostics permissions   # OS mic/screen permission status
zig build run -- setup                     # configure NullHub instances
zig build run -- instances                 # list what the hub exposes
```

## Configure

Settings are dotted keys in a private config file (`config path` shows where). A minimal live-call setup:

```bash
zig build run -- mode interview
zig build run -- profile set role "Senior Backend Engineer"
zig build run -- config set capture.mic_enabled true
zig build run -- config set capture.system_audio_enabled true
zig build run -- config set capture.live_transcript_enabled true
```

Verify audio devices before a real call:

```bash
zig build run -- capture devices
zig build run -- mic-test --level 4
zig build run -- system-audio-test --level 4
```

The level test is a local WAV preflight — RMS, peak, and a `speech_like` verdict — and never touches NullHub.

## Start the overlay

```bash
zig build run -- run
```

This starts the native overlay runtime and registers global hotkeys. A few to know on day one:

| Hotkey | Action |
| --- | --- |
| `ctrl+option+cmd+space` | hide / show the overlay |
| `ctrl+option+cmd+s` | capture the screen, request a short cue |
| `ctrl+option+cmd+m` | record a mic chunk, transcribe, request a cue |
| `ctrl+option+cmd+a` | record a system-audio chunk as the other speaker |
| `ctrl+option+cmd+c` | send clipboard text as a cue |
| `ctrl+option+cmd+b` | toggle click-through passthrough |
| `ctrl+option+cmd+q` | quit |

Rebind anything with `keybinds set ACTION SPEC`. Check overall health at any point:

```bash
zig build run -- dashboard status
```

> [!NOTE]
> Unreleased: nothing is tagged yet, and config and CLI may change without notice.

For what NullCap stores locally and how routing works, see the [Overview](/docs/start/overview/).
