---
title: Multi-agent workflow
description: Graph workflows across a worker fleet — NullBoiler over NullTickets and NullClaw.
order: 4
verified: v2026.5.29
---

The full brigade: NullTickets holds the truth, NullBoiler decides what runs where, NullClaw instances do the cooking. This recipe wires all three into graph-based workflows with checkpoints, fan-out and replay.

## The separation of concerns

| Layer | Component | Owns |
| --- | --- | --- |
| Truth | NullTickets | What work exists, its state, its history |
| Policy | NullBoiler | What runs, when, on which worker |
| Execution | NullClaw | Actually doing the work |

Each layer is optional — that is the point of the split. This recipe uses all three.

## 1. Bring up the stack

With NullHub, install all three (`nullhub install nulltickets`, `nullboiler`, `nullclaw`) — the wizard links a local NullTickets to NullBoiler automatically. From source, NullBoiler starts like this:

```bash
zig build
./zig-out/bin/nullboiler --port 8080 --db nullboiler.db --config config.json
```

The repo also ships a `docker-compose.yml` with profiles for the full NullTickets + NullBoiler + NullClaw stack.

## 2. Configure workers and the tracker

NullBoiler's JSON config (default `~/.nullboiler/config.json`; a `config.example.json` ships in the repo) declares your fleet and, optionally, pull-mode against the tracker:

```json
{
  "port": 8080,
  "db": "nullboiler.db",
  "workers": [
    {
      "id": "claw-main",
      "url": "http://127.0.0.1:3000",
      "protocol": "a2a",
      "tags": ["coder"],
      "max_concurrent": 2
    }
  ],
  "tracker": {
    "url": "http://127.0.0.1:7700"
  }
}
```

Workers speak one of four HTTP protocols — `webhook`, `api_chat`, `openai_chat`, `a2a` — plus async dispatch over MQTT or Redis Streams. NullClaw is the reference runtime (webhook or A2A); ZeroClaw, PicoClaw (via a bundled bridge) and any OpenAI-compatible gateway also qualify. Selection is by tags and capacity, with per-worker retries, backoff, health checks and drain mode.

With a `tracker` section, NullBoiler runs pull-mode: it polls NullTickets, claims tasks, heartbeats leases, detects stalls, and manages per-task workspaces.

## 3. Define a workflow

Workflows are graphs with 7 node types — `task`, `agent`, `route`, `interrupt`, `send`, `transform`, `subgraph` — over a shared state with reducers, checkpointed after every node. File-based workflows live as JSON in `workflows/` and hot-reload. Validate before running:

```bash
zig build run -- validate-workflows
```

Errors exit 1; warnings pass. Then create a run over the API:

```bash
curl -sS -X POST http://127.0.0.1:8080/runs \
  -H 'Content-Type: application/json' \
  -d '{"input": {...}, "steps": [...]}'
```

The REST API has 30+ endpoints (runs, workflows, workers, checkpoints, streams, tracker) described by an OpenAPI 3.1 spec — see [APIs and OpenAPI](/docs/reference/apis-and-openapi/).

## 4. Use the grown-up features

- **Fan-out**: a `send` node maps over `items_key` — one node, N parallel branches.
- **Interrupts**: `interrupt_before`/`interrupt_after` pause a run for human input; inject state and resume.
- **Replay and forking**: rerun any run from any checkpoint.
- **Overnight mode**: the built-in loop strategy iterates (up to 1000 times) until a worker returns `BACKLOG_DONE` — a backlog-burning agent that runs while you sleep.
- **Metrics**: Prometheus `/metrics` out of the box, with Grafana dashboards and AlertManager rules in the repo.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Workflow JSON is validated at load, so `validate-workflows` in CI is cheap insurance.

To see what your fleet actually did — spans, cost, verdicts — add [the observable stack](/docs/recipes/observable-agent-stack/).
