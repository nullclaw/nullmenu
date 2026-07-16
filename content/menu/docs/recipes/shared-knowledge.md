---
title: Shared knowledge
description: Give agents a common, permission-aware memory with NullPantry.
order: 2
verified: v2026.06.09
---

By default each NullClaw instance keeps its own memory. This recipe moves long-term memory into NullPantry — a headless knowledge and memory server — so several agents share one larder: the same facts, the same knowledge graph, permission-aware retrieval with citations.

## Ingredients

- One or more NullClaw instances
- NullPantry — not hub-managed today, so it installs separately

> [!WARNING]
> NullPantry is early: one tagged release (v2026.06.09), and no license file yet. Read [the compatibility matrix](/docs/reference/compatibility-matrix/) before you build on it.

## 1. Start NullPantry

The published Docker image is the quickest route:

```bash
docker run --rm -p 8765:8765 \
  -e NULLPANTRY_TOKEN=dev-secret \
  ghcr.io/nullclaw/nullpantry:latest
```

Or from source (Zig 0.16.x; SQLite is vendored, nothing to install):

```bash
git clone https://github.com/nullclaw/nullpantry.git
cd nullpantry
zig build run -- --db .nullpantry/nullpantry.db
```

The server listens on `127.0.0.1:8765`. Confirm it is up and self-describing:

```bash
curl -H "Authorization: Bearer dev-secret" http://127.0.0.1:8765/v1/openapi.json
```

## 2. Point NullClaw at it

NullPantry exposes NullClaw-compatible agent-memory routes — `/v1/agent`, `/v1/memory`, `/v1/agent-memory`, `/v1/agent-sessions`. On the NullClaw side, memory engines are swappable, and one of the ten is an API backend: configure your instance's memory section to use it, with the pantry's base URL and bearer token.

The exact config walkthrough — including named stores, scoped sharing, and the feed/checkpoint/apply flow — lives in NullPantry's own guide: [`docs/nullclaw-memory-integration.md`](https://github.com/nullclaw/nullpantry/blob/main/docs/nullclaw-memory-integration.md). Follow it rather than guessing keys; the config surface is still moving pre-1.0.

Repeat for each agent that should share the store. Give each its own token: NullPantry supports per-token principals with distinct capabilities (read, propose, write, verify, delete, export, feed_apply), so a researcher agent can propose facts a reviewer agent must verify.

## 3. What you get

- **Shared memory.** Agents on different machines recall the same atoms and sessions.
- **Permission-aware retrieval.** An answer is only valid if every source, atom, relation and citation is visible to the requesting actor — the retrieval path enforces it.
- **Lifecycle, not deletion.** Knowledge moves through proposed → verified → accepted → stale → deprecated → superseded. Decisions are superseded, never silently erased, so agents can see why things changed.
- **Works offline.** Without any LLM provider configured, NullPantry uses deterministic local embeddings and extractive, citation-backed answers.

## Notes for operators

- Auth is not optional off-loopback: NullPantry refuses unauthenticated non-loopback binds and enforces HTTPS for remote backends.
- The default profile stores everything in a single SQLite file — back it up like any other component ([Backup and restore](/docs/operate/backup-and-restore/)).
- Backends are chosen at compile time (Postgres records, pgvector/Qdrant/LanceDB vectors, Redis memory and more) — the default build needs none of them.

Next course: give those knowledgeable agents actual work — [Durable backlog](/docs/recipes/durable-backlog/).
