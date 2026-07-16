---
title: Quickstart
description: Seed demo data, start the API, and inspect your first runs in five minutes.
order: 2
verified: v2026.5.29
---

The fastest way to understand NullWatch is to let it cook with its own ingredients: `demo-seed` creates a complete local dataset — runs, spans, evals, costs, failures — with no API keys, no hosted services and no running agent.

## 1. Seed the demo dataset

```bash
zig build run -- demo-seed
```

This is deterministic and idempotent: run it twice and you get the same three scenarios, not six. It seeds:

- a passing code-review run,
- a failed tool-call run,
- a handoff/retry run with checkpoint context.

## 2. Query from the CLI

You don't need the server running to read local data:

```bash
zig build run -- runs --limit 20
zig build run -- run demo-tool-failure
zig build run -- summary
```

`run <run-id>` shows a single run in detail — its spans, evals and computed summary. `summary` aggregates across everything stored.

## 3. Start the API and read it over HTTP

```bash
zig build run -- serve
```

The server listens on `127.0.0.1:7710` by default. In another terminal:

```bash
curl http://127.0.0.1:7710/health
curl http://127.0.0.1:7710/v1/runs?limit=20
curl http://127.0.0.1:7710/v1/runs/demo-tool-failure
```

Every endpoint returns JSON. The full surface is in the [API reference](/docs/reference/api/).

## 4. Ingest something yourself

Spans and evals can be written from the CLI or over HTTP. From the CLI:

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

Over HTTP:

```bash
curl -X POST http://127.0.0.1:7710/v1/spans \
  -H 'content-type: application/json' \
  -d '{
    "run_id": "run-123",
    "trace_id": "trace-123",
    "span_id": "span-1",
    "source": "nullclaw",
    "operation": "tool.call",
    "status": "ok",
    "started_at_ms": 1710000000000,
    "ended_at_ms": 1710000000140,
    "tool_name": "bash"
  }'
```

## 5. Point NullClaw at it

NullWatch speaks OTLP/HTTP JSON on `/v1/traces` and `/otlp/v1/traces`, so it works as a small local OpenTelemetry trace sink. Point [NullClaw](https://claw.nullmenu.ai/)'s diagnostics OTLP endpoint at `http://127.0.0.1:7710` and its spans map into NullWatch runs — a `nullwatch.run_id` attribute on a span groups it under that run.

## 6. Render it in NullHub

For the flight-recorder view, seed and serve:

```bash
zig build run -- demo-seed
zig build run -- serve --port 7710
```

Then start [NullHub](https://hub.nullmenu.ai/) with `NULLWATCH_URL=http://127.0.0.1:7710` and open its Observability page. You'll see the seeded runs with token usage, cost and failure context — NullWatch stores and computes, NullHub draws.

> [!TIP]
> Everything so far touched only local files under `~/.nullwatch/data`. Nothing was sent anywhere.

Next: the full [CLI reference](/docs/reference/cli/) and [API reference](/docs/reference/api/).
