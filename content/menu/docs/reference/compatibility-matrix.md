---
title: Compatibility matrix
description: Versions, licenses, platforms, install paths and hub-manageability, per component.
order: 4
verified: v2026.5.29
---

The honest state of the family as of July 2026. All components are pre-1.0, versioned with CalVer (`v2026.x.y` — a date, not a maturity score), and built with Zig 0.16.0 exactly.

## Components

| Component | Latest release | License | Status | Hub-managed |
| --- | --- | --- | --- | --- |
| NullClaw | v2026.5.29 (+ nightlies) | MIT | beta | yes |
| NullHub | v2026.5.29 | MIT | beta | is the hub |
| NullBoiler | v2026.5.29 | MIT | beta | yes |
| NullTickets | v2026.5.29 | MIT | beta | yes |
| NullWatch | v2026.5.29 | none yet | early | yes |
| NullPantry | v2026.06.09 (+ nightlies) | none yet | early | no |
| nllclw | v2026.6.1 | MIT | early | no |
| NullDesk | no releases | none yet | pre-release | no |
| NullCap | no releases | none yet | experimental | no |
| NullBuilder | no releases (`v1` branch) | none yet | maintainer infra | no |

> [!WARNING]
> "None yet" means the repo has no license file — which legally means all rights reserved, whatever the intent. Check the repo before building anything commercial on NullWatch, NullPantry, NullDesk or NullCap.

## Install paths

| Component | Homebrew | Docker (ghcr.io) | Nix | Prebuilt binaries | Source |
| --- | --- | --- | --- | --- | --- |
| NullClaw | yes | `nullclaw/nullclaw` | flake | yes | zig build |
| NullHub | no | `nullclaw/nullhub` | no | 7 targets | zig build (+ npm) |
| NullBoiler | no | Dockerfile + compose in repo | no | releases on GitHub | zig build |
| NullTickets | no | Dockerfile in repo | no | releases on GitHub | zig build |
| NullWatch | no | no | no | 7 targets | zig build |
| NullPantry | no | `nullclaw/nullpantry` (multi-arch) | no | no | zig build |
| nllclw | no | `nullclaw/nllclw` | no | Linux/macOS/Windows/Android | zig build |
| NullDesk | no | no | no | no | zig build only |
| NullCap | no | no | flake | no | zig build only |

## Platforms

Prebuilt binaries, where published, cover:

| Component | Targets |
| --- | --- |
| NullHub | 7 targets: Linux x86_64/aarch64/riscv64, macOS x86_64/aarch64, Windows x86_64/aarch64 |
| NullWatch | 7 targets: Linux x86_64/aarch64/riscv64, macOS x86_64/aarch64, Windows x86_64/aarch64 |
| NullClaw | Linux, macOS, Windows across ARM, x86 and RISC-V |
| nllclw | Linux, macOS, Windows, Android |

NullClaw additionally documents Android via Termux. The shared release pipeline (NullBuilder) cross-compiles up to 12 targets across 5 OS families — Linux (incl. arm32 and riscv64), Android, macOS, Windows — so coverage tends to widen with each release. NullDesk's CI builds its TUI/core for macOS, Linux, FreeBSD, Windows and Android, but publishes no artifacts yet.

## Toolchain

| Requirement | Value |
| --- | --- |
| Zig | **0.16.0 exactly** — repos pin it; newer or older will not build |
| Runtime dependencies | none (static binaries; SQLite vendored where used) |
| NullHub build extra | npm (embedded Svelte UI) |
| NullHub runtime extra | curl, tar (auto-installed if missing) |

## What composes with what

| Integration | Status |
| --- | --- |
| NullHub manages NullClaw / NullBoiler / NullTickets / NullWatch | shipped (manifest-driven) |
| NullHub manages NullPantry / NullDesk / NullCap / nllclw | not today |
| NullBoiler ↔ NullTickets pull-mode | shipped |
| NullBoiler → NullClaw dispatch (webhook, A2A) | shipped |
| NullBoiler → third-party workers (openai_chat, api_chat, MQTT, Redis Streams) | shipped |
| NullClaw → NullWatch traces (OTLP) | shipped |
| NullClaw → NullTickets task loop | shipped (integration guide in tracker repo) |
| NullClaw → NullPantry remote memory | shipped (integration guide in pantry repo) |
| NullDesk → NullClaw over ACP | pre-release |
| NullCap → NullHub-routed model work | experimental |

Binary sizes quoted around the family (4.4–6.5 MB NullClaw, 313–653 KB NullWatch, 842 KiB–1.23 MB nllclw) come from the release assets on GitHub; runtime memory figures are self-reported by the projects.
