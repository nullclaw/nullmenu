---
title: Agent integration
description: Wire any agent runtime to the tracker contract — claim, events, transition or fail.
order: 2
verified: v2026.5.29
---

Any runtime that can speak HTTP can work the rail. The contract is three verbs — claim, report, transition (or fail) — and NullTickets doesn't care whether the worker behind them is [NullClaw](https://claw.nullmenu.ai/), a bash script, or something you wrote in Go.

## The tracker contract

An agent runs a continuous loop:

1. `POST /leases/claim` with `agent_id` and `agent_role`.
2. On `204`, sleep and retry later — no claimable work.
3. On `200`, execute the work for the returned run.
4. Heartbeat periodically while working (`POST /leases/{id}/heartbeat`).
5. Report events, attach artifacts, then transition or fail.
6. Go to 1.

Agents can bootstrap themselves: the server publishes its own OpenAPI 3.1 schema at `GET /openapi.json` (also at `/.well-known/openapi.json`). Point a tool-using agent at that URL and it has the full API surface.

## A minimal worker, in bash

This is the integration guide's adapter, condensed. It claims work, runs NullClaw on the task, attaches the output, and transitions.

```bash
#!/usr/bin/env bash
set -euo pipefail

TRACKER_BASE="${TRACKER_BASE:-http://127.0.0.1:7700}"
ROLE="${1:?role required}"         # llm-executor
AGENT_ID="${2:?agent id required}" # worker-1

while true; do
  CLAIM=$(curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"$AGENT_ID\",\"agent_role\":\"$ROLE\",\"lease_ttl_ms\":300000}" \
    "$TRACKER_BASE/leases/claim")

  if [ -z "$CLAIM" ]; then sleep 2; continue; fi

  RUN_ID=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["run"]["id"])')
  TASK_ID=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["task"]["id"])')
  TOKEN=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["lease_token"])')
  TITLE=$(printf '%s' "$CLAIM" | python3 -c 'import json,sys; print(json.load(sys.stdin)["task"]["title"])')

  OUT_FILE="./runtime/$RUN_ID.md"
  if /path/to/nullclaw/zig-out/bin/nullclaw agent -m "Task: $TITLE" > "$OUT_FILE"; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"task_id\":\"$TASK_ID\",\"run_id\":\"$RUN_ID\",\"kind\":\"result\",\"uri\":\"file://$OUT_FILE\"}" \
      "$TRACKER_BASE/artifacts" >/dev/null
    curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
      -d '{"trigger":"complete"}' "$TRACKER_BASE/runs/$RUN_ID/transition" >/dev/null
  else
    curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
      -d '{"error":"nullclaw execution failed"}' "$TRACKER_BASE/runs/$RUN_ID/fail" >/dev/null
  fi
done
```

Run it: `./worker.sh llm-executor worker-1`. The full version, with progress events and model selection, lives in the repo's [nullclaw.md](https://github.com/nullclaw/nulltickets/blob/main/nullclaw.md).

## Handoff between roles

Multi-role pipelines need no extra wiring. When a transition moves a task into a stage whose `agent_role` is `review`, the next `review` worker picks it up on its next poll. Handoff is just the FSM plus polling — asynchronous by construction.

## Making writes safe to retry

Network hiccups happen mid-loop. Two mechanisms keep retries harmless:

- **Idempotency**: send an `Idempotency-Key` header on writes; the server deduplicates, and reusing a key with a different body returns `409`.
- **Optimistic checks**: pass `expected_stage` / `expected_task_version` on transitions to catch races.

## Linking telemetry

If your runtime emits OpenTelemetry, point its OTLP exporter at `POST /v1/traces` (or the collector-compatible `/otlp/v1/traces`) and set the span attributes `nulltickets.run_id` and `nulltickets.task_id`. Traces then land next to the runs they describe.

## Adoption path

1. **NullClaw alone** — one-off tasks, one answer.
2. **NullClaw + NullTickets** — a durable backlog and one sequential worker loop. The recommended starting point.
3. **Add [NullBoiler](https://boiler.nullmenu.ai/)** — only when you need multi-agent scheduling, balancing and policy automation.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.
