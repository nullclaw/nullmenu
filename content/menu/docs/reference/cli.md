---
title: CLI reference
description: Every documented command across the family, one component per table.
order: 1
verified: v2026.5.29
---

The family's command surfaces, as documented by each project at its latest release. Deep flag documentation lives on each product's own site; this page is the cross-stack index.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. When in doubt, `--help` on your installed binary outranks this page.

## nullhub

| Command | Does |
| --- | --- |
| `nullhub` | Start server and open the dashboard |
| `nullhub serve [--host H] [--port N] [--allowed-origin ORIGIN]` | Start server with explicit binding/CORS |
| `nullhub install <component>` | Terminal install wizard |
| `nullhub uninstall <c>/<n>` | Remove an instance |
| `nullhub start\|stop\|restart <c>/<n>` | Instance lifecycle (also `start-all` / `stop-all`) |
| `nullhub status [<c>/<n>]` | All instances, or one in detail |
| `nullhub logs <c>/<n> [-f]` | Tail logs; `-f` to follow |
| `nullhub check-updates` | Version checks across instances |
| `nullhub update <c>/<n>` / `update-all` | Update with config migration and rollback |
| `nullhub config <c>/<n> [--edit]` | View or edit instance config |
| `nullhub api GET /api/... --pretty` | Raw API access from the CLI |
| `nullhub service install\|uninstall\|status` | systemd/launchd service management |
| `nullhub version` | Print version |

`<c>/<n>` is `component/instance-name` — multi-instance is first-class.

## nullclaw

| Command | Does |
| --- | --- |
| `nullclaw onboard` | Setup wizard (`--api-key`/`--provider`, `--interactive`, `--channels-only`) |
| `nullclaw agent [-m "..."]` | Chat: one message with `-m`, interactive without |
| `nullclaw gateway` | Long-running runtime: HTTP gateway, channels, heartbeat, scheduler (default `127.0.0.1:3000`) |
| `nullclaw channel list\|info\|start\|status\|add\|remove` | Manage messaging channels |
| `nullclaw service install\|start\|stop\|restart\|status\|uninstall` | Background service (systemd/OpenRC) |
| `nullclaw cron list\|add\|once\|remove\|pause\|resume\|run` | Scheduled tasks |
| `nullclaw memory stats\|search\|export-jsonl\|forget\|reindex` | Inspect and maintain memory |
| `nullclaw skills list\|install\|remove\|info` | Skill packs with registry search |
| `nullclaw status` / `nullclaw doctor` | System status, diagnostics |
| `nullclaw acp` | Agent Client Protocol stdio adapter for editors |
| `nullclaw hardware scan\|flash\|monitor` | Hardware device management |
| `nullclaw migrate openclaw [--dry-run]` | Import config and memory from OpenClaw |
| `nullclaw auth login\|status\|logout` | OAuth authentication |
| `nullclaw update [--check] [--yes]` | Self-update |

## nullboiler

| Command | Does |
| --- | --- |
| `nullboiler --config <file> --port <n> --db <file>` | Start the orchestrator HTTP server |
| `nullboiler validate-workflows [dir]` | Preflight-validate workflow JSON (errors exit 1, warnings pass) |
| `nullboiler --version` | Print version |
| `nullboiler --export-manifest` | Export the NullHub manifest |
| `nullboiler --from-json` | Import a workflow from JSON |

## nulltickets

NullTickets is a headless HTTP service, not a multi-command CLI:

| Invocation | Does |
| --- | --- |
| `zig build run -- --port 7700 --db tracker.db` | Start the server |
| `--port` (default 7700), `--db` (default `nulltickets.db`), `--config <file>` | The documented flags |
| `zig build test` / `bash tests/test_e2e.sh` | Unit and end-to-end tests |

Everything else happens over its [REST API](/docs/reference/apis-and-openapi/).

## nullwatch

| Command | Does |
| --- | --- |
| `nullwatch serve` | JSON HTTP API server (default `127.0.0.1:7710`; `--host`/`--port`) |
| `nullwatch summary` | Aggregate summary |
| `nullwatch runs [--verdict V] [--limit N]` | List runs |
| `nullwatch run <run-id>` | Inspect one run |
| `nullwatch spans [--source S] [--tool-name T] [--limit N]` | List spans |
| `nullwatch evals [--dataset D] [--verdict V]` | List evals |
| `nullwatch ingest-span --json '<span>'` / `ingest-eval --json '<eval>'` | Ingest from the CLI |
| `nullwatch demo-seed` | Seed deterministic, idempotent demo data |
| `nullwatch --export-manifest` / `--from-json '<config>'` | NullHub manifest / config bootstrap |

## nllclw

| Command | Does |
| --- | --- |
| `nllclw "<prompt>"` | One-shot question |
| `nllclw` | Interactive terminal chat |
| `nllclw init` | Setup wizard (`init --env` for a global `.env`) |
| `nllclw telegram` / `nllclw websocket` | Start a channel |
| `nllclw status` / `nllclw doctor` | Health checks |
| `nllclw memory list` / `nllclw schedule list` | Inspect memory and schedules |
| `nllclw heartbeat` / `nllclw daemon` | Heartbeat / schedule-running daemon |
| `nllclw uninstall` | Remove config and state directories |

## Not covered here

NullPantry runs via `zig build run -- --db <path>` with runtime flags (`--host`, `--port`, `--config`, `--home`, `--backend postgres`); NullDesk (`nulldesk gui|tui|web --workspace <path>`) and NullCap have rich pre-release command surfaces documented in their repos. Their commands stabilize when they cut releases.
