---
title: HTTP API
description: Endpoints, data model, query parameters and token auth for the NullWatch JSON API.
order: 1
verified: v2026.5.29
---

NullWatch exposes one JSON HTTP API for both ingestion and querying, on `127.0.0.1:7710` by default. There is no UI and no other protocol: what's documented here is the whole product surface, plus the [CLI](/docs/reference/cli/) that reads the same data.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. The endpoint set below matches `v2026.5.29`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/v1/capabilities` | Machine-readable description of what this instance supports |
| GET | `/v1/summary` | Aggregate summary across all stored data |
| POST | `/v1/spans` | Ingest one span |
| POST | `/v1/spans/bulk` | Ingest multiple spans (`{"items": [...]}`) |
| POST | `/v1/evals` | Ingest one eval result |
| POST | `/v1/evals/bulk` | Ingest multiple evals (`{"items": [...]}`) |
| POST | `/v1/traces` | OTLP/HTTP JSON trace ingest |
| POST | `/otlp/v1/traces` | Same as `/v1/traces`, at the standard OTLP path |
| GET | `/v1/spans` | List spans with filters |
| GET | `/v1/evals` | List evals with filters |
| GET | `/v1/runs` | List runs with filters |
| GET | `/v1/runs/:id` | One run in detail: spans, evals, summary |

### Query parameters

| Endpoint | Parameters |
| --- | --- |
| `GET /v1/spans` | `run_id`, `trace_id`, `source`, `operation`, `status`, `model`, `tool_name`, `task_id`, `session_id`, `agent_id`, `limit` |
| `GET /v1/evals` | `run_id`, `verdict`, `eval_key`, `scorer`, `dataset`, `limit` |
| `GET /v1/runs` | `run_id`, `source`, `operation`, `status`, `model`, `tool_name`, `verdict`, `dataset`, `limit` |

```bash
curl 'http://127.0.0.1:7710/v1/spans?source=nullclaw&status=error&limit=50'
curl 'http://127.0.0.1:7710/v1/evals?verdict=fail&dataset=shadow&limit=50'
curl 'http://127.0.0.1:7710/v1/runs?limit=20'
```

## Data model

### Span

One timed execution unit inside a run: a model call, tool invocation, memory lookup, task-transition bridge, or a retry/fallback branch.

| Field | Notes |
| --- | --- |
| `run_id` | Groups spans into a run |
| `trace_id`, `span_id`, `parent_span_id` | Trace identity and hierarchy |
| `source` | Emitting system, e.g. `nullclaw` |
| `operation` | e.g. `model.call`, `tool.call` |
| `status` | e.g. `ok`, `error` |
| `started_at_ms`, `ended_at_ms` or `duration_ms` | Timing |
| `model`, `tool_name`, `prompt_version` | What ran |
| `input_tokens`, `output_tokens`, `cost_usd` | Usage and cost |

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

### Eval

A scored assertion attached to a run: helpfulness, policy compliance, routing correctness, tool success rate, a regression gate.

| Field | Notes |
| --- | --- |
| `run_id` | The run being judged |
| `eval_key` | What is measured, e.g. `helpfulness` |
| `scorer` | e.g. `llm-judge`, `heuristic` |
| `score` | Numeric score |
| `verdict` | e.g. `pass`, `fail` |
| `dataset` | Optional dataset label, e.g. `prod-shadow` |
| `notes` | Free-form context |

```bash
curl -X POST http://127.0.0.1:7710/v1/evals \
  -H 'content-type: application/json' \
  -d '{
    "run_id": "run-123",
    "eval_key": "tool_success",
    "scorer": "heuristic",
    "score": 1.0,
    "verdict": "pass"
  }'
```

### Run summary

Computed, not stored: span count, eval count, error count, total duration, total cost, total input/output tokens, pass/fail counts, overall verdict. Returned by `GET /v1/runs` and `GET /v1/runs/:id`.

## OTLP trace ingest

`/v1/traces` and `/otlp/v1/traces` accept standard OTLP/HTTP JSON (`resourceSpans` → `scopeSpans` → `spans`); the legacy `instrumentationLibrarySpans` shape is accepted too. Non-JSON content types get `415`. Attributes map into the span model: a `nullwatch.run_id` attribute assigns the span to a run, `tool` becomes the tool name, and the OTLP `status.code` maps to span status. The mapper recognises attribute keys under four prefixes — `nullwatch.*`, `nullclaw.*`, `nulltickets.*` and `openclaw.*` — plus bare keys for run id, session, task, agent, model, tokens and cost. Point NullClaw's diagnostics OTLP endpoint at `http://127.0.0.1:7710` and its telemetry lands here; the response reports `accepted_spans`.

## Authentication

By default the API is open on loopback. Set `api_token` in `~/.nullwatch/config.json` (or pass `--token` to `serve`) to require a bearer token:

```json
{
  "host": "127.0.0.1",
  "port": 7710,
  "data_dir": "data",
  "api_token": "your-token"
}
```

With a token set, requests without credentials get `401` — except `GET /health`, which stays open so liveness checks keep working. Authenticated requests pass the token as a header:

```bash
curl -H 'Authorization: Bearer your-token' http://127.0.0.1:7710/v1/runs
```

`data_dir` in the config is resolved relative to the config file's directory, so the default `"data"` means `~/.nullwatch/data`; `--data-dir` on any command overrides it with an explicit path.

The E2E suite (`tests/test_e2e.sh`) exercises exactly this flow — 401 without the header, success with it — along with ingest, OTLP mapping and CLI queries.

> [!WARNING]
> `serve --host 0.0.0.0` binds all interfaces. If you do that, set `api_token` first.

## Limits

Numbers to plan around, as of `v2026.5.29`:

| Limit | Value |
| --- | --- |
| Max HTTP request body | 256 KiB |
| JSONL read-back cap on startup | 8 MiB per file |
| Connection handling | One request per connection (`Connection: close`), single-threaded |

The whole JSONL store is reloaded into memory every time the process starts, so the store is sized for one developer's machine, not a fleet.

## Community SDKs

[nullwatch-python-sdk](https://github.com/nullclaw/nullwatch-python-sdk/) is a community Python SDK with zero required dependencies. It ships built-in eval scorers for RAG hallucination detection (LettuceDetect) and tool-call schema validation.
