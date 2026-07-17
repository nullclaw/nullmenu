---
title: Workers and dispatch
description: Worker protocols, tag-based selection, capacity, health checks and drain mode.
order: 2
verified: v2026.5.29
---

A worker is anything that accepts a task and returns a result. NullBoiler dispatches to workers over six protocols, selects them by tag and free capacity, and takes unhealthy ones out of rotation. One config can mix heterogeneous agents at different stations.

## Declaring workers

Workers live in the `workers` array of the config file:

```json
{
  "workers": [
    {
      "id": "nullclaw-1",
      "url": "http://127.0.0.1:3000/webhook",
      "token": "token-1",
      "protocol": "webhook",
      "tags": ["coder"],
      "max_concurrent": 2
    },
    {
      "id": "openclaw-1",
      "url": "http://127.0.0.1:42617/v1/chat/completions",
      "token": "token-3",
      "protocol": "openai_chat",
      "model": "anthropic/claude-sonnet-4-6",
      "tags": ["writer"],
      "max_concurrent": 1
    }
  ]
}
```

| Field | Default | Notes |
| --- | --- | --- |
| `id` | — | Unique worker id |
| `url` | — | Endpoint; `webhook` needs an explicit path like `/webhook` |
| `token` | — | Bearer token sent to the worker |
| `protocol` | `webhook` | One of the six below |
| `model` | `null` | Required for `openai_chat` |
| `tags` | `[]` | Capability labels used for selection |
| `max_concurrent` | `1` | In-flight task cap per worker |

Workers can also be registered at runtime: `POST /workers`, `GET /workers`, `DELETE /workers/{id}`.

## Protocols

| Protocol | Transport | Payload |
| --- | --- | --- |
| `webhook` | HTTP POST | JSON `{message, text, session_key, session_id}` — synchronous reply |
| `api_chat` | HTTP POST | JSON `{message, session_id}` |
| `openai_chat` | HTTP POST | OpenAI-compatible `/chat/completions`; `model` required |
| `a2a` | HTTP | Google Agent-to-Agent protocol |
| `mqtt` | MQTT broker | Declared, currently a stub — not functional |
| `redis_stream` | Redis Streams | Async dispatch |

Which protocol for which agent, from the repo's compatibility matrix:

| Bot | Recommended | Notes |
| --- | --- | --- |
| [NullClaw](https://claw.nullmenu.ai/) | `webhook` | `response` field supported; pair tokens with the gateway (see [Quickstart](/docs/start/quickstart/)) |
| ZeroClaw | `api_chat` or `webhook` | `reply` and `response` supported |
| OpenClaw / OpenAI-compatible gateways | `openai_chat` | `model` required in worker config |
| PicoClaw | `webhook` via bridge | Its gateway is WebSocket-first; use `tools/picoclaw_webhook_bridge.py` |

Webhook workers must answer with strict JSON:

```json
{"status": "ok", "response": "..."}
```

## How a worker gets picked

Task and agent steps carry a `worker_tags` selector. The engine picks a worker whose tags match and whose `max_concurrent` cap has headroom. To pin a step to one machine, set `worker` to a specific worker id in the step definition.

```json
{
  "id": "review",
  "type": "task",
  "worker_tags": ["reviewer"],
  "prompt_template": "Review: {{state.diff}}"
}
```

## Health, failures, backoff

The engine health-checks workers on an interval and opens a circuit breaker after repeated failures. Defaults (all overridable in the `engine` config section):

| Setting | Default |
| --- | --- |
| `health_check_interval_ms` | 30000 |
| `worker_failure_threshold` | 3 consecutive failures |
| `worker_circuit_breaker_ms` | 60000 |
| `retry_base_delay_ms` / `retry_max_delay_ms` | 1000 / 30000 |
| `retry_jitter_ms` | 250 |
| `retry_max_elapsed_ms` | 900000 |

Worker status is `active`, `draining` or `dead`; `GET /workers` exposes `consecutive_failures`, `circuit_open_until_ms` and the last error text so you can see who burned the sauce.

## Drain mode

`POST /admin/drain` puts the orchestrator into drain: new runs are rejected with a `503 draining` error while in-flight work finishes. Drain mode is process-local and there is no un-drain endpoint — restart the orchestrator to leave it. A `SIGINT`/`SIGTERM` triggers the same drain and waits up to `shutdown_grace_ms` (default 30000) for active runs before exiting, so deploys get a clean handoff.

## Async dispatch

For `mqtt` and `redis_stream` workers the engine runs dedicated listener threads alongside the HTTP and tick loops. Results come back asynchronously and are correlated to the waiting step — useful when workers sit behind a broker rather than an HTTP endpoint.

Next: the full endpoint surface in the [API reference](/docs/reference/api/), or the `engine` and `tracker` sections in [Configuration](/docs/reference/configuration/).
