---
title: Observable agent stack
description: Traces, evals and cost per run — NullClaw into NullWatch, rendered by NullHub.
order: 5
verified: v2026.5.29
---

Agents fail quietly unless something writes down what happened. This recipe adds NullWatch — a sub-megabyte local OTLP sink with evals built in — and NullHub's Flight Recorder UI on top. Every span, verdict and dollar stays on your machine as JSONL.

## Ingredients

- A running NullClaw (any install path)
- NullWatch (`nullhub install nullwatch`, a [release binary](https://github.com/nullclaw/nullwatch/releases), or source)
- Optionally NullHub, for the UI

## 1. Start NullWatch

Hub-installed instances are already running. From source:

```bash
git clone https://github.com/nullclaw/nullwatch.git
cd nullwatch
zig build run -- serve
```

The JSON HTTP API listens on `127.0.0.1:7710` (`--host`/`--port` to change). Check it:

```bash
curl http://127.0.0.1:7710/health
```

## 2. See it working before wiring anything

NullWatch ships a deterministic demo dataset — no API keys, no agent workload:

```bash
zig build run -- demo-seed
zig build run -- runs --limit 20
```

`demo-seed` is idempotent and creates three recognizable runs: a passing code-review, a failed tool call, and a handoff with retries. Useful for checking the whole pipeline, including the UI, before any real traffic.

## 3. Point NullClaw at it

NullWatch accepts OTLP/HTTP JSON traces on `/v1/traces` (also `/otlp/v1/traces`), so it works as a tiny local OpenTelemetry sink. Point NullClaw's OTLP diagnostics endpoint at `http://127.0.0.1:7710/v1/traces` — see the ops section of [NullClaw's docs](https://claw.nullmenu.ai/) for the config key. Model calls, tool invocations, retries and memory lookups arrive as spans; NullWatch computes run-level summaries: latency, errors, token usage, cost, pass/fail verdicts.

Eval results (scorers, rubrics, regression checks) ingest through `/v1/evals`, or from the command line:

```bash
nullwatch ingest-eval --json '<eval JSON>'
```

There is also a community Python SDK, `nullwatch-python-sdk`, with zero required dependencies and built-in scorers for RAG hallucination detection and tool-call schema validation.

## 4. Add the Flight Recorder UI

NullWatch is deliberately headless. NullHub renders the UI: install NullWatch through the hub (or set `NULLWATCH_URL=http://127.0.0.1:7710` for an existing one) and open the dashboard's Flight Recorder page — run summaries, span timelines, eval results, token usage, cost, error context. The hub proxies your local NullWatch; nothing is sent to any hosted service.

## 5. Query from the terminal

The CLI covers the same ground as the API:

```bash
nullwatch summary
nullwatch runs --verdict fail --limit 10
nullwatch run <run-id>
nullwatch spans --tool-name shell
nullwatch evals --dataset regression
```

Data lives as JSONL under `~/.nullwatch/data` — greppable, backupable, yours.

> [!NOTE]
> NullWatch is the youngest of the hub-managed four: one release, and its README calls it a bootstrap implementation — intentionally small but already usable. No license file yet. Sizes are small even by family standards: 313–653 KB per platform, as measured by the project.

Related: NullTickets [ingests OTLP too](/docs/recipes/durable-backlog/) and links spans to tasks — run both sinks and you get observability stitched to your backlog.
