---
title: Web dashboard
description: The embedded UI — status cards, config editors, logs, component pages, Mission Control.
order: 2
verified: v2026.5.29
---

The dashboard is a SvelteKit app compiled into the NullHub binary with `@embedFile` — no separate frontend to deploy, nothing fetched from a CDN. It serves at `http://nullhub.localhost:19800` (or `nullhub.local:19800` when Bonjour/avahi is available, `127.0.0.1:19800` as the last resort).

## The core pages

**Status cards.** Every instance gets a card fed by periodic HTTP health checks (default interval 15 s, set per component in its manifest). Start, stop, and restart from the card.

**Install Component.** The same manifest-driven wizard as `nullhub install`, in the browser — component-aware steps, secrets, conditional fields.

**Config editors.** Structured editors for NullClaw, NullBoiler, NullTickets and NullWatch, plus direct raw JSON editing when the structured view doesn't cover what you need. The CLI equivalent is `nullhub config <c>/<n> --edit`.

**Logs.** Live per-instance log streaming over SSE — the browser twin of `nullhub logs <c>/<n> -f`.

## Component UIs

These pages render other components' data through NullHub's local reverse proxies. Nothing is sent to hosted services.

| Page | Backed by | What it shows |
| --- | --- | --- |
| NullBoiler | `/api/nullboiler/*` proxy | Workflow editor, poll-based run monitoring, checkpoint forking, encoded workflow/run links |
| NullTickets Store | `/api/nulltickets/store/*` proxy | Key-value store browser |
| NullWatch Flight Recorder | `/api/nullwatch/*` proxy | Run summaries, span timelines, eval results, token usage, cost, error context |
| Mission Control | `/api/mission-control/*` | Deterministic local mission replay with live telemetry |

The proxies target managed instances automatically; environment variables override them for external instances:

| Variable | Purpose |
| --- | --- |
| `NULLBOILER_URL`, `NULLBOILER_TOKEN` | NullBoiler REST API target (e.g. `http://localhost:8080`) and optional bearer token |
| `NULLTICKETS_URL`, `NULLTICKETS_TOKEN` | NullTickets store target and optional token |
| `NULLWATCH_URL`, `NULLWATCH_TOKEN` | Override the managed NullWatch instance target and token |
| `NULLHUB_ALLOWED_ORIGINS` | Comma-separated extra CORS origins for the server |

## Mission Control

A control room for watching an agent mission fail and recover — reset, launch, failure hold, checkpoint fork, recovered replay — driven by a versioned, embedded replay fixture. It needs no hosted infrastructure and no model secrets, and it hydrates with real NullBoiler workflow evidence and NullWatch trace detail when matching local instances are running. Timeline events carry trace chips that deep-link into the Flight Recorder (`/nullwatch?run_id=...`).

Export the current replay as a portable JSON artifact:

```bash
curl -fsS http://127.0.0.1:19800/api/mission-control/replay \
  -o mission-control-replay.json
```

The **Save Replay** button does the same and additionally stores a durable copy under `~/.nullhub/mission-control/replays/`.

## Access from another machine

By default the server answers local origins only. To reach the dashboard across your tailnet or LAN, pass extra origins explicitly:

```bash
nullhub serve --host 0.0.0.0 --port 19800 --allowed-origin https://hub.your-tailnet.ts.net
```

> [!WARNING]
> NullHub supervises processes and edits their config. If you bind it beyond localhost, put it behind something you trust — bearer-token auth exists (`src/auth.zig`) but is optional.
