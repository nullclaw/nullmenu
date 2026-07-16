---
title: Run your first agent
description: Install NullClaw through NullHub, start it, and send it a message.
order: 4
verified: v2026.5.29
---

With NullHub running, installing an agent is one command and a short wizard. This page takes you from an empty hub to a running NullClaw you can talk to.

## 1. Install NullClaw

```bash
nullhub install nullclaw
```

This runs a terminal wizard: it downloads the component, walks you through provider and API-key setup, and writes the instance config. The web dashboard at `http://nullhub.localhost:19800` has the same wizard if you prefer clicking — installs are manifest-driven, so both paths produce the same result.

## 2. Start and check it

```bash
nullhub start nullclaw/<instance>
nullhub status
```

`status` shows every managed instance with its health. For a single instance, `nullhub status nullclaw/<instance>` prints the detail view. The dashboard shows the same as status cards, refreshed by periodic health checks.

Watch the logs while it boots — with a startup measured by the project at under 2 ms, don't blink:

```bash
nullhub logs nullclaw/<instance> -f
```

## 3. Talk to it

The agent binary is on your machine now, so you can use NullClaw's own CLI directly:

```bash
nullclaw agent -m "Hello, nullclaw!"
nullclaw agent            # interactive chat
```

For a long-running agent — chat channels, scheduler, HTTP gateway — the instance runs `nullclaw gateway` under hub supervision, listening on `127.0.0.1:3000` by default. If it crashes, the hub restarts it with backoff.

## 4. Add the rest of the stack (optional)

The same install command works for the other three managed components:

```bash
nullhub install nullboiler    # workflow orchestration
nullhub install nulltickets   # durable task tracking
nullhub install nullwatch     # traces, evals, cost
```

The wizard links components as it goes — a local NullTickets gets wired to NullBoiler automatically. Then bring everything up at once:

```bash
nullhub start-all
nullhub status
```

> [!TIP]
> You can run several instances of the same component side by side — for example, two NullClaw instances with different providers. Each gets its own config and logs under `~/.nullhub/`.

## What just happened

NullHub read each component's `nullhub-manifest.json`, which describes installation, configuration, launch, health checks and wizard steps. The hub is a generic engine that interprets manifests — which is also why it only manages components that publish one (NullClaw, NullBoiler, NullTickets, NullWatch today).

## Next steps

- Wire channels and memory: [Personal assistant](/docs/recipes/personal-assistant/)
- Give agents a durable backlog: [Durable backlog](/docs/recipes/durable-backlog/)
- Keep it healthy: [Updates and rollback](/docs/operate/updates-and-rollback/)
