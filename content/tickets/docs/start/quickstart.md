---
title: Quickstart
description: Start the server, create a pipeline, and run one task through it with curl.
order: 2
verified: v2026.5.29
---

Ten minutes with curl: start the tracker, define a two-stage pipeline, clip a hundred orders onto the rail, and complete one by hand. No orchestrator, no SDK — plain JSON over HTTP/1.1.

## 1. Start the server

```bash
zig build run -- --port 7700 --db runtime/nulltickets.db
```

In another terminal:

```bash
BASE="http://127.0.0.1:7700"
curl -s "$BASE/health"
```

## 2. Create a pipeline

A pipeline is a small state machine: an initial stage, a map of states, and the allowed transitions. This one has two stages — `todo`, claimable by the `llm-executor` role, and a terminal `done`.

```bash
PIPELINE_PAYLOAD='{
  "name": "sequential-work",
  "definition": {
    "initial": "todo",
    "states": {
      "todo": { "agent_role": "llm-executor", "description": "Ready to execute" },
      "done": { "terminal": true, "description": "Completed" }
    },
    "transitions": [
      { "from": "todo", "to": "done", "trigger": "complete" }
    ]
  }
}'

PIPELINE_ID=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PIPELINE_PAYLOAD" \
  "$BASE/pipelines" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')
```

## 3. Create tasks

One task or a hundred — the tracker is built for durable backlogs:

```bash
for i in $(seq 1 100); do
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"pipeline_id\":\"$PIPELINE_ID\",\"title\":\"Task #$i\",\"description\":\"Implement item #$i\",\"priority\":50}" \
    "$BASE/tasks" >/dev/null
done
```

There is also `POST /tasks/bulk` for creating many in one request.

## 4. Claim work

An agent claims the next eligible task for its role. The response carries the task, a fresh run, and a lease token that authorizes mutations on that run.

```bash
CLAIM=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"agent_id":"worker-1","agent_role":"llm-executor","lease_ttl_ms":300000}' \
  "$BASE/leases/claim")

RUN_ID=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["run"]["id"])')
TOKEN=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["lease_token"])')
```

A `204` response means the rail is empty: no claimable work for that role right now.

## 5. Report and complete

Append a progress event, then transition the run using the trigger declared in the pipeline:

```bash
curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"kind":"step","data":{"message":"completed"}}' \
  "$BASE/runs/$RUN_ID/events"

curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"trigger":"complete"}' \
  "$BASE/runs/$RUN_ID/transition"
```

The task is now in `done`, the lease is released, and the event sits in an append-only timeline you can read back with `GET /runs/{id}/events`.

> [!TIP]
> Everything you just did by hand is the whole agent contract: claim → events → transition (or fail). A worker loop is those five curl calls in a `while true`.

## Where next

- [Pipelines and leases](/docs/guides/pipelines-and-leases/) — FSM authoring, retries, dependencies.
- [Agent integration](/docs/guides/agent-integration/) — wire a real [NullClaw](https://claw.nullmenu.ai/) worker to the tracker.
- [API reference](/docs/reference/api/) — every endpoint, or just `curl $BASE/openapi.json`.
