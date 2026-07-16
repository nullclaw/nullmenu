---
title: Backends
description: Records, agent memory and vector stores — what to compile in and how to configure each family.
order: 2
verified: v2026.06.09
---

NullPantry separates three storage roles: canonical records, agent memory, and vector indexes. Build-time selection controls what is compiled into the binary; runtime configuration controls which compiled backend is active.

## The three roles

| Role | What it holds | Backends |
| --- | --- | --- |
| `records` | Canonical Source, Artifact, MemoryAtom, Entity, Relation, ACL, lifecycle, feed | `sqlite` (default, vendored), `postgres` |
| `agent_memory` | Exact actor/session/key memory and session state | `memory_lru`, `markdown`, `redis`, `clickhouse`, `api`, vendor services, `holographic`, `none` |
| `vectors` | Rebuildable ANN indexes derived from canonical records | local SQLite, `pgvector`, `qdrant`, `lancedb`, `lancedb_http`, `weaviate`, `chroma`, `opensearch` |

Canonical text, provenance and ACLs always stay in the record store. Vector indexes and most memory runtimes are projections — they can be rebuilt, and retrieval re-filters everything through NullPantry ACLs.

## Compile what you need

```bash
# every adapter
zig build -Dengine-profile=full

# a production binary with only what you use
zig build \
  -Dengine-profile=custom \
  -Drecords=postgres \
  -Dagent-memory=redis,clickhouse,api \
  -Dvectors=pgvector
```

A runtime flag cannot activate a backend that was not compiled in.

## Records: SQLite or Postgres

SQLite is the default and needs nothing. Postgres is the production canonical store; it needs a database URL and `libpq` at runtime:

```bash
NULLPANTRY_DATABASE_URL='postgres://user:pass@host:5432/nullpantry' \
NULLPANTRY_TOKEN='prod-secret' \
NULLPANTRY_SCOPES='["admin"]' \
NULLPANTRY_CAPABILITIES='["read","write","propose","verify","delete","export","feed_apply"]' \
zig build run -- --backend postgres
```

## Agent memory runtimes

| Backend | Typical use | Minimal config |
| --- | --- | --- |
| `memory_lru` | process-local dev and tests | `NULLPANTRY_AGENT_MEMORY_BACKEND=memory_lru` |
| `markdown` | live NullClaw workspace files | `...BACKEND=markdown`, `NULLPANTRY_AGENT_MEMORY_MARKDOWN_WORKSPACE=/path` |
| `redis` | shared low-latency memory and sessions | `...BACKEND=redis`, `NULLPANTRY_REDIS_URL=redis://...` |
| `clickhouse` | durable event/history-oriented memory | `...BACKEND=clickhouse`, `NULLPANTRY_AGENT_MEMORY_CLICKHOUSE_URL=http://...` |
| `api` | federation to another NullPantry-compatible service | `...BACKEND=api`, `NULLPANTRY_AGENT_MEMORY_API_URL=https://...` |
| `holographic` | local associative recall | `...BACKEND=holographic`, `NULLPANTRY_AGENT_MEMORY_HOLOGRAPHIC_DB_PATH=...` |
| vendor profiles | Supermemory, OpenViking, Honcho, Mem0, Hindsight, RetainDB, ByteRover, Zep, FalkorDB | backend-specific URL/API-key variables |

Not every runtime does everything: Markdown live-reads and appends memory files but has no session or feed authority; vendor backends store exact memory but NullPantry re-filters their results through its own ACLs. Keep SQLite or Postgres as the canonical store regardless.

### Named stores

One service can route requests to several memory stores. Callers pass `store` or `stores` in the request:

```bash
export NULLPANTRY_AGENT_MEMORY_STORES='[
  {"name":"scratch","backend":"memory_lru"},
  {"name":"team","backend":"redis","redis_url":"redis://redis.internal:6379/1","key_prefix":"team-memory"},
  {"name":"remote-team","backend":"api","api_url":"https://pantry.remote/v1","api_token":"gateway","api_storage":"team:alpha"}
]'
```

Reserved route names include `primary`, `native`, `runtime`, `markdown`, `redis`, `clickhouse`, `api`, `all` and `federated`.

## Vector stores

| Backend | Required runtime config |
| --- | --- |
| local SQLite vectors | no external service |
| `pgvector` | `NULLPANTRY_VECTOR_BACKEND=pgvector`, `NULLPANTRY_PGVECTOR_URL` |
| `qdrant` | `NULLPANTRY_VECTOR_BACKEND=qdrant`, `NULLPANTRY_VECTOR_BASE_URL` or `NULLPANTRY_QDRANT_URL` |
| `lancedb` | `NULLPANTRY_VECTOR_BACKEND=lancedb`, `NULLPANTRY_LANCEDB_URI` |
| `lancedb_http` | `NULLPANTRY_VECTOR_BACKEND=lancedb_http`, `NULLPANTRY_LANCEDB_URL` |
| `weaviate` | `NULLPANTRY_VECTOR_BACKEND=weaviate`, `NULLPANTRY_WEAVIATE_URL` |
| `chroma` | `NULLPANTRY_VECTOR_BACKEND=chroma`, `NULLPANTRY_CHROMA_URL` |
| `opensearch` | `NULLPANTRY_VECTOR_BACKEND=opensearch`, `NULLPANTRY_OPENSEARCH_URL` |

Example with Qdrant:

```bash
NULLPANTRY_VECTOR_BACKEND=qdrant \
NULLPANTRY_VECTOR_BASE_URL='http://127.0.0.1:6333' \
NULLPANTRY_VECTOR_ALLOW_INSECURE_HTTP=true \
NULLPANTRY_VECTOR_COLLECTION='nullpantry_vectors' \
zig build run -- --db .nullpantry/dev.db
```

Named vector stores (`NULLPANTRY_VECTOR_STORES`) fan the vector outbox out to multiple sinks. Maintenance routes: `/v1/vector/status`, `/v1/vector/reconcile`, `/v1/vector/rebuild`, `/v1/vector/delete`, `/v1/vector/search`.

## Providers are optional

Without provider config, NullPantry uses deterministic local embeddings and extractive, citation-backed answers — fully offline. To plug in real models, set `NULLPANTRY_EMBEDDING_*` and `NULLPANTRY_LLM_*` for any OpenAI-compatible endpoint, with server-side fallback chains via `NULLPANTRY_EMBEDDING_FALLBACKS`.

> [!NOTE]
> Provider, vector, analytics, graph and agent-memory HTTP URLs must use HTTPS unless they are loopback or you explicitly allow insecure HTTP per backend.

## Contract tests

Each external backend has an opt-in contract suite you can run against a real service:

```bash
zig build postgres-contract
zig build redis-contract
zig build qdrant-contract
zig build pgvector-contract
zig build clickhouse-contract
zig build lancedb-contract
```
