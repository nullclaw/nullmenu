---
title: Quickstart
description: From setup wizard to first conversation in five commands.
order: 2
verified: v2026.6.1
---

Run the wizard once, ask a question, check health. There is no default provider, API key, or model — the wizard collects them and writes config outside your project.

## 1. Run the setup wizard

```bash
./nllclw init
```

The wizard uses numbered menus for provider (`openai`, `openrouter`, or `compatible`), an optional token cap, assistant style, local capability profile, Telegram, WebSocket, and web search. It writes `config.json` to the user config directory — `~/.config/nllclw/config.json` on most systems.

Prefer `config.json` for long-lived setup. If you would rather keep a global `.env` file, run `./nllclw init --env` instead; it refuses to run if `config.json` already exists, because `config.json` would shadow it.

## 2. Ask a question

```bash
./nllclw "what are you?"
```

stdin works too:

```bash
printf 'summarize this text\n' | ./nllclw
```

## 3. Chat interactively

With a TTY and no prompt, nllclw starts a small terminal chat loop:

```bash
./nllclw
```

Exit with `:q`, `:quit`, or `exit`.

## 4. Check health

```bash
./nllclw status          # quick health line
./nllclw doctor          # full diagnostics report
./nllclw memory list     # stored durable facts
./nllclw schedule list   # scheduled tasks
```

These are local commands — they do not call the model.

## Where settings come from

Configuration priority, highest first:

1. OS environment variables
2. `config.json` in the user config directory
3. `.env` in the same directory

OS env always wins, so a shell, service manager, or CI job can override file config without editing it. One-off override example:

```bash
NLLCLW_MODEL=gpt-4o ./nllclw "same question, different model"
```

State files — transcript memory, facts, schedules — live in the platform user state directory, not beside the binary and not in the current project.

> [!TIP]
> The tool loop is on by default, so nllclw can already read files in your current directory, store memories, and set schedules. Every capability has a plain config gate — see [Tools and memory](/docs/guides/tools-and-memory/) for what is enabled and how to turn things off.

## Next

- [Channels](/docs/guides/channels/) — Telegram, WebSocket, heartbeat, daemon.
- [Tools and memory](/docs/guides/tools-and-memory/) — the capability model.
- [Configuration](/docs/reference/configuration/) — every `NLLCLW_*` key.
