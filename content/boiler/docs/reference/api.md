---
title: HTTP API
description: All 36 operations — runs, steps, checkpoints, workers, workflows, tracker bridge and admin.
order: 1
verified: v2026.5.29
---

NullBoiler exposes 36 HTTP operations, specified in OpenAPI 3.1 at `docs/openapi.yaml` in the repo. The spec is authored against the route table in `src/api.zig` and is the contract of record; this page is the map.

## Conventions

- **Auth** — bearer token, set via `api_token` in config or the `--token` flag. `GET /health` and `GET /metrics` are public so load balancers and Prometheus can reach them without a token.
- **Ids** — opaque strings; do not parse them.
- **Timestamps** — `*_ms` fields are milliseconds since the Unix epoch (UTC).
- **Errors** — every 4xx/5xx uses one envelope:

```json
{"error": {"code": "<code>", "message": "<human readable>"}}
```

- **Idempotency** — `POST /runs` honors an `Idempotency-Key` header (preferred) or an `idempotency_key` body field. Replays return the stored run with `idempotent_replay: true`. `POST /workflows/{id}/run` does not currently implement idempotency.
- **Body size** — request bodies are capped at 8 MiB.

## Health and metrics

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Version and counters; always 200 |
| GET | `/metrics` | Prometheus text exposition |

## Runs

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/runs` | Create a run from inline steps; supports `strategy`, `input`, `config`, `callbacks`, `reduce` |
| GET | `/runs` | Paginated list; filters: `status`, `workflow_id`, `limit`, `offset` |
| GET | `/runs/{id}` | Full detail: steps, workflow snapshot, input, state |
| POST | `/runs/{id}/cancel` | Cancel |
| POST | `/runs/{id}/retry` | Retry |
| POST | `/runs/{id}/resume` | Resume after an interrupt or breakpoint |
| POST | `/runs/{id}/replay` | Re-execute from a checkpoint |
| POST | `/runs/{id}/state` | Inject state; `apply_after_step` defers the update |
| POST | `/runs/fork` | Branch a new run from a checkpoint |

## Steps, events, stream

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/runs/{id}/steps` | All steps of a run |
| GET | `/runs/{id}/steps/{step_id}` | One step |
| GET | `/runs/{id}/events` | Persisted events |
| GET | `/runs/{id}/stream` | Stream snapshot: status, state, buffered events |

`/stream` takes `mode` (comma-separated: `values`, `updates`, `debug`) and `after_seq` to page through buffered events without shared cursor state.

## Checkpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/runs/{id}/checkpoints` | List checkpoints (one after every node) |
| GET | `/runs/{id}/checkpoints/{cp_id}` | One checkpoint |

## Workers

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/workers` | Register a worker at runtime |
| GET | `/workers` | List workers with status, failures, circuit state |
| DELETE | `/workers/{id}` | Remove a registered worker |

## Workflows

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/workflows` | Store a reusable graph definition |
| GET | `/workflows` | List stored workflows with definitions |
| GET | `/workflows/{id}` | Get one, full definition |
| PUT | `/workflows/{id}` | Replace definition; existing runs keep their frozen snapshot |
| DELETE | `/workflows/{id}` | Delete |
| POST | `/workflows/{id}/validate` | Validation errors (empty array on success) plus a Mermaid diagram |
| GET | `/workflows/{id}/mermaid` | Mermaid `flowchart` source |
| POST | `/workflows/{id}/run` | Launch a run from the stored definition, optional `input` |

## Tracker bridge

Available when the `tracker` config section points at a [NullTickets](https://tickets.nullmenu.ai/) instance:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tracker/status` | Pull-mode status |
| GET | `/tracker/tasks` | Tasks the orchestrator sees |
| GET | `/tracker/tasks/{task_id}` | One task |
| GET | `/tracker/stats` | Counters |
| POST | `/tracker/refresh` | Force a poll |

## Admin and internal

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/drain` | Stop accepting new runs; finish in-flight work |
| GET | `/rate-limits` | Current rate-limit state |
| POST | `/internal/agent-events/{run_id}/{step_id}` | Worker callback endpoint |

> [!NOTE]
> The OpenAPI spec names the step-level worker selector `tags`, but the engine and the repo's own integration guides use `worker_tags`. Use `worker_tags` — unknown fields are accepted, so a `tags` selector fails silently.

## Working with the spec

Real commands from the repo docs:

```bash
# preview
npx @redocly/cli preview-docs docs/openapi.yaml

# validate
python -m openapi_spec_validator docs/openapi.yaml
npx @apidevtools/swagger-cli validate docs/openapi.yaml
```

The spec also works with `openapi-generator-cli` for TypeScript, Python and Go clients; the repo's `docs/api/README.md` lists the exact generator invocations.
