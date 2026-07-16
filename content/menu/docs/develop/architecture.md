---
title: Architecture
description: How the family divides responsibility, and the design rules every component follows.
order: 1
verified: v2026.5.29
---

The ecosystem is a set of small services with a strict division of labor, joined by plain JSON over HTTP. Understanding two things — the layer split and the manifest contract — explains most of how it fits together.

## The layer split

The core stack separates three concerns that most agent platforms fuse into one process:

```
            NullHub  (control plane: install, supervise, update, dashboard)
               │
   ┌───────────┼───────────────┬──────────────┐
   ▼           ▼               ▼              ▼
NullTickets  NullBoiler     NullClaw      NullWatch
 (truth)      (policy)     (execution)   (telemetry)
   ▲             │             │              ▲
   └── claims ───┘             └── spans ─────┘
```

- **NullTickets owns truth.** What work exists, its state machine, its history. It stores the graph and the events; it never runs agents or decides scheduling.
- **NullBoiler owns policy.** What runs, when, on which worker — routing, concurrency, retries, fan-out, checkpoints. It polls the tracker, claims tasks, and dispatches.
- **NullClaw owns execution.** Providers, tools, sandboxing, channels. It does the work and reports back.

Each layer is optional. One agent loop plus NullTickets is a valid stack; so is NullClaw alone. Around the core: NullWatch records what happened (spans, evals, cost), NullPantry holds what the team knows (permission-aware knowledge and memory), and NullDesk puts a human at the pass — reviewing every plate before it leaves the kitchen.

## The manifest contract

NullHub is not hard-coded to its components. Each managed component publishes a `nullhub-manifest.json` describing its installation, configuration schema, launch command, health checks, wizard steps and UI modules. The hub is a generic engine that interprets manifests — components export theirs with `--export-manifest`, and bootstrap config from wizard answers with `--from-json` (NullWatch, NullTickets and NullBoiler all ship both).

This is why the managed set is exactly NullClaw, NullBoiler, NullTickets and NullWatch: those are the four that publish manifests today.

## Protocols

| Protocol | Used for |
| --- | --- |
| JSON over HTTP/1.1 | Every service API |
| OpenAPI | Self-describing schemas — 3.1 for NullTickets and NullBoiler; NullPantry serves an OpenAPI manifest |
| SSE | Live log streaming (NullHub) |
| OTLP/HTTP JSON | Trace ingest (NullWatch, NullTickets) |
| A2A v0.3.0 | Agent-to-agent JSON-RPC (NullClaw, NullBoiler dispatch) |
| ACP over stdio | Editor/desk integration (`nullclaw acp`, NullDesk) |
| MCP | External tool servers (NullClaw client, stdio + HTTP) |

No message broker is required anywhere in the core; MQTT and Redis Streams are optional NullBoiler dispatch paths.

## Design rules

The same decisions recur across every repo:

- **One static binary per component.** No runtime dependency on Node, Python, or provider SDKs. NullHub even embeds its Svelte dashboard into the binary via `@embedFile`.
- **Vendored persistence.** Where a database is needed, it is SQLite compiled in — no external DB to run. NullWatch skips even that: append-only JSONL files.
- **Local-first state.** Everything under a home directory: `~/.nullhub`, `~/.nullclaw`, `~/.nulltickets`, `~/.nullboiler`, `~/.nullwatch`. No hosted service exists to sync to.
- **Interfaces over plugins.** NullClaw makes everything a swappable vtable interface — providers, channels, tools, memory engines, tunnels, runtimes, peripherals. NullPantry moves the same idea to compile time: engine profiles (`nullclaw`/`minimal`/`full`/`custom`) build in only the backends you chose.
- **Loopback by default, tokens for the rest.** See [Security](/docs/operate/security/).
- **Zig 0.16.0, CalVer, shared CI.** Every repo pins the same toolchain and releases through [NullBuilder](https://github.com/nullclaw/nullbuilder)'s reusable workflows.

> [!NOTE]
> The deeper per-component architecture docs are worth reading in the repos: NullClaw's `docs/en/architecture.md`, NullTickets' `docs/architecture.md`, NullPantry's `docs/product-architecture.md`, NullDesk's 39 KB `docs/architecture.md`.

Next: the seams you can build against — [Integrations](/docs/develop/integrations/).
