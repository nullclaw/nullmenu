---
title: Channels
description: CLI, REPL, Telegram, WebSocket, heartbeat and daemon — one runtime, six doors.
order: 1
verified: v2026.6.1
---

Channels are the user-facing ways to talk to the same runtime and agent engine. Each one parses input, owns its I/O, and delegates completions to the shared runtime — so memory, tools, and config behave identically everywhere.

## Direct CLI

Prompt from argv or stdin:

```bash
nllclw "explain this repository in one paragraph"
printf 'summarize this text\n' | nllclw
```

Streaming (`NLLCLW_STREAM=on`) is the default for direct chat. Tool output is non-streaming, because the agent must inspect complete tool calls before dispatching. For pure streaming chat, set `NLLCLW_TOOLS=off`.

Slash commands are handled locally and never call the model:

```bash
nllclw /settings
nllclw /diag memory
nllclw /persona technical
```

## Interactive REPL

When stdin is a TTY and no prompt is given, `nllclw` starts a terminal chat loop. Exit with `:q`, `:quit`, or `exit`. Each turn uses the same runtime memory and tool configuration as direct CLI mode.

## Telegram

Telegram mode uses Bot API long polling:

```bash
NLLCLW_TELEGRAM_TOKEN=123456:bot-token
NLLCLW_TELEGRAM_CHAT_ID=123456789
nllclw telegram
```

`NLLCLW_TELEGRAM_CHAT_ID` is a required allowlist — a numeric chat id or a username with or without `@`. The channel refuses to start without it, and messages from outside the allowlist are ignored.

Other properties worth knowing:

- model-backed replies are rate-limited (`NLLCLW_TELEGRAM_RATE_LIMIT_PER_MINUTE`, default `20`; `0` disables);
- a local lock stops a second `nllclw telegram` process on the same state directory;
- the last acknowledged update id is persisted, so restarts do not replay handled messages;
- if another machine or an older binary is already polling `getUpdates` with the same bot token, Telegram returns HTTP `409` and nllclw prints a specific hint.

## WebSocket

For custom browser, desktop, or mobile UIs, nllclw runs a local RFC6455 server:

```bash
NLLCLW_WS_TOKEN=change-me nllclw websocket
```

Default endpoint: `ws://127.0.0.1:8765/ws?token=change-me`. The token is required even on loopback, so random browser pages cannot talk to your local agent. The server handles one active client at a time.

Client message types are `chat`, `status`, `ping`, and `close`; plain text frames are accepted as chat prompts. Server messages:

| Type | Meaning |
|---|---|
| `ready` | Handshake complete, protocol version. |
| `delta` | Streamed partial text — only with `NLLCLW_STREAM=on` and `NLLCLW_TOOLS=off`. |
| `message` | Final assistant text. |
| `status` | Runtime status line. |
| `pong` | Reply to `ping`. |
| `error` | Request failed. |

Remote binds require both `NLLCLW_WS_ALLOW_REMOTE=on` and a bearer header (`Authorization: Bearer <token>`); query-parameter tokens are loopback-only. Put browser-based remote UIs behind a trusted reverse proxy that injects the header.

## Shared slash commands

REPL, Telegram, and direct CLI share one slash parser:

| Command | Effect |
|---|---|
| `/start`, `/help` | Show local command help. |
| `/settings` | Show quick runtime status. |
| `/diag [scope]` | Diagnostics: `quick`, `runtime`, `memory`, `rates`, `time`, `all`. |
| `/persona [mode]` | Show or set persona: `neutral`, `friendly`, `technical`, `witty`. |
| `/stop`, `/resume` | Pause/resume Telegram intake (Telegram-only). |
| `/chatid` | Print Telegram chat id and username (Telegram-only). |

Persona changes are runtime-only; set `NLLCLW_PERSONA` for a startup default.

## Heartbeat and daemon

`nllclw heartbeat` reads `HEARTBEAT.md` and turns pending items — unchecked markdown tasks or lines starting with `TODO:` — into one prompt.

`nllclw daemon` repeatedly claims due scheduled tasks, runs each through the normal runtime, and commits only completed entries; failed deliveries retry after a local lease expires. Schedules created from Telegram deliver their results back to the originating chat. The daemon is local and file-backed — it does not coordinate across machines.

See [Configuration](/docs/reference/configuration/) for every channel key.
