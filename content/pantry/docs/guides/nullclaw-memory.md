---
title: NullClaw memory
description: Connect one or many NullClaw agents to NullPantry as their remote memory backend.
order: 1
verified: v2026.06.09
---

NullClaw stays small: local execution and baseline local memory. NullPantry owns shared state — cross-agent memory, sessions, permissions, retrieval. This guide connects the two.

## The recommended path

Point NullClaw's `api` memory engine at the NullPantry adapter namespace:

```text
url       = http://127.0.0.1:8765
namespace = /v1/agent
token     = <agent bearer token>
```

Use the config syntax of your current [NullClaw](https://claw.nullmenu.ai/) release, but keep these values. `/v1/agent` is the deterministic NullClaw adapter: it exposes the CRUD, list, search, session, history, feed, checkpoint and apply surface that NullClaw `ApiMemory` expects.

> [!WARNING]
> Do not point a NullClaw feed client at root `/v1/feed`. That feed is broader than agent memory — it includes Source, Artifact, MemoryAtom, Entity, Relation, lifecycle and policy events.

## Three memory surfaces

| Surface | Best use | Notes |
| --- | --- | --- |
| `/v1/agent` | NullClaw `api` memory engine | Recommended. Memory, sessions, history, feed, checkpoint, apply. |
| `/v1/memory` | NullClaw CLI-shaped commands, migration tools | Command-style `store`, `get`, `list`, `search`, `delete`, `export-jsonl`. |
| `/v1/agent-memory` + `/v1/agent-sessions` | Native NullPantry agent API | Actor-aware APIs for NullHub, gateways, custom agents. |

All three share the same actor-aware core: ownership, ACL filtering and backend routing behave identically.

## One local agent

The default build profile already matches NullClaw's local baseline. Run with in-process memory:

```bash
export NULLPANTRY_TOKEN_PRINCIPALS='{
  "local-agent-token": {
    "actor_id": "agent:local",
    "scopes": ["session:*","write:session:*","public","write:public"],
    "capabilities": ["read","write","propose","delete","feed_apply"]
  }
}'

zig build run -- \
  --db .nullpantry/nullpantry.db \
  --agent-memory-backend memory
```

Give NullClaw the token, and its memory now lives in the pantry.

## Many agents, one service

Use one token principal per agent. Each token binds a bearer token to an `actor_id`, scopes and capabilities:

```bash
export NULLPANTRY_TOKEN_PRINCIPALS='{
  "agent-a-token": {
    "actor_id": "agent:a",
    "scopes": ["session:*","write:session:*","team:alpha","write:team:alpha"],
    "capabilities": ["read","write","propose","delete","feed_apply"]
  },
  "agent-b-token": {
    "actor_id": "agent:b",
    "scopes": ["session:*","write:session:*","team:alpha","write:team:alpha","family:home","write:family:home"],
    "capabilities": ["read","write","propose","delete","feed_apply"]
  }
}'
```

The scope rules:

- Omitted `scope` on a write creates memory **private** to the token's actor. The same key can exist once per actor without collision.
- Explicit `scope` creates **shared** memory owned as `shared:<scope>` — for example `shared:team:alpha`. Every participant needs the read scope, and `write:<scope>` to write. Shared rows stay auditable through `created_by_actor_id`.
- Read and write scopes are separate: `team:alpha` does not imply `write:team:alpha`.
- Session memory needs `session:<id>` or `session:*` to read and the `write:` variants to write.
- `GET` without `scope` prefers the caller's private row when a private and a shared row share a key.

For a durable multi-agent setup, put canonical records in Postgres and runtime memory in Redis — see [Backends](/docs/guides/backends/) for the exact environment variables.

## Actor headers

Requests can carry `X-NullPantry-Actor-Id`, `X-NullPantry-Actor-Scopes` and `X-NullPantry-Actor-Capabilities` to *narrow* what a token may do. Headers can never escalate scopes or spoof a token-bound actor. `--trust-actor-headers` is only for a trusted internal auth gateway — never for direct exposure.

## Beyond exact memory

Once agents write memory here, the rest of the pantry is available on the same ACL model: `/v1/search`, `/v1/ask` and `/v1/context-packs` can serve citation-backed context that includes sources, artifacts, memory atoms, graph relations and visible runtime memory. See the [API reference](/docs/reference/api/) for the route groups.
