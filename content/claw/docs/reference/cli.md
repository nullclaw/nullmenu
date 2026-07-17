---
title: CLI reference
description: Every nullclaw command, grouped by task — setup, runtime, channels, cron, memory, automation flags, and build flags.
order: 1
verified: v2026.5.29
---

The full command surface, grouped by task. `nullclaw help` prints the top-level summary; this page expands it and follows the project's own command reference.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Setup and interaction

| Command | Purpose |
| --- | --- |
| `nullclaw help` | Show top-level help |
| `nullclaw version` / `nullclaw --version` | Show CLI version |
| `nullclaw onboard --interactive` | Run the interactive setup wizard |
| `nullclaw onboard --api-key sk-... --provider openrouter` | Quick provider + API key setup |
| `nullclaw onboard --api-key ... --provider ... --model ... --memory ...` | Set provider, model, and memory backend at once |
| `nullclaw agent -m "..."` | Run a single prompt |
| `nullclaw agent` | Interactive chat mode |
| `nullclaw agent -m "..." -s <session>` | Run a prompt in a named session |
| `nullclaw agent --provider <name> --model <id> --temperature 0.4` | Override provider, model, and temperature for one run |
| `nullclaw agent --workspace /path -m "..."` | Run against a specific workspace |
| `nullclaw agent --skill news-digest -m "..."` | Run with a named skill active |
| `nullclaw acp` | Agent Client Protocol stdio adapter for editors |
| `nullclaw acp --provider openai --model gpt-5.2` | Pin the ACP adapter to a provider/model |

Inside interactive mode: `/model` shows and pins models, `/config reload` hot-reloads config, `/bind <agent>` routes the current chat to a named agent, `/subagents spawn --agent <id>` delegates a one-off task.

## Runtime and operations

| Command | Purpose |
| --- | --- |
| `nullclaw gateway` | Start the long-running runtime (default `127.0.0.1:3000`) |
| `nullclaw gateway --port 8080` | Override the port |
| `nullclaw gateway --host 0.0.0.0 --port 8080` | Override host and port |
| `nullclaw gateway --workspace /path` | Run the gateway against a specific workspace |
| `nullclaw service install\|start\|stop\|restart\|status\|uninstall` | Manage the background service |
| `nullclaw status [--json]` | System status, or a machine-readable runtime snapshot |
| `nullclaw doctor` | Run diagnostics |
| `nullclaw update --check` | Check for updates without installing |
| `nullclaw update --yes` | Install updates without prompting |
| `nullclaw auth login\|status\|logout openai-codex` | OAuth device flow (`auth` currently supports only `openai-codex`) |
| `nullclaw auth login openai-codex --import-codex` | Import existing Codex CLI credentials instead of a fresh login |

## Channels

| Command | Purpose |
| --- | --- |
| `nullclaw channel list [--json]` | List known and configured channels |
| `nullclaw channel start [telegram]` | Start the default or a specific channel |
| `nullclaw channel status` | Show channel health |
| `nullclaw channel info <type> [--json]` | Show configured accounts for one channel type |
| `nullclaw channel add <type>` / `remove <name>` | Print config guidance for adding/removing a channel |

## Cron

| Command | Purpose |
| --- | --- |
| `nullclaw cron list [--json]` | List scheduled tasks |
| `nullclaw cron get <id> [--json]` | Show one task |
| `nullclaw cron status [--json]` | Scheduler status and job counters |
| `nullclaw cron add "0 * * * *" "command"` | Add a recurring shell task |
| `nullclaw cron add-agent "0 * * * *" "prompt" [--model ...] [--announce] [--channel ...] [--to ...]` | Add a recurring agent task |
| `nullclaw cron once 10m "command"` | One-shot delayed shell task |
| `nullclaw cron once-agent 10m "prompt"` | One-shot delayed agent task |
| `nullclaw cron run <id>` | Run a task immediately |
| `nullclaw cron pause <id>` / `resume <id>` | Pause or resume |
| `nullclaw cron remove <id>` | Delete a task |
| `nullclaw cron runs <id>` | Recent run history |
| `nullclaw cron update <id> --expression ... --command ... --enable/--disable` | Update an existing task |

## Skills and history

| Command | Purpose |
| --- | --- |
| `nullclaw skills list` | List installed skills |
| `nullclaw skills install <source>` | Install from Git URL, local path, or well-known HTTPS endpoint |
| `nullclaw skills install --name <query>` | Search the skill registry and install the best match |
| `nullclaw skills remove <name>` / `info <name>` | Remove a skill / show metadata |
| `nullclaw history list [--limit N] [--offset N] [--json]` | List conversation sessions |
| `nullclaw history show <session_id> [--json]` | Show messages for a session |

## Memory

| Command | Purpose |
| --- | --- |
| `nullclaw memory stats` / `count` | Resolved memory config, counters, entry count |
| `nullclaw memory search "query" --limit 10` | Run retrieval against memory |
| `nullclaw memory get <key>` / `list --category task` | Inspect entries |
| `nullclaw memory reindex` | Rebuild the vector index |
| `nullclaw memory export-jsonl --limit 1000` | Export a governed, PII-redacted JSONL dataset |
| `nullclaw memory hygiene-report --json` | Dry-run duplicate report (never deletes) |
| `nullclaw memory store` | Store an entry directly |
| `nullclaw memory update <key>` / `delete <key>` | Update or delete one entry |
| `nullclaw memory drain-outbox` | Drain the durable vector outbox queue |
| `nullclaw memory forget <key>` | Delete one entry |

Details and defaults: [Memory](/docs/configure/memory/).

## Workspace, config, and models

| Command | Purpose |
| --- | --- |
| `nullclaw workspace edit AGENTS.md` | Open a bootstrap markdown file in `$EDITOR` |
| `nullclaw workspace reset-md --dry-run` | Preview workspace markdown reset |
| `nullclaw workspace audit [--staged \| --commit <sha> \| --range a..b] [--json] [--fail-on <level>]` | Scan for likely secret leaks — see [Security](/docs/operate/security/) |
| `nullclaw config show [--json]` | Print the full on-disk config |
| `nullclaw config get <path> [--json]` | Read one dotted config value |
| `nullclaw config set <path> <value>` / `unset <path>` | Write or clear one dotted config value |
| `nullclaw config reload` | Reload config in the running runtime |
| `nullclaw config validate` | Check the config file for errors |
| `nullclaw models list\|info\|summary\|benchmark\|refresh` | Inspect and manage the model catalog |
| `nullclaw mcp list` / `info <name>` | Inspect configured MCP servers |
| `nullclaw capabilities [--json]` | Show the runtime capabilities manifest |
| `nullclaw migrate openclaw [--dry-run] [--source PATH]` | Import memory and config from OpenClaw |

## Hardware and automation

| Command | Purpose |
| --- | --- |
| `nullclaw hardware scan` | Scan connected hardware |
| `nullclaw hardware flash <firmware> [--target <board>]` | Flash firmware (currently a placeholder command) |
| `nullclaw hardware monitor` | Monitor devices (currently a placeholder command) |
| `nullclaw --export-manifest` | Export the runtime manifest (used by NullHub-managed installs) |
| `nullclaw --list-models --provider <name> [--api-key <key>] [--base-url <url>]` | Print model info, including custom endpoints |
| `nullclaw --probe-provider-health` / `--probe-channel-health` | Health probes for automation |
| `nullclaw --from-json` | JSON-driven entry path |

## Build flags (from source)

Passed to `zig build`; they shape what the binary contains.

| Flag | Purpose |
| --- | --- |
| `-Dchannels=all\|none\|telegram,...` | Choose which of the 23 channel integrations are compiled in (default: all; the webhook channel is always on) |
| `-Dengines=base\|all\|sqlite,...` | Choose memory engines from the 12 available (default build ships base + SQLite) |
| `-Dstatic` | Fully static link |
| `-Dembedded_wasm3` | Embed the wasm3 WebAssembly runtime (default: true) |
| `-Dversion=...` | Stamp the version string |

## Troubleshooting order

When something is off, run these in sequence:

```bash
nullclaw doctor
nullclaw status
nullclaw channel status
nullclaw agent -m "self-check"
curl http://127.0.0.1:3000/health   # if the gateway is involved
```
