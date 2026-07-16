---
title: Quickstart
description: Start the orchestrator, pair one NullClaw worker, and run your first task.
order: 2
verified: v2026.5.29
---

Ten minutes from binary to a completed run: one orchestrator, one [NullClaw](https://claw.nullmenu.ai/) worker, one task. NullBoiler only coordinates — the worker does the cooking.

## 1. Start a worker

NullBoiler talks to NullClaw through its gateway. Set a static paired token in the NullClaw config:

```json
{
  "gateway": {
    "host": "127.0.0.1",
    "port": 3000,
    "require_pairing": true,
    "paired_tokens": ["nb_worker_token_1"]
  }
}
```

Then start the gateway:

```bash
nullclaw gateway --port 3000
```

## 2. Point NullBoiler at it

Create `config.json` (or copy the repo's `config.example.json` and trim it). The worker uses the same token and an explicit webhook path:

```json
{
  "workers": [
    {
      "id": "nullclaw-1",
      "url": "http://localhost:3000/webhook",
      "token": "nb_worker_token_1",
      "protocol": "webhook",
      "tags": ["coder"],
      "max_concurrent": 2
    }
  ]
}
```

Start the orchestrator:

```bash
zig-out/bin/nullboiler --config config.json --port 8080 --db nullboiler.db
```

Check it is up:

```bash
curl -fsS http://127.0.0.1:8080/health
```

## 3. Create a run

A run is a set of steps. This one has a single `task` step, routed to any worker tagged `coder`:

```bash
curl -sS -X POST http://127.0.0.1:8080/runs \
  -H 'Content-Type: application/json' \
  -d '{
    "input": {
      "repo": "openclaw",
      "goal": "rewrite tests from TypeScript to Go"
    },
    "steps": [
      {
        "id": "rewrite-tests",
        "type": "task",
        "worker_tags": ["coder"],
        "prompt_template": "Repository: {{input.repo}}\nGoal: {{input.goal}}\n\nReturn a concise summary of changed files."
      }
    ]
  }'
```

The response is `{"id":"<run_id>","status":"running"}`.

## 4. Track progress

```bash
curl -sS http://127.0.0.1:8080/runs/<run_id>
```

The final task output is in `steps[].output_json.output`. For finer-grained visibility, `GET /runs/<run_id>/events` lists persisted events and `GET /runs/<run_id>/stream` returns a stream snapshot — see the [API reference](/docs/reference/api/).

## 5. Optional: overnight mode

The built-in `loop` strategy runs one task unit per iteration — up to 1000 iterations — and stops only when the worker returns `BACKLOG_DONE`:

```bash
curl -sS -X POST http://127.0.0.1:8080/runs \
  -H 'Content-Type: application/json' \
  -d '{
    "input": { "repo": "openclaw", "task_file": "night_tasks.md" },
    "steps": [
      {
        "id": "night-loop",
        "type": "loop",
        "max_iterations": 1000,
        "exit_condition": "BACKLOG_DONE",
        "body": ["execute-next-task"]
      },
      {
        "id": "execute-next-task",
        "type": "task",
        "worker_tags": ["coder"],
        "prompt_template": "Repository: {{input.repo}}\nTask source file: {{input.task_file}}\n\nDo exactly one next unchecked task from the file. If no unchecked tasks remain, return exactly: BACKLOG_DONE."
      }
    ]
  }'
```

## Where next

- [Workflow graphs](/docs/guides/workflow-graphs/) — nodes, edges, reducers, checkpoints, replay.
- [Workers and dispatch](/docs/guides/workers-and-dispatch/) — protocols, tags, capacity, health checks.
- Running against a durable task queue? Pair with [NullTickets](https://tickets.nullmenu.ai/) in pull mode — see the `tracker` section in [Configuration](/docs/reference/configuration/).
