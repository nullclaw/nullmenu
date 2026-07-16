---
title: Multi-instance
description: Run several instances of the same component side by side, addressed as component/name.
order: 2
verified: v2026.5.29
---

NullHub can run multiple instances of the same component at once — two NullClaw agents with different providers, a NullBoiler for real work next to one for experiments. Every instance is a separate process with its own config, logs, and lifecycle.

## Addressing

Everything in the CLI and the API uses `{component}/{instance-name}`:

```bash
nullhub start nullclaw/main
nullhub status nullclaw/experiments
nullhub logs nullboiler/staging -f
nullhub config nullclaw/experiments --edit
nullhub uninstall nullclaw/experiments
```

You pick the instance name during the install wizard. Installing the same component again creates a second instance rather than overwriting the first.

## Ports

Two instances of one component cannot share a port. Each manifest declares its port specs — name, config key, default, protocol — and the wizard prompts for them, so give the second instance different values there. Health checks read the port from the instance's own config (`port_from_config` in the manifest), so monitoring follows each instance to wherever you put it.

## Bulk operations

```bash
nullhub start-all    # start every installed instance
nullhub stop-all     # stop them all
nullhub status       # one table, all instances
nullhub update-all   # update everything (see Updates and rollback)
```

`start-all` and `stop-all` operate across components and instances alike — one command brings the whole station up or down.

## Per-instance admin for NullClaw

Managed NullClaw installs get an instance-scoped admin API through NullHub — status, config, models, cron, channels, and skills routes. Because the routes are per-instance, two agents stay fully separated:

```bash
nullhub api GET /api/instances/nullclaw/main/status --pretty
nullhub api GET /api/instances/nullclaw/main/cron --pretty
```

## Where instance state lives

Each instance's config, logs, and binaries live under `~/.nullhub/`. The supervisor tracks instances independently: one crash-looping instance does not affect its siblings, and health checks report per instance on the dashboard cards.

> [!TIP]
> Multi-instance is the cheap way to test a component update: install a second instance, point it at scratch data, update that one first via `nullhub update <c>/<second>`, and only then touch `main`.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.
