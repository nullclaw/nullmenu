---
title: API
description: Route groups, auth model, runtime flags and environment variables.
order: 1
verified: v2026.06.09
---

NullPantry is self-describing: a running instance publishes its full OpenAPI manifest at `/v1/openapi.json`. This page is the map — route groups, the auth model, and the configuration surface.

```bash
curl -sS -H 'Authorization: Bearer dev-token' http://127.0.0.1:8765/v1/openapi.json
```

## Route groups

| Workflow | Routes |
| --- | --- |
| NullClaw-compatible memory | `/v1/agent`, `/v1/memory` |
| Native agent memory and sessions | `/v1/agent-memory`, `/v1/agent-sessions` |
| Source-backed knowledge | sources, artifacts, memory atoms, entities, relations, lifecycle routes |
| Retrieval and context | `/v1/search`, `/v1/ask`, `/v1/context-packs`, `/v1/vector/*` |
| Prompt bootstrap | `/v1/bootstrap/prompts` |
| QMD ingestion | `/v1/connectors/qmd/ingest` |
| Provider metadata | `/v1/providers` |
| Manifest | `/v1/openapi.json` |

Retrieval routes share one pipeline: actor claims → ACL filter → keyword + vector candidates → graph expansion → fusion/rerank → citation-safe results. A response is only valid if every cited source, atom, relation and chunk is visible to the requesting actor.

### Vector maintenance

`/v1/vector/status`, `/v1/vector/reconcile`, `/v1/vector/rebuild`, `/v1/vector/delete`, `/v1/vector/search`.

### Diagnostics

```bash
curl -sS -H 'Authorization: Bearer prod-secret' http://127.0.0.1:8765/v1/agent/health
curl -sS -H 'Authorization: Bearer prod-secret' http://127.0.0.1:8765/v1/vector/status
```

Status routes also exist for optional projections: `/v1/lifecycle/analytics/status`, `/v1/lifecycle/lucid/status`.

## Auth model

Authentication is bearer-token. A token maps to a principal: an `actor_id`, a set of scopes, and a set of capabilities.

Capabilities (7): `read`, `propose`, `write`, `verify`, `delete`, `export`, `feed_apply`.

Read and write scopes are separate — `project:nullpantry` does not imply `write:project:nullpantry`. Single-token setups use `NULLPANTRY_TOKEN` + `NULLPANTRY_SCOPES` + `NULLPANTRY_CAPABILITIES`; multi-actor setups use `NULLPANTRY_TOKEN_PRINCIPALS`. See [NullClaw memory](/docs/guides/nullclaw-memory/) for principal examples.

Request headers `X-NullPantry-Actor-Id`, `X-NullPantry-Actor-Scopes` and `X-NullPantry-Actor-Capabilities` can narrow a token's permissions, never widen them.

> [!DANGER]
> `--trust-actor-headers` (or `NULLPANTRY_TRUST_ACTOR_HEADERS=1`) tells the server to believe actor headers outright. It exists for a trusted internal auth gateway only — never enable it on an exposed instance.

## Runtime flags

Use `zig build run -- --help` for the authoritative list. The common ones:

| Flag | Purpose |
| --- | --- |
| `--host`, `--port` | Bind address (default `127.0.0.1:8765`) |
| `--db PATH` | SQLite records path (default `.nullpantry/nullpantry.db`) |
| `--backend postgres` | Use the Postgres canonical record store |
| `--config PATH`, `-c PATH` | Load a strict JSON config file |
| `--home PATH` | Keep all default local files under one directory |
| `--agent-memory-backend NAME` | Select the active compiled memory runtime |
| `--agent-memory-store JSON` | Add a named memory store (repeatable) |
| `--vector-collection NAME` | Vector collection/table name |
| `--trust-actor-headers` | Trust actor headers (gateway deployments only) |
| `--allow-no-auth-non-loopback` | Permit unauthenticated non-loopback binds (deliberate opt-in) |

## Environment variables

Everything below can also live in the JSON config file (structured sections, or exact keys under `env`) — except `NULLPANTRY_HOME` and `NULLPANTRY_CONFIG`, which select paths before the config file is loaded and must come from the real process environment or a CLI flag. Precedence: defaults < home defaults < config file < environment < CLI flags.

| Variable | Purpose |
| --- | --- |
| `NULLPANTRY_TOKEN` | Single bearer token |
| `NULLPANTRY_SCOPES`, `NULLPANTRY_CAPABILITIES` | Scopes/capabilities for the single token (JSON arrays) |
| `NULLPANTRY_TOKEN_PRINCIPALS` | JSON map of token → `{actor_id, scopes, capabilities}` |
| `NULLPANTRY_HOME` | Directory for all default local files |
| `NULLPANTRY_CONFIG` | Path to the JSON config file |
| `NULLPANTRY_RECORDS_BACKEND` | `sqlite` or `postgres` |
| `NULLPANTRY_DATABASE_URL` | Postgres URL for canonical records |
| `NULLPANTRY_AGENT_MEMORY_BACKEND` | Active memory runtime (`memory_lru`, `markdown`, `redis`, …) |
| `NULLPANTRY_AGENT_MEMORY_STORES` | JSON array of named memory stores |
| `NULLPANTRY_REDIS_URL` | Redis URL for the `redis` memory runtime |
| `NULLPANTRY_VECTOR_BACKEND` | Active vector backend (`pgvector`, `qdrant`, …) |
| `NULLPANTRY_VECTOR_STORES` | JSON array of named vector sinks |
| `NULLPANTRY_EMBEDDING_*`, `NULLPANTRY_LLM_*` | Optional OpenAI-compatible providers |
| `NULLPANTRY_WORKER_INTERVAL_MS`, `NULLPANTRY_WORKER_SCOPES`, `NULLPANTRY_WORKER_CAPABILITIES` | Background worker tuning |
| `NULLPANTRY_TRUST_ACTOR_HEADERS` | Trust actor headers (gateway only) |
| `NULLPANTRY_ALLOW_NO_AUTH_NON_LOOPBACK` | Allow unauthenticated non-loopback binds |

Per-backend variables (`NULLPANTRY_QDRANT_URL`, `NULLPANTRY_MEM0_API_KEY`, …) are listed in [Backends](/docs/guides/backends/).

## Config file shape

Structured sections are strict — unknown fields or wrong types fail at startup:

```json
{
  "server": { "host": "127.0.0.1", "port": 8765 },
  "records": { "backend": "postgres", "postgres_url": "postgres://user:pass@host:5432/nullpantry" },
  "auth": {
    "token_principals": {
      "agent-a-token": {
        "actor_id": "agent:a",
        "scopes": ["project:nullpantry", "write:project:nullpantry"],
        "capabilities": ["read", "write", "propose", "delete"]
      }
    }
  },
  "agent_memory": { "backend": "redis", "redis": { "url": "redis://redis.internal:6379/0" } },
  "vector": { "backend": "pgvector", "pgvector": { "url": "postgres://host/nullpantry_vectors" } },
  "env": { "NULLPANTRY_VECTOR_TIMEOUT_SECS": 10 }
}
```

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Treat `/v1/openapi.json` from your running version as the source of truth.
