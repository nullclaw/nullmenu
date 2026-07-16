---
title: Quickstart
description: From a fresh install to a first conversation and a running gateway.
order: 2
verified: v2026.5.29
---

You have the binary. This page takes you from zero config to a working agent and a long-running runtime in about five minutes.

## 1. Onboard

The fastest path is one command with a provider key:

```bash
nullclaw onboard --api-key sk-... --provider openrouter
```

Prefer to be walked through it? The interactive wizard covers providers, channels, memory and more:

```bash
nullclaw onboard --interactive
```

You can also set provider, model and memory backend in one go:

```bash
nullclaw onboard --api-key ... --provider ... --model ... --memory ...
```

Either way, onboarding writes a single JSON config to `~/.nullclaw/config.json`. That file is the whole recipe — see [Configuration](/docs/configure/configuration/) for what's in it.

## 2. Say hello

Send a single message:

```bash
nullclaw agent -m "Hello, nullclaw!"
```

Or start an interactive chat:

```bash
nullclaw agent
```

Inside the interactive session, `/model` shows the current model and routing status, and `/config reload` hot-reloads supported keys from `config.json` without a restart.

## 3. Start the runtime

`gateway` is the long-running mode: it starts the HTTP gateway, all configured channels, the heartbeat, and the cron scheduler in one process.

```bash
nullclaw gateway                # default: 127.0.0.1:3000
nullclaw gateway --port 8080    # custom port
```

Confirm it is up:

```bash
curl http://127.0.0.1:3000/health
```

The gateway binds to loopback by default and refuses a public bind without a tunnel or an explicit override — see [Security](/docs/operate/security/) before exposing anything.

## 4. Check the kitchen

Two commands cover most "is it working?" questions:

```bash
nullclaw status   # full system status
nullclaw doctor   # diagnostics with exact error details
```

If something misbehaves, `nullclaw agent --verbose` shows what a foreground run is doing.

## Coming from OpenClaw?

NullClaw uses the same config structure as OpenClaw, and there is a one-command migration for config and memory:

```bash
nullclaw migrate openclaw --dry-run   # preview first
nullclaw migrate openclaw             # then do it
```

## Where things live

| Path | What it is |
| --- | --- |
| `~/.nullclaw/config.json` | The single config file, created by `onboard` |
| `~/.nullclaw/workspace` | The agent's working directory (file access is scoped here by default) |
| `~/.nullclaw/logs/` | Daemon logs when running as a service |

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Next

Wire up Telegram or another messenger in [Your first channel](/docs/start/first-channel/), or jump straight to [Providers](/docs/configure/providers/) to tune models and routing.
