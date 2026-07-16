---
title: CLI
description: Every nullhub command — server, install, lifecycle, updates, config, raw API, OS service.
order: 1
verified: v2026.5.29
---

One binary, two modes. Run `nullhub` with no arguments and it becomes a server (HTTP plus supervisor threads); run it with a command and it acts as a CLI — direct calls, stdout, exit. Instances are addressed as `{component}/{instance-name}` everywhere, abbreviated `<c>/<n>` below.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Server

| Command | What it does |
| --- | --- |
| `nullhub` | Start server and open the browser at the dashboard |
| `nullhub serve [--host H] [--port N] [--allowed-origin ORIGIN] ...` | Start the server; repeat `--allowed-origin` to authorize extra CORS origins |
| `nullhub serve --no-open` | Start the server without opening the browser |
| `nullhub version` (also `-v`, `--version`) | Print version |

The dashboard serves at `http://nullhub.localhost:19800` by default, with `nullhub.local` published via Bonjour/avahi when available and `127.0.0.1` as fallback. Allowed origins can also come from `NULLHUB_ALLOWED_ORIGINS` as a comma-separated list.

## Install and remove

| Command | What it does |
| --- | --- |
| `nullhub install <component>` | Terminal install wizard (manifest-driven; same steps as the web UI) |
| `nullhub uninstall <c>/<n>` | Remove an instance |

Valid components today: `nullclaw`, `nullboiler`, `nulltickets`, `nullwatch`.

## Lifecycle

| Command | What it does |
| --- | --- |
| `nullhub start <c>/<n>` | Start an instance |
| `nullhub stop <c>/<n>` | Stop an instance |
| `nullhub restart <c>/<n>` | Restart an instance |
| `nullhub start-all` | Start every installed instance |
| `nullhub stop-all` | Stop every installed instance |

## Inspect

| Command | What it does |
| --- | --- |
| `nullhub status` | Table of all instances |
| `nullhub status <c>/<n>` | Single-instance detail |
| `nullhub logs <c>/<n>` | Tail logs |
| `nullhub logs <c>/<n> -f` | Follow logs live |

## Updates

| Command | What it does |
| --- | --- |
| `nullhub check-updates` | Check all instances for new versions |
| `nullhub update <c>/<n>` | Update one instance: download, migrate config, rollback on failure |
| `nullhub update-all` | Update everything |

See [Updates and rollback](/docs/operate/updates-and-rollback/).

## Config

| Command | What it does |
| --- | --- |
| `nullhub config <c>/<n>` | View instance config |
| `nullhub config <c>/<n> --edit` | Edit instance config |

## Raw API access

`nullhub api` sends a request to the running server and prints the JSON:

```bash
nullhub api GET /api/instances/nullclaw/main/status --pretty
nullhub api GET /api/instances/nullclaw/main/cron --pretty
```

Everything the dashboard does goes through this same API, so anything you can click, you can script.

## OS service

| Command | What it does |
| --- | --- |
| `nullhub service install` | Register and start NullHub as a systemd (Linux) or launchd (macOS) service |
| `nullhub service uninstall` | Remove the OS service |
| `nullhub service status` | Show OS service status |

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NULLHUB_ALLOWED_ORIGINS` | Comma-separated extra CORS origins, merged with `--allowed-origin` flags |
| `NULLBOILER_URL` | Target for the `/api/nullboiler/*` reverse proxy (e.g. `http://localhost:8080`) |
| `NULLBOILER_TOKEN` | Optional bearer token for the NullBoiler proxy |
| `NULLTICKETS_URL` | Target for the `/api/nulltickets/store/*` proxy |
| `NULLTICKETS_TOKEN` | Optional bearer token for the NullTickets proxy |
| `NULLWATCH_URL` | Override the `/api/nullwatch/*` proxy target (external NullWatch instead of the managed one) |
| `NULLWATCH_TOKEN` | Override the managed NullWatch instance token |

## Files

All state lives under `~/.nullhub/`: config, instances, binaries, logs, cached manifests, and Mission Control replay artifacts under `~/.nullhub/mission-control/replays/`.
