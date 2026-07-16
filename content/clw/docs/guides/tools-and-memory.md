---
title: Tools and memory
description: The capability-gated tool loop and the two local memory stores.
order: 2
verified: v2026.6.1
---

Tools let the model ask nllclw to perform local actions. Every capability sits behind a plain config gate, the loop is bounded, and the sharpest tool — shell execution — is not even compiled into the default binary.

## Capability model

Local tools that need no external service are on by default. Web search needs a configured provider; shell execution needs a special build.

| Area | Tools | Gate |
|---|---|---|
| Diagnostics | `get_time`, `get_diagnostics` | `NLLCLW_TOOLS=on` (default) |
| Memory | `memory_store`, `memory_recall`, `memory_list`, `memory_forget` | `NLLCLW_MEMORY=on` (default) |
| Filesystem read | `list_dir`, `read_file` | `NLLCLW_FILE_READ=on` (default) |
| Filesystem write | `write_file`, `edit_file` | `NLLCLW_FILE_WRITE=on` (default) |
| Scheduling | `cron_set`, `cron_list`, `cron_delete` | `NLLCLW_SCHEDULE_TOOLS=on` (default) |
| Web search | `web_search` | a configured `NLLCLW_SEARCH_*` provider |
| User tools | `create_tool`, `list_user_tools`, `delete_user_tool`, saved macros | `NLLCLW_TOOLS=on` (default) |
| Shell | `shell_exec` | `-Dshell-tool=true` build **and** `NLLCLW_SHELL=on` |

Set `NLLCLW_TOOLS=off` to disable everything. The loop is bounded by `NLLCLW_TOOL_MAX_ROUNDS` (default `4`) and every tool output is capped by `NLLCLW_TOOL_OUTPUT_MAX_BYTES` (default `8192`).

## Web search

`web_search` is one tool with a pluggable provider. The default `auto` mode picks the first configured key in this order: Tavily, Brave Search, Exa, Firecrawl, then DuckDuckGo only when explicitly enabled.

```bash
NLLCLW_SEARCH_PROVIDER=auto
NLLCLW_SEARCH_BRAVE_KEY=...
```

## User-defined macro tools

`create_tool` stores a name, description, and natural-language action as a persistent macro — not generated code. On later turns saved macros are advertised as normal tool definitions; when the model calls one, nllclw returns the saved action text and the model carries it out through the built-in tools. Names may contain only letters, digits, and underscores, and cannot collide with built-in tools.

## Shell is a compile-time decision

The default binary does not contain `shell_exec` at all. To get it, build explicitly and enable it at runtime:

```bash
zig build -Dshell-tool=true
NLLCLW_SHELL=on ./zig-out/bin/nllclw "run uname and explain the result"
```

> [!WARNING]
> Read the repo's `docs/en/security.md` before enabling filesystem writes, remote WebSocket binds, or the shell build. The filesystem policy is a local safety boundary, not a sandbox.

## Filesystem safety model

Filesystem tools accept only CWD-relative, valid UTF-8 paths. Absolute paths are rejected, as are `.`/`..` components — except that `list_dir` accepts a literal `.` for the current directory. Secret-like components are denied outright: `.env`, `config.json`, `.git`, `.ssh`, `.gnupg`, `.aws`, `id_rsa`, `id_ed25519`, and key-file suffixes like `.pem` and `.key`. Files open without following symlinks, writes are atomic, and everything is bounded by the output cap. Run nllclw only in directories where you are comfortable granting the enabled capabilities.

## Memory: transcript and facts

nllclw keeps two memory systems, both JSONL files in the user state directory:

1. **Transcript memory** — recent user/assistant turns, replayed as context. `NLLCLW_MEMORY_MAX_MESSAGES` (default `20`) caps how many entries reach the model.
2. **Durable fact memory** — keyed facts managed through the `memory_*` tools. `NLLCLW_MEMORY_MAX_FACTS` (default `64`) caps retention; newest value per key wins.

Tell it something worth keeping:

```bash
./nllclw "remember that this project uses Zig 0.16"
```

Inspect and manage facts from the CLI:

```bash
nllclw memory list
nllclw memory get project.language
nllclw memory forget project.language
nllclw memory reset      # clears transcript AND facts
```

The model cannot read or edit its own memory files through the filesystem tools — `.nllclw-*` paths are denied.

> [!DANGER]
> Memory is not encrypted. Do not store secrets in it.

Key and path options for both stores are in the [configuration reference](/docs/reference/configuration/).
