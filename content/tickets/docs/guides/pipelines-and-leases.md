---
title: Pipelines and leases
description: Author FSM pipelines, understand lease ownership, retries, dependencies and assignments.
order: 1
verified: v2026.5.29
---

Two ideas carry the whole tracker: pipelines say what stages work moves through, and leases say who is allowed to move it right now. This guide covers both, plus the machinery around them — retries, dependencies, assignments.

## Pipeline definitions

Each task belongs to one pipeline and sits in exactly one stage at a time. A pipeline definition has three required fields:

| Field | Meaning |
| --- | --- |
| `initial` | Stage id every new task starts in |
| `states` | Map of stage id → metadata |
| `transitions` | Allowed edges: `from`, `to`, `trigger` |

State metadata supports:

| Key | Meaning |
| --- | --- |
| `agent_role` | Role that can claim tasks sitting in this stage |
| `description` | Optional human note |
| `terminal` | Whether the stage ends the pipeline |

Validation rules are strict: every transition must reference existing states, at least one terminal state is required, and every non-terminal state needs at least one outgoing transition. Invalid definitions are rejected at creation.

A workable authoring pattern:

1. Start minimal: `research → coding → review → done`.
2. Give each non-terminal stage one `agent_role`.
3. Keep triggers explicit and stable: `complete`, `reject`, `approve`.
4. Add loop-back edges (`review → coding`) for rework.

Stage changes happen only through `POST /runs/{id}/transition`, and only along declared edges. There is no side door.

## Leases

Claiming is how an agent takes ownership:

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"agent_id":"worker-1","agent_role":"dev","lease_ttl_ms":300000}' \
  http://127.0.0.1:7700/leases/claim
```

A `200` returns the task, a new run, and a `lease_token`. That token is the Bearer credential for every mutation on the run: events, transition, fail, heartbeat. The server stores only a SHA-256 hash of it, and claims run inside `BEGIN IMMEDIATE` SQL transactions, so two workers cannot claim the same task.

Leases expire. While working, extend yours with `POST /leases/{id}/heartbeat`. If an agent dies silently, its lease lapses, cleanup marks the run stale during a later claim flow, and the task becomes claimable again. That is the whole crash-recovery story — no supervisor needed.

A task is excluded from claiming when any of these hold:

- its current stage's `agent_role` doesn't match the claimant
- it has unresolved dependencies
- it is assigned to a different agent
- its retry delay hasn't elapsed yet

## Retries and dead letters

`POST /runs/{id}/fail` marks a run failed and releases the lease. What happens next is the task's retry policy, set at creation:

| Field | Effect |
| --- | --- |
| `max_attempts` | Limits total attempts |
| `retry_delay_ms` | Schedules next claim eligibility |
| `dead_letter_stage` | Optional stage exhausted tasks are routed to |

Exhausted tasks set `dead_letter_reason` and emit `dead_letter` events, so nothing fails invisibly.

## Dependencies and assignments

Dependencies are DAG edges: `POST /tasks/{id}/dependencies` with `{"depends_on_task_id": "..."}`. A blocked task stays off the rail until every upstream task reaches a terminal stage.

Assignments are optional and explicit: `POST /tasks/{id}/assignments` pins a task to one `agent_id`. Use them for multi-agent orchestration; skip them otherwise.

## Do you need an orchestrator?

No — one agent loop plus NullTickets is a valid setup. Create a `todo → done` pipeline, add a hundred tasks, run one worker that claims, executes, transitions. Sequential autonomous execution, done.

Add [NullBoiler](https://boiler.nullmenu.ai/) only when you need multiple agent pools, dynamic assignment and balancing, global retry policies, or queue observability via `GET /ops/queue`.

> [!NOTE]
> Optimistic concurrency: transitions accept `expected_stage` and `expected_task_version` and return `409` on mismatch. Use them whenever more than one actor might touch a task.

Next: [Agent integration](/docs/guides/agent-integration/) — turning this contract into a running worker.
