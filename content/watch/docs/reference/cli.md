---
title: CLI
description: Every NullWatch command — serve, query, ingest, demo-seed — with flags and examples.
order: 2
verified: v2026.5.29
---

The CLI covers local automation and scripting: it starts the server, queries stored data directly (no server required), and ingests spans and evals by hand. Examples use `zig build run --` as the README does; with a prebuilt binary, call it directly instead.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Commands

| Command | Purpose |
| --- | --- |
| `serve` | Run the JSON HTTP API server |
| `summary` | Print the aggregate summary |
| `runs` | List runs |
| `run <run-id>` | Inspect one run in detail |
| `spans` | List spans |
| `evals` | List evals |
| `ingest-span --json '<span>'` | Ingest one span |
| `ingest-eval --json '<eval>'` | Ingest one eval |
| `demo-seed` | Seed deterministic local demo data |
| `--export-manifest` | Print a NullHub manifest |
| `--from-json '<config>'` | Bootstrap config from wizard answers |

## serve

```bash
zig build run -- serve
```

Defaults to `127.0.0.1:7710`. To bind elsewhere:

```bash
zig build run -- serve --host 0.0.0.0 --port 7710
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--host` | `127.0.0.1` | Interface to bind |
| `--port` | `7710` | Port to listen on |

> [!WARNING]
> Binding `0.0.0.0` exposes the API beyond your machine. Set `api_token` in the config first — see [HTTP API](/docs/reference/api/).

## Query commands

All query commands read the local JSONL store under `~/.nullwatch/data`; the server does not need to be running.

```bash
zig build run -- summary
zig build run -- runs --verdict pass --limit 20
zig build run -- spans --source nullclaw --tool-name shell --limit 50
zig build run -- evals --dataset prod-shadow --verdict fail
zig build run -- run run-123
```

| Command | Flags |
| --- | --- |
| `runs` | `--verdict`, `--limit` |
| `spans` | `--source`, `--tool-name`, `--limit` |
| `evals` | `--dataset`, `--verdict` |

## Ingest commands

Both take a single JSON document via `--json`. Field meanings are in the [data model](/docs/reference/api/).

```bash
zig build run -- ingest-span --json '{
  "run_id": "run-123",
  "trace_id": "trace-123",
  "span_id": "span-1",
  "source": "nullclaw",
  "operation": "model.call",
  "status": "ok",
  "started_at_ms": 1710000000000,
  "ended_at_ms": 1710000000320,
  "model": "gpt-5",
  "prompt_version": "reply-v3",
  "input_tokens": 420,
  "output_tokens": 96,
  "cost_usd": 0.018
}'
```

```bash
zig build run -- ingest-eval --json '{
  "run_id": "run-123",
  "eval_key": "helpfulness",
  "scorer": "llm-judge",
  "score": 0.94,
  "verdict": "pass",
  "dataset": "prod-shadow"
}'
```

## demo-seed

```bash
zig build run -- demo-seed
```

Creates a deterministic, idempotent demo dataset: a passing code-review run, a failed tool-call run, and a handoff/retry run with checkpoint context. No API keys, no hosted services, no agent workload. Useful for demos, manual testing, and trying the [NullHub](https://hub.nullmenu.ai/) Observability page against real-shaped data:

```bash
zig build run -- demo-seed
zig build run -- runs --limit 20
zig build run -- run demo-tool-failure
```

## NullHub integration flags

NullWatch stays headless; these two flags let NullHub own installation and setup:

```bash
# print the nullhub manifest describing this component
zig build run -- --export-manifest

# write config from wizard answers
zig build run -- --from-json '{"home":"~/.nullwatch","port":7710,"data_dir":"data"}'
```

The `--from-json` payload also accepts `host` and `api_token`, matching the config file fields.

## Environment

| Variable | Used by | Meaning |
| --- | --- | --- |
| `NULLWATCH_HOME` | nullwatch | Alternate home directory instead of `~/.nullwatch` |
| `NULLWATCH_URL` | NullHub | Where NullHub finds a running NullWatch, e.g. `http://127.0.0.1:7710` |
