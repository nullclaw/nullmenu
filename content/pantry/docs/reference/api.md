---
title: API
description: Route groups, auth model, runtime flags and environment variables.
order: 1
verified: v2026.06.09
---

NullPantry is self-describing: a running instance publishes its full OpenAPI manifest at `/v1/openapi.json`. Request dispatch, that OpenAPI document, and the SDK manifest at `/v1/sdk/manifest` are all generated from one route catalog — 197 paths and 279 method-operation pairs, every one served under `/v1` — so this page is the map, and the running server is the territory.

```bash
curl -sS -H 'Authorization: Bearer dev-token' http://127.0.0.1:8765/v1/openapi.json
```

## Route groups

| Workflow | Routes |
| --- | --- |
| Discovery | `/v1/health`, `/v1/capabilities`, `/v1/engines`, `/v1/providers`, `/v1/connectors`, `/v1/artifact-types`, `/v1/openapi.json` |
| Knowledge records (full CRUD) | `/v1/sources`, `/v1/artifacts`, `/v1/memory-atoms`, `/v1/entities` (+ `/resolve`), `/v1/relations`, `/v1/spaces`, `/v1/policy-scopes` |
| Retrieval and context | `/v1/search`, `/v1/ask`, `/v1/retrieval/plan`, `/v1/retrieval/search`, `/v1/context-packs` |
| Knowledge graph | `/v1/graph/schema`, `/v1/graph/query`, `/v1/graph/neighbors`, `/v1/graph/path` |
| Memory verbs | `/v1/remember`, `/v1/forget`, `/v1/verify`, `/v1/mark-stale`, `/v1/supersede`, plus `/v1/memory/*` (store, get, search, update, delete, hygiene, reindex, feed, checkpoint, apply, context-block, prefetch, curated, session-search, providers/{name}/tools) |
| Native agent memory and sessions | `/v1/agent-memory` (+ `/{key}`, `/search`, `/count`), `/v1/agent-sessions/{id}/` messages, usage, terminate, compact |
| NullClaw-compatible aliases | `/v1/agent/*` plus bare `/v1/memories`, `/v1/sessions`, `/v1/history` — compiled in via `-Denable-nullclaw-adapter` (on by default) |
| Vector plane | `/v1/vector/` status, embed, upsert, search, delete, rebuild, reconcile, outbox, outbox/run |
| Jobs and workers | `/v1/jobs`, `/v1/jobs/{id}/run`, `/v1/workers/run` — 12 durable job classes drained by the background worker |
| Feeds | `/v1/feed/*` and `/v1/memory/` feed, events, status, compact, checkpoint, apply |
| Lifecycle plane | `/v1/lifecycle/` diagnostics, stats, migrate, import-brain-db, export-jsonl, snapshot/*, hydrate, lucid/*, analytics/*, cache/*, semantic-cache/*, embedding-cache/*, hygiene, summarize, compact-session, rollout |
| Connectors | `/v1/connectors/{name}/ingest`, `/v1/connectors/{name}/cursor`, `/v1/connectors/qmd/export-sessions`, `/v1/connectors/qmd/prune-sessions` |
| Markdown and prompts | `/v1/markdown/import`, `/v1/markdown/export` (+ `-directory` variants), `/v1/bootstrap/prompts/*` |

Retrieval routes share one pipeline: actor claims → ACL filter → keyword and/or vector candidates (the strategy — keyword-only, vector-only or hybrid — is chosen per query) → reciprocal-rank fusion → optional LLM rerank → citation-safe results. A response is only valid if every cited source, atom, relation and chunk is visible to the requesting actor. Retrieval rollout policies (`/v1/lifecycle/rollout`) can canary or shadow a new configuration on a percentage of traffic.

### Vector maintenance

`/v1/vector/status`, `/v1/vector/embed`, `/v1/vector/upsert`, `/v1/vector/search`, `/v1/vector/delete`, `/v1/vector/rebuild`, `/v1/vector/reconcile`, `/v1/vector/outbox`, `/v1/vector/outbox/run`.

### Diagnostics

```bash
curl -sS -H 'Authorization: Bearer prod-secret' http://127.0.0.1:8765/v1/health
curl -sS -H 'Authorization: Bearer prod-secret' http://127.0.0.1:8765/v1/vector/status
```

Status routes also exist for optional projections: `/v1/lifecycle/analytics/status`, `/v1/lifecycle/lucid/status`.

## Auth model

Authentication is bearer-token. A token maps to a principal: an `actor_id`, a set of scopes, and a set of capabilities.

Capabilities (7): `read`, `propose`, `write`, `verify`, `delete`, `export`, `feed_apply`.

Read and write scopes are separate — `project:nullpantry` does not imply `write:project:nullpantry`. Single-token setups use `NULLPANTRY_TOKEN` + `NULLPANTRY_SCOPES` + `NULLPANTRY_CAPABILITIES`; multi-actor setups use `NULLPANTRY_TOKEN_PRINCIPALS`. See [NullClaw memory](/docs/guides/nullclaw-memory/) for principal examples.

Without any token configured, the server refuses to bind a non-loopback address; `--allow-no-auth-non-loopback` is the deliberate override.

Request headers `X-NullPantry-Actor-Id`, `X-NullPantry-Actor-Scopes` and `X-NullPantry-Actor-Capabilities` can narrow a token's permissions, never widen them.

> [!DANGER]
> `--trust-actor-headers` (or `NULLPANTRY_TRUST_ACTOR_HEADERS=1`) tells the server to believe actor headers outright. It exists for a trusted internal auth gateway only — never enable it on an exposed instance.

## Hard limits

Fixed server-side defaults: 2 MB max request body, 64 KB max headers, 128 concurrent connections, 30-second socket timeouts. Outbound provider URLs must be HTTPS unless the host is local or insecure HTTP is explicitly allowed, and per-provider circuit breakers guard embedding and LLM calls.

## Runtime flags

Roughly 150 `--flags` exist; `zig build run -- --help` is the authoritative list. A flag missing its value is a hard error. The common ones:

| Flag | Purpose |
| --- | --- |
| `--host`, `--port`, `--instance-id` | Bind address and instance id (default `127.0.0.1:8765`) |
| `--db PATH`, `--db-path PATH` | SQLite records path (default `.nullpantry/nullpantry.db`) |
| `--backend`, `--records-backend` | Canonical record store: `sqlite` or `postgres` (with `--postgres-url`) |
| `--config PATH`, `-c PATH` | Load a strict JSON config file |
| `--home PATH` | Keep all default local files under one directory (derives `nullpantry.json`, `nullpantry.db`, `files/`, `markdown/`) |
| `--token`, `--token-principals` | Bearer token, or JSON map of tokens to principals |
| `--agent-memory-backend NAME` | Select the active compiled memory runtime (per-vendor flags like `--redis-url`, `--mem0-api-key`, `--zep-graph-id` alongside) |
| `--vector-backend`, `--vector-store` | Select the vector backend and named stores (`--pgvector-url`, `--qdrant`-style `--vector-base-url`, `--lancedb-uri`, …) |
| `--chunk-strategy` | `auto`, `plain`, `markdown`, `transcript` or `code` (with `--chunk-max-chars`, `--chunk-overlap-chars`) |
| `--trust-actor-headers` | Trust actor headers (gateway deployments only) |
| `--allow-no-auth-non-loopback` | Permit unauthenticated non-loopback binds (deliberate opt-in) |

## Environment variables

212 distinct `NULLPANTRY_*` variables are recognised, parsed against a compile-time allowlist. Precedence: config file < environment < CLI flags. `NULLPANTRY_HOME` and `NULLPANTRY_CONFIG` select paths before the config file is loaded, so they must come from the real process environment or a CLI flag.

| Variable | Purpose |
| --- | --- |
| `NULLPANTRY_TOKEN` | Single bearer token |
| `NULLPANTRY_SCOPES`, `NULLPANTRY_CAPABILITIES` | Scopes/capabilities for the single token (JSON arrays) |
| `NULLPANTRY_TOKEN_PRINCIPALS` | JSON map of token → `{actor_id, scopes, capabilities}` |
| `NULLPANTRY_HOME` | Directory for all default local files |
| `NULLPANTRY_CONFIG` | Path to the JSON config file |
| `NULLPANTRY_HOST`, `NULLPANTRY_PORT` | Bind address |
| `NULLPANTRY_DB_PATH` | SQLite records path |
| `NULLPANTRY_RECORDS_BACKEND` | `sqlite` or `postgres` |
| `NULLPANTRY_DATABASE_URL` | Postgres URL for canonical records |
| `NULLPANTRY_LIBPQ_PATH` | Path to a `libpq` to load at runtime (Postgres has no compile-time dependency) |
| `NULLPANTRY_POSTGRES_POOL_SIZE` | Postgres connection pool size |
| `NULLPANTRY_AGENT_MEMORY_BACKEND` | Active memory runtime (`memory_lru`, `markdown`, `redis`, …) |
| `NULLPANTRY_REDIS_URL` | Redis URL for the `redis` memory runtime |
| `NULLPANTRY_VECTOR_BACKEND` | Active vector backend (`pgvector`, `qdrant`, …) |
| `NULLPANTRY_EMBEDDING_*`, `NULLPANTRY_LLM_*` | Optional OpenAI-compatible providers |
| `NULLPANTRY_WORKER_INTERVAL_MS`, `NULLPANTRY_WORKER_SCOPES`, `NULLPANTRY_WORKER_CAPABILITIES` | Background worker tuning (default interval 5000 ms) |
| `NULLPANTRY_TRUST_ACTOR_HEADERS` | Trust actor headers (gateway only) |
| `NULLPANTRY_ALLOW_NO_AUTH_NON_LOOPBACK` | Allow unauthenticated non-loopback binds |

Per-backend variables (`NULLPANTRY_QDRANT_URL`, `NULLPANTRY_MEM0_API_KEY`, …) are listed in [Backends](/docs/guides/backends/).

## Config file shape

The file is `--config PATH` / `NULLPANTRY_CONFIG`, or `nullpantry.json` inside `--home` / `NULLPANTRY_HOME`. Recognised sections: `server`, `storage`, `auth`, `actor`, `worker`, `filesystem`, `provider`, `retrieval`, `chunker`, `agent_memory`, `vector`, `graph`, `analytics`, `lucid`. Sections are strict — unknown keys or wrong types fail at startup:

```json
{
  "server": { "host": "127.0.0.1", "port": 8765 },
  "storage": { "backend": "postgres", "postgres_url": "postgres://user:pass@host:5432/nullpantry" },
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
  "vector": { "backend": "pgvector", "pgvector": { "url": "postgres://host/nullpantry_vectors" } }
}
```

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Treat `/v1/openapi.json` from your running version as the source of truth.
