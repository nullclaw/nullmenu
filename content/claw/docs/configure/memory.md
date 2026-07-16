---
title: Memory
description: Hybrid search over SQLite by default, nine other engines when you need them, and CLI tools to keep it clean.
order: 3
verified: v2026.5.29
---

Memory is what makes an agent more than a chat window. NullClaw ships ten memory engines behind one interface; the default is SQLite with hybrid search and needs no external services.

## The default: SQLite hybrid search

Out of the box, recall merges two signals:

| Layer | Implementation |
| --- | --- |
| Keyword search | FTS5 virtual tables with BM25 scoring |
| Vector search | Embeddings stored as BLOBs in SQLite, cosine similarity |
| Merge | Weighted combination — you set the weights |
| Embeddings | `EmbeddingProvider` vtable: OpenAI, custom URL, or noop |
| Hygiene | Automatic archival and purge of stale memories |
| Snapshots | Export/import full memory state for migration |

Configure it in the `memory` section:

```json
{
  "memory": {
    "backend": "sqlite",
    "auto_save": true,
    "embedding_provider": "openai",
    "vector_weight": 0.7,
    "keyword_weight": 0.3,
    "hygiene_enabled": true,
    "snapshot_enabled": false
  }
}
```

## The other nine engines

Swap `backend` and nothing else changes: `markdown`, `clickhouse`, `postgres`, `redis`, `lancedb`, `lucid`, `memory` (an in-process LRU), `api`, or `none`. Markdown keeps memory as plain files you can read and edit; `api` delegates to a remote memory service — this is how [NullPantry](https://pantry.nullmenu.ai/) can serve as a shared, permission-aware memory backend for a fleet of agents; `none` turns memory off entirely.

## Working with memory from the CLI

```bash
nullclaw memory stats                       # resolved config and counters
nullclaw memory count                       # total entries
nullclaw memory search "query" --limit 10   # run retrieval
nullclaw memory get <key>                   # one entry
nullclaw memory list --category task --limit 20
nullclaw memory reindex                     # rebuild the vector index
nullclaw memory forget <key>                # delete one entry
```

## Exporting safely

`export-jsonl` produces a governed dataset — one JSON object per line with a stable schema (`schema_version`, `key`, `category`, `timestamp`, `session_id`, `content`):

```bash
nullclaw memory export-jsonl --limit 1000
```

Content is **PII-redacted by default** — emails, phones, card numbers and token patterns become deterministic placeholders like `[EMAIL_1]`. Bootstrap and autosave internals are excluded unless you pass `--include-internal`. Use `--include-pii` only for trusted local exports.

## Keeping it tidy

Before any cleanup, run the duplicate report — it is always a dry run:

```bash
nullclaw memory hygiene-report --json
```

It reports exact duplicates and normalized duplicates (case and whitespace differences) without deleting or rewriting anything. `nullclaw memory drain-outbox` flushes the durable vector outbox queue if embedding sync fell behind.

## Per-agent memory namespaces

Named agent profiles with their own `workspace_path` also get a durable memory namespace of the form `agent:<agent-id>`. Two agents can share a model but keep separate notes — used by `nullclaw agent --agent <id>`, `/subagents spawn --agent <id>`, and sessions routed through `bindings`. See [Configuration](/docs/configure/configuration/).

> [!TIP]
> Workspace bootstrap files (`AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `MEMORY.md`) are separate from the memory engine. Edit them with `nullclaw workspace edit <file>`; that command works with file-based backends such as `markdown` and `hybrid`.

## Next

Memory sorted — put the agent to work long-term in [Gateway and service](/docs/operate/gateway-and-service/).
