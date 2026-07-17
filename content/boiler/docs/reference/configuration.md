---
title: Configuration
description: Config file resolution, every field with its default, CLI flags and the tracker section.
order: 2
verified: v2026.5.29
---

One JSON file configures the whole orchestrator: server, workers, engine timings and the optional NullTickets pull mode. Every field has a sane default; the tables below come from the config structs in `src/config.zig`. Unknown fields are ignored, so configs stay forward-compatible.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Where the config comes from

Resolution order:

1. `--config /path/to/config.json` — explicit file wins.
2. `NULLBOILER_HOME=/path/to/dir` — `config.json` is read from that directory.
3. Default: `~/.nullboiler/config.json`.

Relative paths inside the config — `db`, `strategies_dir`, `tracker.workflows_dir`, `tracker.workspace.root` — resolve relative to the config file, so a `NULLBOILER_HOME` directory is a self-contained instance. A missing config file is fine: defaults apply. The repo ships `config.example.json` as a starting point.

## CLI

```text
nullboiler [--host HOST] [--port N] [--db PATH] [--config PATH] [--token TOKEN]
nullboiler validate-workflows [PATH]
nullboiler --export-manifest
nullboiler --from-json '<wizard answers json>'
nullboiler --version
nullboiler help
```

| Flag / command | Purpose |
| --- | --- |
| `--host`, `--port` | Bind address; override config |
| `--db` | SQLite database path (WAL mode) |
| `--config` | Explicit config file |
| `--token` | API bearer token; same as `api_token` in config |
| `validate-workflows [PATH]` | Preflight file-based pull-mode `WorkflowDef` JSON files; errors exit 1, warnings pass |
| `--export-manifest` | Export the tool manifest (used by NullHub) |
| `--from-json` | Import config from wizard-answer JSON |
| `--version` | Print version |
| `help`, `--help`, `-h` | Print usage |

## Top-level fields

| Field | Default | Purpose |
| --- | --- | --- |
| `host` | `127.0.0.1` | Bind host |
| `port` | `8080` | Bind port |
| `db` | `nullboiler.db` | SQLite file |
| `api_token` | `null` | Bearer token; when null the API is open (loopback default) |
| `self_url` | `null` | Externally reachable URL, used for worker callbacks |
| `strategies_dir` | `strategies` | Directory of run strategies |
| `workers` | `[]` | Worker array — see [Workers and dispatch](/docs/guides/workers-and-dispatch/) |
| `engine` | see below | Engine timings |
| `tracker` | `null` | NullTickets pull mode — see below |

## `engine`

| Field | Default | Purpose |
| --- | --- | --- |
| `poll_interval_ms` | 500 | Engine tick interval |
| `default_timeout_ms` | 300000 | Step timeout when the step sets none |
| `default_max_attempts` | 1 | Step attempts when the step sets none |
| `health_check_interval_ms` | 30000 | Worker health probe interval |
| `worker_failure_threshold` | 3 | Consecutive failures before the circuit opens |
| `worker_circuit_breaker_ms` | 60000 | How long an open circuit keeps a worker out |
| `retry_base_delay_ms` | 1000 | First retry delay |
| `retry_max_delay_ms` | 30000 | Retry delay cap |
| `retry_jitter_ms` | 250 | Random jitter added to retries |
| `retry_max_elapsed_ms` | 900000 | Total retry budget per step |
| `shutdown_grace_ms` | 30000 | Drain window on shutdown |

## `workers[]`

| Field | Default | Purpose |
| --- | --- | --- |
| `id` | — | Unique id |
| `url` | — | Worker endpoint |
| `token` | — | Bearer token sent to the worker |
| `protocol` | `webhook` | `webhook`, `api_chat`, `openai_chat`, `a2a`, `mqtt`, `redis_stream` |
| `model` | `null` | Required for `openai_chat` |
| `tags` | `[]` | Selection labels |
| `max_concurrent` | 1 | Per-worker in-flight cap |

> [!NOTE]
> `mqtt` and `redis_stream` parse as valid protocols, but their transports are stubs in the current release — nothing is sent over the wire. Use the four HTTP protocols: `webhook`, `api_chat`, `openai_chat`, `a2a`.

## `tracker` — pull mode against NullTickets

Setting this section turns on pull mode: NullBoiler polls [NullTickets](https://tickets.nullmenu.ai/), claims tasks by role, heartbeats leases and runs each task in a managed workspace.

| Field | Default | Purpose |
| --- | --- | --- |
| `url` | `null` | NullTickets base URL (pull mode is off while null) |
| `api_token` | `null` | Tracker token |
| `poll_interval_ms` | 10000 | Tracker poll interval |
| `agent_id` | `nullboiler` | Identity used when claiming |
| `stall_timeout_ms` | 300000 | Mark a task stalled after this silence |
| `lease_ttl_ms` | 60000 | Claim lease duration |
| `heartbeat_interval_ms` | 30000 | Lease heartbeat interval |
| `workflows_dir` | `workflows` | Directory of file-based `WorkflowDef` JSON (hot-reloaded) |

### `tracker.concurrency`

| Field | Default | Purpose |
| --- | --- | --- |
| `max_concurrent_tasks` | 10 | Global cap |
| `per_pipeline` / `per_role` / `per_state` | `null` | Per-key caps as JSON maps |

### `tracker.workspace`

| Field | Default | Purpose |
| --- | --- | --- |
| `root` | `/tmp/nullboiler-workspaces` | Where per-task workspaces are created |
| `hooks.after_create` / `hooks.before_run` / `hooks.after_run` / `hooks.before_remove` | `null` | Shell hooks around the workspace lifecycle |
| `hook_timeout_ms` | 30000 | Per-hook timeout |

### `tracker.subprocess`

Pull mode can spawn a local agent per task instead of calling a remote worker:

| Field | Default | Purpose |
| --- | --- | --- |
| `command` | `nullclaw` | Binary to spawn |
| `base_port` | 9200 | First port assigned to spawned agents |
| `health_check_retries` | 10 | Startup probes before giving up |
| `max_turns` | 20 | Turn cap per task |
| `turn_timeout_ms` | 600000 | Per-turn timeout |
| `continuation_prompt` | — | Prompt sent on follow-up turns of a task |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NULLBOILER_HOME` | Instance home directory; `config.json` and relative paths resolve from here. Unset, it falls back to `HOME` (`USERPROFILE` on Windows) plus `.nullboiler` |
| `NULLBOILER_TOKEN` | Exported before `docker compose up` to align the API token across the repo's compose stack — see the compose guide (`docs/docker-compose-nulltickets-nullclaw.md`) |

## Preflight

Before starting a pull-mode instance, validate the workflow files on disk:

```bash
zig build run -- validate-workflows
zig build run -- validate-workflows workflows
```

It scans direct `*.json` files in the directory (no recursion), errors on malformed JSON, missing or duplicate `pipeline_id`, and warns on suspicious-but-allowed shapes. Errors exit with status 1; warnings pass — matching the runtime loader's permissive behavior.
