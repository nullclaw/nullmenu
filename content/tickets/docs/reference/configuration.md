---
title: Configuration
description: CLI flags, the JSON config file, NULLTICKETS_HOME, and API token auth.
order: 2
verified: v2026.5.29
---

NullTickets keeps configuration deliberately small: a handful of CLI flags, one JSON file, one environment variable. Missing config file means defaults — the server starts with nothing but the binary.

## CLI flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--port <u16>` | `7700` | HTTP listen port |
| `--db <path>` | `nulltickets.db` | Path to the SQLite database file |
| `--token <token>` | unset | Require `Authorization: Bearer <token>` on the API (same effect as `api_token` in the config file) |
| `--config <path>` | `~/.nulltickets/config.json` | Path to the JSON config file |
| `--version` | — | Print the version and exit |
| `--export-manifest` | — | Print the NullHub install manifest as JSON and exit |
| `--from-json '<json>'` | — | Write `config.json` from setup-wizard JSON and exit |

```bash
zig build run -- --port 7700 --db tracker.db
# or with an explicit config file:
zig build run -- --config /path/to/config.json
```

Flags only — there are no subcommands, and unknown arguments are silently ignored. NullTickets is a headless HTTP service, not a multi-command CLI.

> [!NOTE]
> Known quirk in v2026.5.29: `--version` (and the version field in `GET /health`) still prints the stale string `2026.3.2`. The release tag is authoritative.

## Config file

Format is JSON. Default location: `~/.nulltickets/config.json`. Unknown fields are ignored; a missing file falls back to defaults.

```json
{
  "port": 7700,
  "db": "data/nulltickets.db",
  "api_token": null
}
```

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `port` | number | `7700` | HTTP listen port |
| `db` | string | `nulltickets.db` | SQLite database path; relative paths resolve relative to the config file's directory |
| `api_token` | string or null | `null` | When set, enables Bearer token auth on the API (see below) |

## NULLTICKETS_HOME

Set `NULLTICKETS_HOME=/path/to/dir` to relocate the instance home. The server then reads `config.json` from that directory, and relative `db` paths resolve relative to that config file. Useful for running several isolated instances side by side.

Resolution order for the config path:

1. `--config /path/to/config.json` if given
2. `$NULLTICKETS_HOME/config.json` if the variable is set
3. `~/.nulltickets/config.json`

`~` resolves via `HOME` (`USERPROFILE` on Windows).

## Fixed behavior

Some things are hard-coded and have no config knob:

- The server binds `127.0.0.1` only. The listen address is not configurable — put a reverse proxy (with TLS) in front if remote agents need access.
- One connection at a time: a sequential accept loop with `Connection: close` per request. Fine for a local coordinator; it is not a high-concurrency server.
- Request bodies are capped at 64 KB (65,536 bytes).
- Default lease TTL is 300,000 ms (5 minutes) for claim and heartbeat when `lease_ttl_ms` is omitted.
- SQLite runs in WAL mode with `synchronous=NORMAL`, `foreign_keys=ON` and `busy_timeout=5000`.

## API token auth

By default the API is open — appropriate for a loopback-only service. Setting `api_token` in the config turns on authentication:

- Every request must send `Authorization: Bearer <token>`.
- `/health`, `/openapi.json`, and `/.well-known/openapi.json` stay open, so probes and agent bootstrap keep working.
- Lease-protected run endpoints (`/runs/{id}/events`, `/runs/{id}/transition`, `/runs/{id}/fail`, `/leases/{id}/heartbeat`) accept the run's lease token as the Bearer credential; everything else expects the API token itself.

Requests without a valid token get `401 unauthorized`.

> [!WARNING]
> Lease tokens are stored server-side as SHA-256 hashes, but transport is plaintext HTTP/1.1 and the API token check is a plain byte comparison (not constant-time). If the tracker must be reachable beyond localhost, put it behind TLS termination you control.

## NullHub integration

Two flags exist for [NullHub](https://hub.nullmenu.ai/) to install, configure and supervise a NullTickets instance without hand-editing files:

- `--export-manifest` prints the install manifest as JSON and exits.
- `--from-json '<json>'` writes `config.json` from the setup wizard's answers and exits. Accepted keys: `port`, `db_path`, `api_token`, `home` (note `db_path` here vs `db` in the config file itself).

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Re-check this page after upgrading; releases are CalVer (`v2026.x.y`).
