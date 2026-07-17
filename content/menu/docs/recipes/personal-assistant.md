---
title: Personal assistant
description: One NullClaw, your chat apps, local memory. The simplest complete setup.
order: 1
verified: v2026.5.29
---

The starter recipe: a single NullClaw instance that answers you on the chat apps you already use, remembers context locally, and runs as a background service. One binary, one config file, no other components.

## Ingredients

- NullClaw ([installed directly](/docs/start/install-nullclaw-directly/) or [via NullHub](/docs/start/run-your-first-agent/))
- An API key for one of ~60 supported providers (OpenRouter is the quick default)
- A chat channel — NullClaw supports 19, including Telegram, Discord, Signal, Slack, WhatsApp, Matrix, IRC and Email

## 1. Onboard

```bash
nullclaw onboard --api-key sk-... --provider openrouter
```

Already onboarded and just want to add channels? There's a flag for that:

```bash
nullclaw onboard --channels-only
```

The wizard writes channel credentials into `~/.nullclaw/config.json`. Inspect what you have:

```bash
nullclaw channel list
nullclaw channel status
```

## 2. Start the gateway

Channels only run inside the long-running runtime:

```bash
nullclaw gateway
```

This starts the HTTP gateway on `127.0.0.1:3000`, connects your channels, and runs the heartbeat and cron scheduler. Message your bot from Telegram (or wherever) and it answers.

> [!NOTE]
> Gateway clients must exchange a one-time 6-digit pairing code for a bearer token, and chat channels have allowlists — a stranger finding your bot cannot just start using it. Details on the [security page](/docs/operate/security/).

## 3. Make it permanent

Register it as an OS service (systemd or OpenRC) so it starts at boot:

```bash
nullclaw service install
nullclaw service status
```

If NullHub manages your instance, skip this — the hub already supervises it and restarts it on crashes.

## 4. Season to taste

**Memory.** The default engine is hybrid search — SQLite FTS5 plus vector similarity — and it works out of the box. Look inside it:

```bash
nullclaw memory stats
nullclaw memory search "that restaurant in Lisbon"
```

`nullclaw memory forget` and `nullclaw memory export-jsonl` are there when you need them.

**Schedules.** Recurring jobs — a morning summary, a nightly cleanup — run through built-in cron:

```bash
nullclaw cron list
```

`cron add`, `once`, `pause`, `resume` and `run` manage entries; the scheduler runs inside the gateway.

**Skills.** Packaged capabilities install from a registry:

```bash
nullclaw skills list
nullclaw skills install <name>
```

## Why this is enough

For a single-user assistant you need no orchestrator, no task tracker, no separate memory service. Resource cost is small — around 1 MB of RAM, as measured by the project — so it runs happily on a Raspberry-class board next to the router.

When one agent stops being enough, the upgrades are incremental: shared memory across agents is [Shared knowledge](/docs/recipes/shared-knowledge/), and unattended work is [Durable backlog](/docs/recipes/durable-backlog/).
