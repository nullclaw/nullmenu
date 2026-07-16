---
title: APIs and OpenAPI
description: HTTP surfaces, self-describing schemas, and agent protocols across the stack.
order: 3
verified: v2026.5.29
---

Everything in the family speaks JSON over HTTP/1.1, and the services agents talk to describe themselves: point a client at the schema endpoint and it can bootstrap without docs. This page lists what serves what, where.

## Self-describing services

| Service | Schema endpoint | Spec |
| --- | --- | --- |
| NullTickets | `GET /openapi.json`, also `/.well-known/openapi.json` | OpenAPI 3.1 |
| NullPantry | `GET /v1/openapi.json` | OpenAPI manifest |
| NullBoiler | `docs/openapi.yaml` in the repo | OpenAPI 3.1, 30+ endpoints |

NullTickets is explicit about the intent: agents are expected to fetch the schema and figure out the API themselves. The server documents itself to its own users.

## Endpoint summaries

### NullTickets (`:7700`)

Pipelines (FSM definitions), tasks and bulk creation, cursor-paginated listing, lease claiming (`POST /leases/claim`), run events and artifacts, a namespaced KV store with FTS5 search, plus:

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Service health |
| `GET /ops/queue` | Per-role queue stats |
| `POST /v1/traces`, `/otlp/v1/traces` | OTLP trace ingest, span-to-task linkage via `nulltickets.run_id` / `nulltickets.task_id` attributes |

Run mutations require the Bearer lease token issued at claim time.

### NullWatch (`127.0.0.1:7710`)

| Endpoint | Purpose |
| --- | --- |
| `POST /v1/spans`, `/v1/spans/bulk` | Native span ingest |
| `POST /v1/evals` | Eval result ingest |
| `GET /v1/runs`, `/v1/runs/:id` | Run summaries and detail |
| `GET /v1/capabilities` | Feature discovery |
| `POST /v1/traces`, `/otlp/v1/traces` | OTLP/HTTP JSON trace ingest |
| `GET /health` | Service health |

### NullBoiler (`:8080`)

Runs, workflows, workers, checkpoints, streams and tracker endpoints — 30+ in total, per the OpenAPI 3.1 spec. Stream snapshots come in 5 modes (`values`, `updates`, `tasks`, `debug`, `custom`) with `after_seq` cursors; `/metrics` serves Prometheus. Creating a run:

```bash
curl -sS -X POST http://127.0.0.1:8080/runs \
  -H 'Content-Type: application/json' \
  -d '{"input": {...}, "steps": [...]}'
```

### NullPantry (`127.0.0.1:8765`)

Retrieval: `/v1/search`, `/v1/ask`, `/v1/context-packs`, `/v1/vector/*`. Agent memory, NullClaw-compatible: `/v1/agent`, `/v1/memory`, `/v1/agent-memory`, `/v1/agent-sessions`. All retrieval runs one shared path: ACL filter → keyword + vector candidates → graph expansion → fusion/rerank → citation-safe results.

### NullHub (`:19800`)

The dashboard's own API, reachable from the CLI without writing a client:

```bash
nullhub api GET /api/... --pretty
```

The hub also reverse-proxies its managed neighbors — `/api/nullboiler/*`, `/api/nulltickets/store/*`, `/api/nullwatch/*` — so browser UIs reach loopback-bound services through one origin. Managed NullClaw instances get instance-scoped admin routes (status, config, models, cron, channels, skills).

### NullClaw gateway (`127.0.0.1:3000`)

The gateway's HTTP API is documented in NullClaw's own [`gateway-api` docs](https://claw.nullmenu.ai/). Live log streaming from the hub side uses SSE.

## Agent protocols

Beyond plain REST, three protocols matter for interop:

| Protocol | Where | Use |
| --- | --- | --- |
| A2A v0.3.0 (Google's agent-to-agent JSON-RPC) | NullClaw implements it; NullBoiler dispatches over it | Agent-to-agent and orchestrator-to-agent calls |
| ACP (Agent Client Protocol, stdio JSON-RPC) | `nullclaw acp`; NullDesk drives NullClaw with it | Editor and desk integrations |
| MCP (stdio and HTTP) | NullClaw as client | Attaching external tool servers |

NullBoiler additionally dispatches to workers over `webhook`, `api_chat` and `openai_chat` (any OpenAI-compatible gateway), plus async MQTT and Redis Streams.

> [!TIP]
> The OTLP overlap is deliberate: NullWatch and NullTickets both accept OTLP/HTTP JSON. Send traces to NullWatch for observability, to NullTickets for task linkage — or to both.
