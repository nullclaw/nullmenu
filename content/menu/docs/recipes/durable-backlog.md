---
title: Durable backlog
description: A task rail agents claim from, report to, and never lose — NullTickets plus NullClaw.
order: 3
verified: v2026.5.29
---

An agent loop that dies mid-task should not lose the task. This recipe adds NullTickets — a headless task tracker backed by SQLite — so work survives crashes, retries are policy, and multiple agents can pull from one rail without stepping on each other.

## Ingredients

- NullTickets (`nullhub install nulltickets`, or build from source)
- One or more NullClaw instances as workers
- No orchestrator — this is the deliberately simple baseline. Add [NullBoiler](/docs/recipes/multi-agent-workflow/) later if you need routing policy.

## 1. Start the tracker

Via NullHub it is already supervised. From source:

```bash
git clone https://github.com/nullclaw/nulltickets.git
cd nulltickets
zig build
zig build run -- --port 7700 --db tracker.db
```

Defaults are `--port 7700` and `--db nulltickets.db`. Check it:

```bash
curl http://127.0.0.1:7700/health
curl http://127.0.0.1:7700/openapi.json
```

That second call matters: NullTickets is self-describing. It serves its own OpenAPI 3.1 schema at `/openapi.json` (and `/.well-known/openapi.json`) precisely so agents can bootstrap themselves against it. Task-creation and pipeline endpoints are all documented there.

## 2. Define a pipeline

Pipelines are finite-state machines you declare over the REST API: states, transitions, terminal states. A minimal one is `queued → in_progress → done` with a `failed` branch. Attach a retry policy — `max_attempts`, `retry_delay_ms`, and optionally a dead-letter stage for runs that keep failing.

Tasks can also declare dependencies (DAG edges): a blocked task is excluded from claiming until its upstream tasks reach a terminal stage.

## 3. Run the claim loop

The tracker contract is three moves, and any runtime that speaks it can be a worker:

1. **Claim** — `POST /leases/claim` with the agent's role. The lease has a TTL and returns a bearer lease token; heartbeat it while working.
2. **Report** — append progress events to the run's timeline; attach artifacts.
3. **Transition or fail** — move the task to its next stage, with optimistic checks (`expected_stage`, `expected_task_version`) so two agents can't finish the same task twice.

Double-claiming is prevented at the SQL layer (`BEGIN IMMEDIATE` transactions), lease tokens are stored as SHA-256 hashes, and a worker that vanishes simply lets its lease expire — the task returns to the pool. That is the durability: no supervisor process, just state that outlives everyone.

The practical NullClaw wiring — prompts and patterns for running the loop with `nullclaw` as executor — lives in the tracker repo's [`nullclaw.md`](https://github.com/nullclaw/nulltickets/blob/main/nullclaw.md) integration guide.

## 4. Watch the queue

```bash
curl http://127.0.0.1:7700/ops/queue
```

Per-role queue stats, made for dashboards and orchestrators. NullHub also proxies the tracker's shared key-value store into its dashboard — a namespaced KV with SQLite FTS5 full-text search that doubles as cross-session agent memory.

> [!TIP]
> NullTickets ingests OTLP traces too (`/v1/traces`), and spans carrying `nulltickets.run_id` / `nulltickets.task_id` attributes get linked to their tasks. Pair this with [the observable stack](/docs/recipes/observable-agent-stack/) and every ticket knows its own story.

When one queue and role-based claiming stop being enough — fan-out, multi-stage routing, worker capacity — graduate to the [multi-agent workflow](/docs/recipes/multi-agent-workflow/).
