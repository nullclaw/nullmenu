---
title: Install
description: Run NullPantry from the published Docker image or build it from source with Zig 0.16.0.
order: 1
verified: v2026.06.09
---

NullPantry is a single HTTP service. You can run the published container image or build the binary yourself — either way you end up with a server on port 8765 and a local SQLite database, no external services required.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. The repo has no license file yet.

## Requirements

- Zig `0.16.0` (or a compatible `0.16.x`) — only if you build from source.
- No system SQLite. It is vendored under `vendor/sqlite3`.
- Optional `libpq` at runtime, only if you use the Postgres record store.
- Other services (Redis, Qdrant, ClickHouse, …) are needed only when you enable the matching backend. See [Backends](/docs/guides/backends/).

## Docker

Tagged releases publish a multi-architecture image to GHCR:

```bash
docker pull ghcr.io/nullclaw/nullpantry:latest
docker pull ghcr.io/nullclaw/nullpantry:v2026.06.09
```

Run it with a token and a volume for state:

```bash
docker run --rm \
  -p 8765:8765 \
  -e NULLPANTRY_TOKEN=dev-secret \
  -v nullpantry-data:/var/lib/nullpantry \
  ghcr.io/nullclaw/nullpantry:latest
```

The image runs as a non-root user, keeps local state under `/var/lib/nullpantry`, and listens on `0.0.0.0:8765` so Docker port publishing works.

> [!WARNING]
> Non-loopback binds require authentication. Provide `NULLPANTRY_TOKEN` or `NULLPANTRY_TOKEN_PRINCIPALS`, or the server refuses to start unless you deliberately set `NULLPANTRY_ALLOW_NO_AUTH_NON_LOOPBACK=true` for a trusted local-only environment.

## Build from source

```bash
zig build
zig build test
zig build run -- --db .nullpantry/nullpantry.db
```

The default profile is `nullclaw`: SQLite records, Markdown compatibility, `memory_lru` in-process memory. It is what you want for local development and for pairing with [NullClaw](https://claw.nullmenu.ai/).

## Engine profiles

Backend selection happens at compile time. A runtime flag cannot activate a backend that was not compiled into the binary — the pantry only holds what you stocked it with.

| Profile | Use when | Includes |
| --- | --- | --- |
| `nullclaw` | Default local development, NullClaw compatibility | SQLite records, Markdown compat, `memory_lru`, `none` |
| `minimal` | Small local smoke binaries | SQLite records, `memory_lru`, `none` |
| `full` | Integration and release validation | Every record, memory, vector, graph, analytics and provider adapter |
| `custom` | Production-specific binaries | Only the explicit `-Drecords`, `-Dagent-memory`, `-Dvectors` choices |

```bash
zig build -Dengine-profile=minimal
zig build -Dengine-profile=full
zig build -Dengine-profile=custom -Drecords=postgres -Dagent-memory=redis -Dvectors=qdrant
```

## Verify the build

```bash
# fast local feedback
zig build test

# full local API/storage/runtime suite
zig build test-local --summary all

# one area while developing
zig build test-api
zig build test-agent-memory
zig build test-vector
```

Next: [Quickstart](/docs/start/quickstart/) to run the server and make your first request.
