---
title: API
description: Every endpoint — pipelines, tasks, leases, runs, artifacts, store, ops, OTLP.
order: 1
verified: v2026.5.29
---

The complete REST surface. The server also documents itself: `GET /openapi.json` returns the full OpenAPI 3.1 schema, which is the canonical machine-readable version of this page.

## Conventions

- Content type: `application/json`
- Time values: Unix milliseconds
- Writes accept an optional `Idempotency-Key` header for safe retries
- Lease-protected endpoints (marked below) require `Authorization: Bearer <lease_token>`

## Discovery and health

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/openapi.json` | Full OpenAPI 3.1 schema for agent integration |
| `GET` | `/.well-known/openapi.json` | Well-known OpenAPI discovery endpoint |
| `GET` | `/health` | Service and queue health |

## Pipelines

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/pipelines` | Create pipeline definition |
| `GET` | `/pipelines` | List pipelines |
| `GET` | `/pipelines/{id}` | Get pipeline by id |

## Tasks

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/tasks` | Create task |
| `POST` | `/tasks/bulk` | Bulk create tasks |
| `GET` | `/tasks?stage=&pipeline_id=&limit=&cursor=` | List tasks (cursor paginated) |
| `GET` | `/tasks/{id}` | Get task details |
| `GET` | `/tasks/{id}/run-state` | Get task run_id |

`POST /tasks` and bulk items also accept:

- `retry_policy`: `{ max_attempts?, retry_delay_ms?, dead_letter_stage? }`
- `dependencies`: `string[]` of task ids
- `assigned_agent_id`, `assigned_by`

### Dependencies

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/tasks/{id}/dependencies` | Add edge: `{ "depends_on_task_id": "..." }` |
| `GET` | `/tasks/{id}/dependencies` | List dependencies |

### Assignments

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/tasks/{id}/assignments` | Assign: `{ "agent_id": "...", "assigned_by": "..." }` |
| `GET` | `/tasks/{id}/assignments` | List assignments |
| `DELETE` | `/tasks/{id}/assignments/{agent_id}` | Unassign |

## Leases

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/leases/claim` | Claim next task by role |
| `POST` | `/leases/{id}/heartbeat` | Extend lease (Bearer) |

`POST /leases/claim` takes `{ agent_id, agent_role, lease_ttl_ms? }`. It returns `200` with `{ task, run, lease_id, lease_token, expires_at_ms }`, or `204` when no work is claimable.

## Runs

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/runs/{id}/events` | Append run event (Bearer) |
| `GET` | `/runs/{id}/events?limit=&cursor=` | List run events (cursor paginated) |
| `POST` | `/runs/{id}/transition` | Move task to next stage (Bearer) |
| `POST` | `/runs/{id}/fail` | Mark run as failed (Bearer) |

`POST /runs/{id}/transition` fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `trigger` | yes | Transition trigger declared in the pipeline |
| `instructions` | no | Notes for the next stage |
| `usage` | no | Arbitrary usage JSON |
| `expected_stage` | no | Optimistic check; `409` on mismatch |
| `expected_task_version` | no | Optimistic check; `409` on mismatch |

## Artifacts

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/artifacts` | Attach artifact |
| `GET` | `/artifacts?task_id=&run_id=&limit=&cursor=` | List artifacts (cursor paginated) |

## Store (KV)

| Method | Path | Description |
| --- | --- | --- |
| `PUT` | `/store/{namespace}/{key}` | Put entry: `{ "value": ... }` |
| `GET` | `/store/{namespace}/{key}` | Get entry |
| `DELETE` | `/store/{namespace}/{key}` | Delete entry |
| `GET` | `/store/{namespace}` | List entries in namespace |
| `DELETE` | `/store/{namespace}` | Delete all entries in namespace |
| `GET` | `/store/search?q=&namespace=&limit=&filter_path=&filter_value=` | FTS5 full-text search |

Notes:

- Path segments are URL-decoded server-side; percent-encode reserved characters (spaces, `/`) in `namespace` and `key`.
- `search` is a reserved namespace name — it is the full-text search endpoint.
- `filter_path` / `filter_value` apply an exact JSON filter on top of FTS results.

## Ops

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/ops/queue?near_expiry_ms=&stuck_ms=` | Per-role queue stats for orchestrators |

Returns per role: `claimable_count`, `oldest_claimable_age_ms`, `failed_count`, `stuck_count`, `near_expiry_leases`.

## OpenTelemetry

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/v1/traces` | OTLP traces ingest (`application/json` or `application/x-protobuf`) |
| `POST` | `/otlp/v1/traces` | OTLP collector-compatible ingest path |

JSON payloads are parsed to normalized spans; non-JSON payloads are stored raw. Link spans to tracker entities with the attributes `nulltickets.run_id` and `nulltickets.task_id`.

## Pagination

Paginated endpoints return:

```json
{
  "items": [],
  "next_cursor": "..."
}
```

`next_cursor: null` means end of list.

## Errors

```json
{
  "error": {
    "code": "not_found",
    "message": "Task not found"
  }
}
```

Reusing an `Idempotency-Key` with a different request body returns `409 idempotency_conflict`.
