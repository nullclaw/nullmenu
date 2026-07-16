---
title: Configuration
description: One JSON file at ~/.nullclaw/config.json — OpenClaw-compatible, snake_case, no magic.
order: 1
verified: v2026.5.29
---

Everything NullClaw does is driven by a single JSON file. `nullclaw onboard` creates it; you edit it; the runtime reads it. There is no second source of truth.

## Where it lives

| Platform | Path |
| --- | --- |
| macOS / Linux | `~/.nullclaw/config.json` |
| Windows | `%USERPROFILE%\.nullclaw\config.json` |
| Docker | `/nullclaw-data/config.json` |

The structure is OpenClaw-compatible: snake_case keys, providers under `models.providers`, the default model under `agents.defaults.model.primary`, channels wrapped in `accounts`. Top-level `default_provider` / `default_model` keys are **not** supported.

## A minimal working config

Enough for local CLI mode — replace the API key:

```json
{
  "models": {
    "providers": {
      "openrouter": { "api_key": "YOUR_OPENROUTER_API_KEY" }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/anthropic/claude-sonnet-4" }
    }
  },
  "channels": { "cli": true },
  "memory": { "backend": "sqlite", "auto_save": true },
  "gateway": { "host": "127.0.0.1", "port": 3000, "require_pairing": true },
  "autonomy": { "level": "supervised", "workspace_only": true, "max_actions_per_hour": 20 },
  "security": {
    "sandbox": { "backend": "auto" },
    "audit": { "enabled": true }
  }
}
```

## The main sections

| Section | What it controls |
| --- | --- |
| `models.providers` | Provider credentials and endpoints — see [Providers](/docs/configure/providers/) |
| `agents.defaults` | Default model route, heartbeat interval |
| `agents.list` | Named agent profiles for delegation and routing, each with optional `system_prompt` and `workspace_path` |
| `channels` | Messaging channels and their allowlists — see [Your first channel](/docs/start/first-channel/) |
| `memory` | Backend, embeddings, hybrid-search weights — see [Memory](/docs/configure/memory/) |
| `gateway` | Bind address, port, pairing, body limits |
| `autonomy` | Autonomy level, workspace scoping, command allowlists, rate limits |
| `security` | Sandbox backend, resource limits, audit log |
| `mcp_servers` | MCP servers over stdio or HTTP |
| `bindings` | Route specific chats or Telegram forum topics to named agents |
| `reliability` | Provider retries, backoff, fallback providers and models |
| `a2a` | Agent-to-agent protocol endpoints |

## Values are literal

NullClaw does not expand `${VAR}` inside `config.json` strings — including custom header values. If you need environment-based secrets, render the file ahead of time with your own tooling, or use the `~/.nullclaw/service-env` hook in service mode (see [Gateway and service](/docs/operate/gateway-and-service/)).

A few settings do come from the environment at runtime: `NULLCLAW_PORT`, `NULLCLAW_BIND`, `NULLCLAW_WORKSPACE`, `NULLCLAW_WEB_TOKEN`, `NULLCLAW_GATEWAY_TOKEN`, and web-search keys such as `BRAVE_API_KEY` or `TAVILY_API_KEY`.

## Reading and reloading

Inspect the effective config from the CLI:

```bash
nullclaw config show --json            # the full on-disk config
nullclaw config get gateway.port      # one dotted value
```

Inside `nullclaw agent`, `/config reload` hot-reloads supported keys — including agent profiles — without restarting. After bigger edits, restart and verify:

```bash
nullclaw doctor
nullclaw status
nullclaw channel status
```

> [!NOTE]
> Pre-1.0: config and CLI may change between releases. The repo ships `config.example.json` — compare against it when a startup error points at config.

## Binding chats to agents

Named profiles in `agents.list` can be routed per chat or per Telegram forum topic. The quick way is the `/bind <agent>` command inside the target chat; NullClaw persists an exact `bindings[]` entry to config. Topic-specific bindings win over a group fallback by route priority — order in the array does not matter. `/bind status` shows the effective route; `/bind clear` removes the exact binding.

## Next

Tune models in [Providers](/docs/configure/providers/), or pick a memory engine in [Memory](/docs/configure/memory/).
