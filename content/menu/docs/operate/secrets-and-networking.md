---
title: Secrets and networking
description: Default ports, loopback-first binding, tokens, CORS and tunnels across the stack.
order: 3
verified: v2026.5.29
---

The family's networking posture is consistent: bind to loopback, require tokens for anything that mutates, and make you opt in explicitly before anything is reachable from elsewhere.

## Default ports

| Component | Default bind | Purpose |
| --- | --- | --- |
| NullHub | `nullhub.localhost:19800` | Dashboard + API |
| NullClaw gateway | `127.0.0.1:3000` | HTTP gateway, channels, scheduler |
| NullBoiler | `:8080` (quickstart) | Orchestrator REST API |
| NullTickets | `:7700` | Tracker REST API |
| NullWatch | `127.0.0.1:7710` | Ingest + query API |
| NullPantry | `127.0.0.1:8765` | Knowledge/memory API |
| nllclw WebSocket | `ws://127.0.0.1:8765/ws` | Local UI channel |

> [!NOTE]
> NullPantry and nllclw's WebSocket channel both default to port 8765. If you run both on one machine, move one (`--port` for NullPantry).

## Tokens

Each service has its own token story; none of them shares a global credential.

| Component | Mechanism |
| --- | --- |
| NullHub | Optional bearer-token auth; per-proxy tokens via `NULLBOILER_TOKEN`, `NULLTICKETS_TOKEN`, `NULLWATCH_TOKEN` |
| NullClaw | `NULLCLAW_GATEWAY_TOKEN` and `NULLCLAW_WEB_TOKEN`; secrets in config encrypted with ChaCha20-Poly1305 |
| NullBoiler | `api_token` in config; per-worker tokens in the `workers` array |
| NullTickets | `api_token`, plus per-lease bearer tokens (stored server-side as SHA-256 hashes) |
| NullWatch | Optional `api_token` in `~/.nullwatch/config.json` |
| NullPantry | `NULLPANTRY_TOKEN` / `NULLPANTRY_TOKEN_PRINCIPALS` — per-token actors with scoped capabilities |
| nllclw | WebSocket token required even on loopback |

NullPantry is the strictest of the set: it refuses to bind off-loopback without auth at all (there is a `--allow-no-auth-non-loopback` flag; its name is the warning), and requires HTTPS for remote backends.

## Provider API keys

Model-provider keys live in NullClaw's config (`~/.nullclaw/config.json`, written by `nullclaw onboard`) or nllclw's config/env. Two implications:

- Back these files up encrypted — see [Backup and restore](/docs/operate/backup-and-restore/).
- Components downstream of NullClaw never need provider keys. NullBoiler dispatches to workers by URL and worker token; NullCap by design stores no provider keys and talks only to NullHub on `127.0.0.1:19800`.

## Exposing things deliberately

**CORS on the hub.** If a browser app on another origin needs the hub API:

```bash
nullhub serve --allowed-origin https://your.origin
```

or set `NULLHUB_ALLOWED_ORIGINS` (comma-separated).

**Reaching an agent from outside.** Do not port-forward the gateway. NullClaw has first-class tunnel support — Cloudflare Tunnel, Tailscale, ngrok, or a custom tunnel — configured in its `tunnel` section, so the machine never accepts inbound connections directly.

**Hub reverse proxies.** The dashboard reaches NullBoiler, NullTickets and NullWatch through `NULLBOILER_URL`, `NULLTICKETS_URL`, `NULLWATCH_URL` — those services can stay bound to loopback while the hub fronts them.

**Bind addresses.** `NULLCLAW_BIND` / `NULLCLAW_PORT` control the gateway; NullWatch and NullPantry take `--host`/`--port`. Binding to `0.0.0.0` is a decision, not a default — set the relevant token first.

> [!WARNING]
> Every default in this table assumes a single-user machine. The moment a second user or a second host enters the picture, set tokens everywhere. They exist for exactly that moment.

For sandboxing, pairing codes and the rest of the trust model, continue to [Security](/docs/operate/security/).
