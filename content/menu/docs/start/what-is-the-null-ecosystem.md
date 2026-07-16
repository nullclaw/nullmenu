---
title: What is the Null ecosystem
description: A family of single-binary Zig tools for running AI agents on your own hardware.
order: 1
verified: v2026.5.29
---

Null is a family of small, single-binary tools for running AI agents locally, written in Zig 0.16.0. Each tool does one job, stores its state in local files, and talks plain JSON over HTTP — so you can take one dish or the full menu.

## The idea

Most agent platforms are one large runtime that does everything. Null splits the kitchen into stations:

| Component | Job | Where it lives |
| --- | --- | --- |
| [NullClaw](https://claw.nullmenu.ai/) | The agent runtime — executes the actual AI work | `~/.nullclaw` |
| [NullHub](https://hub.nullmenu.ai/) | Control plane — installs, supervises and updates the rest | `~/.nullhub` |
| [NullTickets](https://tickets.nullmenu.ai/) | Durable task state — what work exists and its status | SQLite, `~/.nulltickets` |
| [NullBoiler](https://boiler.nullmenu.ai/) | Orchestration — decides what runs, when, on which worker | SQLite, `~/.nullboiler` |
| [NullWatch](https://watch.nullmenu.ai/) | Observability — traces, evals, token usage, cost | JSONL, `~/.nullwatch` |
| [NullPantry](https://pantry.nullmenu.ai/) | Shared knowledge and long-term agent memory | SQLite, `.nullpantry/` |
| [NullDesk](https://desk.nullmenu.ai/) | Human review desk — diffs, approvals, audit trail | files in your workspace |
| [nllclw](https://clw.nullmenu.ai/) | A minimal, readable standalone assistant | user config dir |

Every component is a static binary. No Node, no Python, no external database — SQLite is vendored where needed. Nothing phones home; there is no hosted service behind any of this.

## How the pieces relate

NullClaw is the chef: it connects 50+ model providers to 19 chat channels and runs the agent loop in a 678 KB binary using about 1 MB of RAM (measured by the project). Around it, the rest of the family handles what a single runtime shouldn't: NullTickets holds the backlog, NullBoiler applies scheduling policy, NullWatch records what happened, NullPantry remembers what the team knows, and NullDesk puts a human between agent output and your disk.

NullHub ties it together. It is a manifest-driven install engine with an embedded dashboard: `nullhub install nullclaw` runs a wizard, and the same binary supervises processes, checks health, streams logs, and applies updates. Today it manages four components — NullClaw, NullBoiler, NullTickets and NullWatch. The others install separately.

## What Null is not

- Not a cloud product. Everything binds to loopback by default and stores state locally.
- Not a cryptocurrency project. NullClaw carries an explicit no-token, no-blockchain disclaimer.
- Not 1.0. Versions are CalVer (`v2026.x.y`), and licensing varies by repo — NullClaw, NullHub, NullBoiler, NullTickets and nllclw are MIT; NullPantry, NullWatch, NullDesk, NullCap and NullBuilder have no license file yet.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. That applies to the whole family.

## Where to go next

- [Choose your setup](/docs/start/choose-your-setup/) — one agent, or the full stack.
- [Install NullHub](/docs/start/install-nullhub/) — the managed path.
- [Install NullClaw directly](/docs/start/install-nullclaw-directly/) — the fastest path.
- [Recipes](/docs/recipes/personal-assistant/) — real setups, composed from real parts.
