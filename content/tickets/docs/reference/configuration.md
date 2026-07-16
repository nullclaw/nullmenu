---
title: Configuration
description: CLI flags, the JSON config file, NULLTICKETS_HOME, and API token auth.
order: 2
verified: v2026.5.29
---

NullTickets keeps configuration deliberately small: three CLI flags, one JSON file, one environment variable. Missing config file means defaults — the server starts with nothing but the binary.

## CLI flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--port` | `7700` | HTTP listen port |
| `--db` | `nulltickets.db` | Path to the SQLite database file |
| `--config` | `~/.nulltickets/config.json` | Path to the JSON config file |

```bash
zig build run -- --port 7700 --db tracker.db
# or with an explicit config file:
zig build run -- --config /path/to/config.json
```

These are the only documented flags. NullTickets is a headless HTTP service, not a multi-command CLI.

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

## API token auth

By default the API is open — appropriate for a loopback-only service. Setting `api_token` in the config turns on authentication:

- Every request must send `Authorization: Bearer <token>`.
- `/health`, `/openapi.json`, and `/.well-known/openapi.json` stay open, so probes and agent bootstrap keep working.
- Lease-protected run endpoints (`/runs/{id}/events`, `/runs/{id}/transition`, `/runs/{id}/fail`, `/leases/{id}/heartbeat`) accept the run's lease token as the Bearer credential; everything else expects the API token itself.

Requests without a valid token get `401 unauthorized`.

> [!WARNING]
> Lease tokens are stored server-side as SHA-256 hashes, but the API token comparison and transport are plaintext HTTP/1.1. If the tracker must be reachable beyond localhost, put it behind TLS termination you control.

## NullHub integration

The repo exports a NullHub manifest (`src/export_manifest.zig`) and supports JSON config bootstrap (`src/from_json.zig`). This is what lets [NullHub](https://hub.nullmenu.ai/) install, configure and supervise a NullTickets instance without hand-editing files.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. Re-check this page after upgrading; releases are CalVer (`v2026.x.y`).
