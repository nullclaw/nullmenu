---
title: Configuration
description: Source order, config.json rules, and every NLLCLW_* key.
order: 1
verified: v2026.6.1
---

nllclw is configured by OS environment variables first, `config.json` second, and `.env` third — OS env always wins. There is no default provider, API key, or model.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Source order

1. **OS environment variables** — highest priority, for one-off overrides, service managers, and CI.
2. **`config.json`** in the user config directory — the normal long-lived setup, usually created by `nllclw init`.
3. **`.env`** in the same directory — a lower-priority alternative, created by `nllclw init --env`.

`config.json` lives at `$XDG_CONFIG_HOME/nllclw/config.json`, otherwise `~/.config/nllclw/config.json`; on Windows, `%APPDATA%\nllclw\config.json`. `nllclw uninstall` removes the config and state directories.

## config.json format

A flat JSON object. Keys are the `NLLCLW_*` names with the prefix removed, lowercased: `NLLCLW_API_KEY` becomes `api_key`.

```json
{
  "provider": "openrouter",
  "api_key": "sk-or-...",
  "model": "openai/gpt-chat-latest"
}
```

Rules: the top-level value must be an object; unknown keys are rejected; strings are accepted for every setting, integers and booleans only for matching settings; arrays, nested objects, floats, and `null` are rejected; the file is capped at 16 KiB.

The `.env` parser accepts `KEY=VALUE` lines, trims whitespace, ignores blanks and `#` comments, rejects unknown `NLLCLW_*` keys, and does not support quoting or interpolation. Same 16 KiB cap.

## Completion keys

| Key | Required | Description |
|---|---|---|
| `NLLCLW_PROVIDER` | yes | `openai`, `openrouter`, or `compatible`. |
| `NLLCLW_API_KEY` | yes | Bearer token, sent as `Authorization: Bearer ...`. |
| `NLLCLW_MODEL` | yes | Provider model name. |
| `NLLCLW_BASE_URL` | for `compatible` | Base URL such as `https://example.com/v1`. |

Optional:

| Key | Default | Description |
|---|---|---|
| `NLLCLW_MAX_TOKENS` | unset | Positive integer output cap (`max_tokens`). |
| `NLLCLW_HTTP_REFERER` | unset | OpenRouter `HTTP-Referer` header. |
| `NLLCLW_APP_TITLE` | unset | OpenRouter `X-OpenRouter-Title` header. |
| `NLLCLW_ALLOW_HTTP_BASE_URL` | `off` | Allows `http://` for exact loopback hosts only. |
| `NLLCLW_PERSONA` | `neutral` | `neutral`, `friendly`, `technical`, or `witty`. |
| `NLLCLW_STREAM` | `on` | Streams direct completions. Tool mode is non-streaming. |

`NLLCLW_BASE_URL` must be `https://` (or loopback `http://` with the override), must have a host, and must not include userinfo, query string, or fragment. Trailing slashes are trimmed before `/chat/completions` is appended.

## Memory keys

| Key | Default | Description |
|---|---|---|
| `NLLCLW_MEMORY` | `on` | Transcript memory and durable fact tools. |
| `NLLCLW_MEMORY_PATH` | state dir `memory.jsonl` | Transcript JSONL path. |
| `NLLCLW_MEMORY_MAX_MESSAGES` | `20` | Recent transcript entries sent to the model (min 2). |
| `NLLCLW_MEMORY_FACTS_PATH` | state dir `facts.jsonl` | Durable fact JSONL path. |
| `NLLCLW_MEMORY_MAX_FACTS` | `64` | Retained facts (1–1024). |

Configured state paths must be relative JSONL subpaths under the user state directory: `$XDG_STATE_HOME/nllclw`, otherwise `~/.local/state/nllclw`; on Windows, `%LOCALAPPDATA%\nllclw`.

## Tool keys

| Key | Default | Description |
|---|---|---|
| `NLLCLW_TOOLS` | `on` | The tool loop and local tools. `off` disables all tools. |
| `NLLCLW_TOOL_MAX_ROUNDS` | `4` | Maximum assistant/tool exchange rounds. |
| `NLLCLW_TOOL_OUTPUT_MAX_BYTES` | `8192` | Per-tool output cap, 256 bytes to 1 MiB. |
| `NLLCLW_FILE_READ` | `on` | `list_dir`, `read_file`. |
| `NLLCLW_FILE_WRITE` | `on` | `write_file`, `edit_file`. |
| `NLLCLW_SCHEDULE_TOOLS` | `on` | `cron_set`, `cron_list`, `cron_delete`. |
| `NLLCLW_USER_TOOLS_PATH` | state dir `user-tools.jsonl` | User-defined macro tool storage. |

Shell keys are rejected by the default binary — they exist only in a `-Dshell-tool=true` build:

| Key | Default | Description |
|---|---|---|
| `NLLCLW_SHELL` | `off` | Enables `shell_exec` in a shell-enabled build. |
| `NLLCLW_TOOL_TIMEOUT_MS` | `5000` | Shell command timeout. |

## Search keys

`web_search` stays disabled until one provider is configured. `auto` picks the first configured provider in order: Tavily, Brave, Exa, Firecrawl, then DuckDuckGo only when explicitly enabled.

| Key | Default | Description |
|---|---|---|
| `NLLCLW_SEARCH_PROVIDER` | `auto` | `auto`, `tavily`, `brave`, `exa`, `firecrawl`, `duckduckgo`. |
| `NLLCLW_SEARCH_TAVILY_KEY` | unset | Tavily Search API key. |
| `NLLCLW_SEARCH_BRAVE_KEY` | unset | Brave Search API key. |
| `NLLCLW_SEARCH_EXA_KEY` | unset | Exa API key. |
| `NLLCLW_SEARCH_FIRECRAWL_KEY` | unset | Firecrawl API key. |
| `NLLCLW_SEARCH_DUCKDUCKGO` | `off` | No-key DuckDuckGo Instant Answer fallback. |

## Telegram keys

| Key | Required | Description |
|---|---|---|
| `NLLCLW_TELEGRAM_TOKEN` | yes for `nllclw telegram` | Bot API token, `<bot-id>:<secret>` form. |
| `NLLCLW_TELEGRAM_CHAT_ID` | yes for `nllclw telegram` | Required allowlist: numeric chat id or username. |
| `NLLCLW_TELEGRAM_POLL_TIMEOUT` | no | Long-poll timeout in seconds. Default `20`. |
| `NLLCLW_TELEGRAM_RATE_LIMIT_PER_MINUTE` | no | Model-backed replies per minute. Default `20`; `0` disables. |

## WebSocket keys

| Key | Default | Description |
|---|---|---|
| `NLLCLW_WS_HOST` | `127.0.0.1` | Bind address (IP literal). |
| `NLLCLW_WS_PORT` | `8765` | TCP port. |
| `NLLCLW_WS_PATH` | `/ws` | HTTP upgrade path. |
| `NLLCLW_WS_TOKEN` | required for `nllclw websocket` | 8–256 URL-safe ASCII characters. Required even on loopback. |
| `NLLCLW_WS_ALLOW_REMOTE` | `off` | Allows non-loopback binds. |
| `NLLCLW_WS_RATE_LIMIT_PER_MINUTE` | `20` | Model-backed chat messages per minute. `0` disables. |

## Scheduler and heartbeat keys

| Key | Default | Description |
|---|---|---|
| `NLLCLW_SCHEDULE_PATH` | state dir `schedule.jsonl` | Durable schedule file. |
| `NLLCLW_DAEMON_INTERVAL_SECONDS` | `60` | Sleep between daemon polling passes. |
| `NLLCLW_HEARTBEAT_INTERVAL_SECONDS` | `1800` | Sleep between daemon heartbeat passes. |
| `NLLCLW_TIMEZONE_OFFSET_MINUTES` | `0` | Offset for time and scheduler formatting. |

## Minimal configs

OpenRouter:

```json
{
  "provider": "openrouter",
  "api_key": "sk-or-...",
  "model": "openai/gpt-chat-latest"
}
```

OpenAI:

```json
{
  "provider": "openai",
  "api_key": "sk-...",
  "model": "gpt-4o"
}
```

Ollama on loopback, through the compatible provider:

```json
{
  "provider": "compatible",
  "base_url": "http://127.0.0.1:11434/v1",
  "allow_http_base_url": true,
  "api_key": "ollama",
  "model": "llama3.2"
}
```

Use OS env for one-off overrides with the same names converted back to `NLLCLW_*` — `model` becomes `NLLCLW_MODEL`.
