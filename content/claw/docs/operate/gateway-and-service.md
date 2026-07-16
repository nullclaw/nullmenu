---
title: Gateway and service
description: Run NullClaw long-term — the HTTP gateway, pairing, cron endpoints, and background service mode.
order: 1
verified: v2026.5.29
---

`nullclaw gateway` is the long-running mode: one process that serves the HTTP API, runs every configured channel, keeps the heartbeat, and drives the cron scheduler. This page covers running it in the foreground and installing it as a service.

## Starting the gateway

```bash
nullclaw gateway                          # configured host and port (default 127.0.0.1:3000)
nullclaw gateway --port 8080              # override port
nullclaw gateway --host 0.0.0.0 --port 8080
nullclaw gateway --workspace /path/to/ws  # override workspace for this process
```

`--host`/`--port` override only the bind settings; the rest of gateway security still comes from config. The gateway refuses a public bind without an active tunnel or an explicit `gateway.allow_public_bind` — see [Security](/docs/operate/security/).

## The HTTP surface

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/health` | GET | None |
| `/pair` | POST | `X-Pairing-Code` header |
| `/webhook` | POST | `Authorization: Bearer <token>` |
| `/media/transcribe` | POST | Bearer token |
| `/cron`, `/cron/add`, `/cron/remove`, `/cron/pause`, `/cron/resume`, `/cron/update` | GET / POST | Bearer token on public binds or when pairing tokens exist |
| `/telegram` | POST | `X-Telegram-Bot-Api-Secret-Token` matching the account's `webhook_secret` |
| `/whatsapp` | GET / POST | Meta verification / signature |
| `/.well-known/agent-card.json` | GET | None (public A2A discovery) |
| `/a2a` | POST | Bearer token — A2A JSON-RPC 2.0 |

## Pairing

On startup the gateway issues a one-time 6-digit pairing code. Exchange it for a bearer token, then use that token on protected endpoints:

```bash
# exchange the code
curl -X POST -H "X-Pairing-Code: PAIRING_CODE" http://127.0.0.1:3000/pair

# send a message through the webhook
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello from webhook"}' \
  http://127.0.0.1:3000/webhook
```

On non-loopback binds `/pair` only accepts loopback clients — do the initial pairing locally, or preconfigure `gateway.paired_tokens`. Repeated invalid pairing attempts trigger rate limiting and a temporary lockout.

## Live cron over HTTP

The scheduler is scriptable while the daemon runs:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"expression":"*/15 * * * *","command":"echo hello"}' \
  http://127.0.0.1:3000/cron/add
```

`/cron/add` also accepts one-shot payloads (`{"delay":"10m","command":"echo later"}`) and agent payloads with a `prompt` and optional `model`. The same jobs are manageable from the CLI: `nullclaw cron list|add|once|pause|resume|run|remove`.

## Service mode

For deployments that should survive reboots, install NullClaw as a background service:

```bash
nullclaw service install
nullclaw service start
nullclaw service status
```

Platform behavior:

- **macOS** uses `launchctl`.
- **Linux** uses `systemd --user` when available, falling back to OpenRC or SysVinit. If neither works, service subcommands fail — run `nullclaw gateway` in the foreground or use your own supervisor.
- **Windows** uses the Service Control Manager.

After significant config changes, restart:

```bash
nullclaw service stop
nullclaw service start
```

### Secrets without editing units

If `~/.nullclaw/service-env` exists and is executable, the installed service launcher runs it before starting `nullclaw gateway`. Use it to inject secrets from `dotenvx`, `sops`, or another local loader — no editing of the service unit needed.

### Logs

Service-mode output lands in `~/.nullclaw/logs/daemon.stdout.log` and `~/.nullclaw/logs/daemon.stderr.log`.

## Post-change checklist

```bash
nullclaw doctor
nullclaw status
nullclaw channel status
curl http://127.0.0.1:3000/health
```

## Next

Before widening any exposure — tunnels, public binds, broader allowlists — read [Security](/docs/operate/security/). For the full command catalog, see the [CLI reference](/docs/reference/cli/).
