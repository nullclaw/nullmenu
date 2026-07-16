---
title: Troubleshooting
description: The diagnostic tour — health checks, logs, and the failures people actually hit.
order: 5
verified: v2026.5.29
---

Most problems in the stack yield to the same four moves: check status, read logs, run the doctor, curl the health endpoint. Start here before opening an issue.

## The diagnostic tour

```bash
nullhub status                      # all managed instances at a glance
nullhub logs nullclaw/<instance> -f # follow a misbehaving instance
nullclaw doctor                     # agent-side diagnostics
curl http://127.0.0.1:7700/health   # nulltickets
curl http://127.0.0.1:7710/health   # nullwatch
```

The dashboard shows the same health data as status cards, and streams logs live over SSE. For poking the hub's API directly:

```bash
nullhub api GET /api/... --pretty
```

## Common failures

### The dashboard won't open

`nullhub` prefers `nullhub.local` (published over mDNS), then falls back to `nullhub.localhost`, then `127.0.0.1` — if a hostname fails, try `http://127.0.0.1:19800` directly. Behind Docker, confirm you published the port (`-p 19800:19800`). The `nullhub.local` name only exists where Bonjour/Avahi mDNS is available.

### Build from source fails immediately

Check your Zig version first. Every repo in the family pins **Zig 0.16.0 exactly** — not 0.15.x, not whatever is newer. `zig version` before anything else. NullHub additionally needs npm at build time for its embedded UI.

### Component install fails in the hub

NullHub downloads with `curl` and unpacks with `tar`, auto-installing them if missing via your package manager. On a minimal container image with no package manager, install both by hand first. Also confirm the component is one the hub can manage: NullClaw, NullBoiler, NullTickets, NullWatch — nothing else has a manifest today.

### Port already in use

Check the [default port table](/docs/operate/secrets-and-networking/). The classic collision: NullPantry and nllclw's WebSocket both default to 8765. Everything takes a `--port` or config equivalent.

### The agent starts but won't answer

`nullclaw doctor`, then `nullclaw status`. Usual suspects: an invalid or unfunded provider API key, or channels configured but the gateway not running (channels only live inside `nullclaw gateway`). Verify channels with `nullclaw channel status`.

### Workflow won't run in NullBoiler

Validate before blaming the engine:

```bash
zig build run -- validate-workflows
```

Errors exit 1 with details. If workers never pick tasks up, check worker health in the API, tags matching between workflow and worker, and `max_concurrent` — a saturated worker looks a lot like a broken one.

### Tasks stuck in NullTickets

`curl http://127.0.0.1:7700/ops/queue` shows per-role queue depth. A task that is claimed but not moving usually has a live lease from a dead worker — leases expire on TTL, so it will return to the pool. Blocked tasks with unmet dependencies are excluded from claiming by design.

### Nothing showing in NullWatch

Seed known-good data to split the problem in half:

```bash
nullwatch demo-seed && nullwatch runs --limit 20
```

If demo runs appear, ingestion and storage work — the problem is on the sending side (NullClaw's OTLP endpoint config, or a mismatched `api_token`).

### After an update, config errors

Pre-1.0: config and CLI may change between releases. Hub-managed updates migrate config and roll back on failure; manual updates don't. Restore from [backup](/docs/operate/backup-and-restore/) and match binary versions to state.

## Still stuck

Each component's repo has issues open to the public — [github.com/nullclaw](https://github.com/nullclaw). Attach the output of the diagnostic tour above; it answers the first five questions anyone will ask.
