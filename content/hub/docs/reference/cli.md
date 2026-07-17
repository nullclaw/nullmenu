---
title: CLI
description: Every nullhub command — server, install, lifecycle, updates, config, routes, raw API, report, OS service.
order: 1
verified: v2026.5.29
---

One binary, two modes. Run `nullhub` with no arguments and it becomes a server (HTTP plus a supervisor thread); run it with a command and it acts as an HTTP client to that server — every subcommand except `serve`, `service` and `report` calls the REST API and prints the result. If the server is down, the CLI tells you: `nullhub is not running`. Instances are addressed as `{component}/{instance-name}` everywhere, abbreviated `<c>/<n>` below.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Server

| Command | What it does |
| --- | --- |
| `nullhub` | Start server and open the browser at the dashboard |
| `nullhub serve [--host H] [--port N] [--allowed-origin ORIGIN] ...` | Start the server; repeat `--allowed-origin` to authorize extra CORS origins |
| `nullhub serve --no-open` | Start the server without opening the browser |
| `nullhub version` (also `-v`, `--version`) | Print version |
| `nullhub help` (also `-h`, `--help`) | Print usage |

The server binds `127.0.0.1:19800` by default and the dashboard serves at `http://nullhub.localhost:19800`, with `nullhub.local` published via mDNS (`dns-sd` on macOS, `avahi-publish` on Linux) when available. Allowed origins can also come from `NULLHUB_ALLOWED_ORIGINS` as a comma-separated list — that plus `--allowed-origin` is how remote access over a tailnet (Tailscale, for example) is enabled. Origins are validated: http/https only, no path, query or userinfo.

## Install and remove

| Command | What it does |
| --- | --- |
| `nullhub install <component> [--name NAME] [--version V] [--build-from-source]` | Terminal install wizard (manifest-driven; same steps as the web UI) |
| `nullhub wizard <component>` | Print the component's setup wizard steps without installing |
| `nullhub uninstall <c>/<n> [--remove-data]` | Remove an instance, optionally with its data |

Valid components today: `nullclaw`, `nullboiler`, `nulltickets`, `nullwatch`. Downloads are SHA256-verified and deleted on mismatch.

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
| `nullhub status [--host H] [--port N]` | Table of all instances |
| `nullhub status <c>/<n>` | Single-instance detail |
| `nullhub logs <c>/<n> [--lines N]` | Tail logs |
| `nullhub logs <c>/<n> -f` (also `--follow`) | Follow logs — note: log following is not stream-backed yet in v2026.5.29; the CLI says so and shows the current tail |

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
| `nullhub config <c>/<n> --edit` | Edit instance config in `$EDITOR` |

## Discover and call the API

The server describes its own API — 108 routes with method and path templates at `/api/meta/routes` (also `/api/spec`):

| Command | What it does |
| --- | --- |
| `nullhub routes` | List every API route the server exposes |
| `nullhub routes --json` | Same, machine-readable |
| `nullhub api <METHOD> <PATH> [--host] [--port] [--body JSON] [--body-file F] [--token T] [--content-type CT] [--pretty]` | Send a raw request to any route and print the JSON |

```bash
nullhub api GET /api/instances/nullclaw/main/status --pretty
nullhub api GET /api/instances/nullclaw/main/cron --pretty
```

Everything the dashboard does goes through this same API, so anything you can click, you can script. The bundled `nullhub-admin` skill teaches managed NullClaw agents this exact flow: `routes --json` to discover, `api` to act.

## Report an issue

| Command | What it does |
| --- | --- |
| `nullhub report [--repo R] [--type T] [--message M] [--yes] [--dry-run]` | File a GitHub issue interactively from the terminal |

Uses the `gh` CLI when present, falls back to `GITHUB_TOKEN` + curl, and as a last resort prints a prefilled issue URL. `--dry-run` shows what would be filed.

## OS service

| Command | What it does |
| --- | --- |
| `nullhub service install` | Register and start NullHub as a systemd user unit (Linux) or launchd service (macOS) |
| `nullhub service uninstall` | Remove the OS service |
| `nullhub service status` | Show OS service status |

Windows binaries ship, but `nullhub service` is not supported on Windows yet — it returns `UnsupportedPlatform`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NULLHUB_ALLOWED_ORIGINS` | Comma-separated extra CORS origins, merged with `--allowed-origin` flags (http/https only, no path or query) |
| `GITHUB_TOKEN` | Fallback auth for `nullhub report` when the `gh` CLI is absent |
| `EDITOR` | Editor opened by `nullhub config --edit` |

## Files

All state lives under `~/.nullhub/`:

| Path | Contents |
| --- | --- |
| `config.json`, `state.json` | Hub config; instance registry plus the saved-provider and saved-channel vaults |
| `manifests/{component}@{version}.json` | Cached component manifests |
| `bin/` | Installed component binaries |
| `instances/{component}/{name}/` | `instance.json`, `config.json`, `data`, `logs` per instance |
| `ui/{module}@{version}` | Installed UI modules |
| `mission-control/replays/` | Saved Mission Control replays |
| `cache/downloads` | Download cache |
