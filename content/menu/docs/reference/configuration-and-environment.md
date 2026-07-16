---
title: Configuration and environment
description: Config file locations, formats, and environment variables for every component.
order: 2
verified: v2026.5.29
---

Every component follows the same pattern: a JSON config file in a predictable home directory, optionally relocated by an env var, with a handful of runtime environment variables on top. This page maps them all.

## Config files at a glance

| Component | Default config | Home override | Format |
| --- | --- | --- | --- |
| NullHub | `~/.nullhub/` | — | JSON, edited via UI or `nullhub config <c>/<n> --edit` |
| NullClaw | `~/.nullclaw/config.json` | — | JSON (OpenClaw-compatible, snake_case) |
| NullBoiler | `~/.nullboiler/config.json` | `NULLBOILER_HOME` or `--config <file>` | JSON |
| NullTickets | `~/.nulltickets/config.json` | `NULLTICKETS_HOME` or `--config <file>` | JSON |
| NullWatch | `~/.nullwatch/config.json` | — | JSON |
| NullPantry | `${NULLPANTRY_HOME}/nullpantry.json` | `NULLPANTRY_HOME`, `--config`, `NULLPANTRY_CONFIG` | JSON, strict (unknown fields rejected) |
| nllclw | `~/.config/nllclw/config.json` | `$XDG_CONFIG_HOME` (Windows: `%APPDATA%\nllclw`) | Flat JSON, unknown keys rejected, 16 KiB cap |
| NullDesk | `<workspace>/.nulldesk/config.json` | per-workspace | JSON |

For `NULLBOILER_HOME` and `NULLTICKETS_HOME`, relative paths inside the config (like `db`) resolve relative to that directory.

## Environment variables

### NullHub

| Variable | Purpose |
| --- | --- |
| `NULLHUB_ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `NULLBOILER_URL` / `NULLBOILER_TOKEN` | Reverse proxy target for the NullBoiler UI |
| `NULLTICKETS_URL` / `NULLTICKETS_TOKEN` | Reverse proxy target for the store browser |
| `NULLWATCH_URL` / `NULLWATCH_TOKEN` | Reverse proxy target for the Flight Recorder |

### NullClaw

Config values are literal (no `${VAR}` expansion inside `config.json`), but some runtime env vars apply:

| Variable | Purpose |
| --- | --- |
| `NULLCLAW_PORT` / `NULLCLAW_BIND` | Gateway port and bind address |
| `NULLCLAW_WEB_TOKEN` / `NULLCLAW_GATEWAY_TOKEN` | Access tokens |
| `BRAVE_API_KEY`, `TAVILY_API_KEY`, etc. | Web-search providers |

Config sections: providers under `models.providers`, default model under `agents.defaults.model.primary`, plus `memory`, `gateway`, `autonomy`, `runtime`, `tunnel`, `secrets`, `security`, `mcp_servers`, `bindings`, `a2a`. The repo ships `config.example.json` and `.env.example`.

### NullWatch

Defaults, verbatim:

```json
{ "host": "127.0.0.1", "port": 7710, "data_dir": "data", "api_token": null }
```

`data_dir` resolves relative to the config file, so data lands in `~/.nullwatch/data`.

### NullPantry

Layered precedence: defaults < home defaults < config file < environment < CLI flags.

| Variable | Purpose |
| --- | --- |
| `NULLPANTRY_TOKEN` / `NULLPANTRY_TOKEN_PRINCIPALS` | Auth tokens and per-token principals |
| `NULLPANTRY_SCOPES` / `NULLPANTRY_CAPABILITIES` | Default scopes and capabilities |
| `NULLPANTRY_DATABASE_URL` | Postgres canonical store |
| `NULLPANTRY_AGENT_MEMORY_BACKEND` / `NULLPANTRY_VECTOR_BACKEND` | Backend selection |
| `NULLPANTRY_AGENT_MEMORY_STORES` / `NULLPANTRY_VECTOR_STORES` | Named multi-store JSON configs |
| `NULLPANTRY_REDIS_URL` / `NULLPANTRY_HOME` / `NULLPANTRY_CONFIG` | Redis, home dir, config path |

### nllclw

Precedence: OS environment > `config.json` > `.env`; environment always wins. Config keys are `NLLCLW_*` names lowercased without the prefix (`api_key` for `NLLCLW_API_KEY`).

| Variable | Purpose |
| --- | --- |
| `NLLCLW_PROVIDER` | `openai` \| `openrouter` \| `compatible` (required) |
| `NLLCLW_API_KEY` / `NLLCLW_MODEL` | Credentials and model (required) |
| `NLLCLW_BASE_URL` | Endpoint for `compatible` (HTTPS required; loopback HTTP needs `NLLCLW_ALLOW_HTTP_BASE_URL=on`) |
| `NLLCLW_TOOLS`, `NLLCLW_FILE_READ`, `NLLCLW_FILE_WRITE`, `NLLCLW_SCHEDULE_TOOLS`, `NLLCLW_SHELL` | Capability gates |
| `NLLCLW_SEARCH_BRAVE_KEY` | Web search |
| `NLLCLW_TOOL_MAX_ROUNDS` / `NLLCLW_TOOL_OUTPUT_MAX_BYTES` | Tool-loop bounds |
| `NLLCLW_PERSONA` | `neutral` \| `friendly` \| `technical` \| `witty` |

## Editing hub-managed instances

For components under NullHub, prefer the hub's paths — structured editors in the dashboard, raw JSON when needed, or:

```bash
nullhub config nullclaw/<instance> --edit
```

The hub knows each component's config schema from its manifest, which is how updates can migrate configs.

> [!WARNING]
> Pre-1.0: config keys may change between releases. After any manual edit, restart the instance and check `nullhub status` or the component's health endpoint.
