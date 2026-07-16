---
title: Workflow graphs
description: Nodes, edges, state reducers, checkpoints, replay, forking and interrupts.
order: 1
verified: v2026.5.29
---

A graph workflow is a JSON definition: named nodes, directed edges, and a state schema that says how updates merge. The engine walks the graph, checkpoints state after every node, and lets you replay, fork or pause a run. Think of the definition as the recipe; runs are individual pots.

## Anatomy of a definition

```json
{
  "nodes": {
    "classify": {
      "type": "task",
      "worker_tags": ["reviewer"],
      "prompt_template": "Classify this report: {{input.report}}. Reply yes or no.",
      "output_key": "decision"
    },
    "gate": {
      "type": "route",
      "input": "state.decision",
      "routes": { "yes": "fix", "no": "archive" },
      "default": "no"
    },
    "fix": {
      "type": "task",
      "worker_tags": ["coder"],
      "prompt_template": "Fix the issue described in: {{state.decision}}"
    },
    "archive": {
      "type": "transform",
      "updates": "{\"resolution\":\"archived\"}"
    }
  },
  "edges": [
    ["__start__", "classify"],
    ["classify", "gate"],
    ["gate:yes", "fix"],
    ["gate:no", "archive"],
    ["fix", "__end__"],
    ["archive", "__end__"]
  ],
  "state_schema": {
    "decision": { "type": "string", "reducer": "last_value" },
    "resolution": { "type": "string", "reducer": "last_value" }
  }
}
```

Edges run from `__start__` to `__end__`. A route node's outgoing edges carry labels — `["gate:yes", "fix"]` fires when the routed value is `yes`. If the value matches no declared route, the node's `default` route is used.

## Node types

| Type | Does |
| --- | --- |
| `task` | Renders `prompt_template`, dispatches to a worker, writes the output into state under `output_key` (default `output`) |
| `agent` | Like `task`, for agent-protocol workers |
| `route` | Reads `input` (e.g. `state.decision`) and picks the matching labeled edge |
| `interrupt` | Stops the run until it is resumed via `POST /runs/{id}/resume` |
| `send` | Fan-out: maps the array at `items_key` across workers in parallel, gathers under `output_key` (default `send_results`) |
| `transform` | Applies `updates` (a JSON object, no worker call); `store_updates` writes durable memory back to NullTickets |
| `subgraph` | Runs a nested graph; result lands under `output_key` (default `output`) |

## State and reducers

Every key in `state_schema` declares a reducer — how a new value combines with the existing one:

| Reducer | Behavior |
| --- | --- |
| `last_value` | Replace |
| `append` | Push onto an array |
| `merge` | Shallow-merge objects |
| `add` | Numeric sum |
| `min` / `max` | Keep the smaller / larger value |
| `add_messages` | Append chat messages (LangGraph-style message lists) |

Prompt templates can read `state.*`, `input.*`, `item.*` (inside a `send` fan-out), `config.*` (run-scoped config), and `store.<namespace>.<key>` for durable values held in NullTickets. Store-backed templates need a tracker base URL — set `tracker_url` on the workflow or pass `config.tracker_url` / `config.tracker_api_token` when creating the run.

## Checkpoints, replay, forking

The engine checkpoints state after every node. That buys you:

- `GET /runs/{id}/checkpoints` — list them
- `POST /runs/{id}/replay` — re-execute the same run from a checkpoint
- `POST /runs/fork` — branch a new run from any checkpoint of an existing one
- `POST /runs/{id}/state` — inject state into a running run; with `apply_after_step` the update queues until that step completes

## Interrupts and breakpoints

Two mechanisms pause a run for a human:

- An `interrupt` node in the graph — the run stops there every time.
- `interrupt_before` / `interrupt_after` arrays in the definition — breakpoints on named nodes, no graph surgery required.

Either way, `POST /runs/{id}/resume` continues the run.

## Per-node retry and cache

Any node can carry its own retry policy and response cache:

```json
{
  "type": "task",
  "worker_tags": ["coder"],
  "prompt_template": "...",
  "retry": { "max_attempts": 3, "initial_interval_ms": 1000, "backoff_factor": 2.0, "max_interval_ms": 30000 },
  "cache": { "ttl_ms": 600000 }
}
```

`max_attempts` is clamped to 1–100. The cache key is an FNV hash of the node name plus the rendered prompt, so two runs asking the same question hit the same entry until the TTL expires.

## Store, validate, run

Store a definition once and launch runs from it by id:

```bash
curl -sS -X POST http://127.0.0.1:8080/workflows \
  -H 'Content-Type: application/json' \
  -d '{"name": "triage", "definition_json": { ... }}'

curl -sS -X POST http://127.0.0.1:8080/workflows/<id>/validate
curl -sS http://127.0.0.1:8080/workflows/<id>/mermaid
curl -sS -X POST http://127.0.0.1:8080/workflows/<id>/run -d '{"input": {"report": "..."}}'
```

`validate` returns a list of errors (empty on success); `mermaid` renders the graph as a `flowchart` string for docs.

> [!NOTE]
> Graph workflows managed over the HTTP API are distinct from the file-based `WorkflowDef` JSON files in `workflows/`, which drive tracker pull-mode. Those are hot-reloaded from disk and preflight-checked with `nullboiler validate-workflows` — see [Configuration](/docs/reference/configuration/).
