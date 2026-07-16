---
title: Install NullClaw directly
description: The fastest path — Homebrew, Docker, Nix, or build from source. No hub required.
order: 5
verified: v2026.5.29
---

You don't need NullHub to run an agent. NullClaw is a standalone 678 KB static binary and has the easiest install in the family. This is the à la carte order.

## Homebrew

```bash
brew install nullclaw
nullclaw --help
```

## Docker

An official OCI image is published to GitHub Container Registry:

```bash
docker run --rm -it -v nullclaw-data:/nullclaw-data ghcr.io/nullclaw/nullclaw:latest status
```

State lives in `/nullclaw-data` inside the container — the named volume keeps it. The repo also ships a Makefile wrapper around docker-compose (`make build`, `make config`, `make up`).

## Nix

The repo carries a flake (`flake.nix`) if you are on Nix.

## Build from source

Requires Zig 0.16.0 — exactly that version, not newer, not older:

```bash
git clone https://github.com/nullclaw/nullclaw.git
cd nullclaw
zig build -Doptimize=ReleaseSmall
zig build test --summary all
```

`ReleaseSmall` is what produces the 678 KB binary (size measured by the project).

## First run

Onboard with a provider key, then talk:

```bash
nullclaw onboard --api-key sk-... --provider openrouter
nullclaw agent -m "Hello, nullclaw!"
```

`onboard` writes a single JSON config to `~/.nullclaw/config.json`. Prefer a guided setup? `nullclaw onboard --interactive` walks providers, channels and memory step by step. NullClaw speaks to 50+ providers — OpenRouter, Anthropic, OpenAI, Gemini, Ollama, Groq, Mistral, DeepSeek and others, plus any OpenAI-compatible endpoint.

For a long-running assistant, start the gateway — HTTP API, chat channels, heartbeat and scheduler in one process:

```bash
nullclaw gateway    # 127.0.0.1:3000 by default
```

## Health checks

```bash
nullclaw status
nullclaw doctor
```

`doctor` diagnoses config and environment problems; run it first when something misbehaves.

## Coming from OpenClaw?

NullClaw's config format is OpenClaw-compatible, and there is a one-command migration:

```bash
nullclaw migrate openclaw --dry-run
nullclaw migrate openclaw
```

This imports config and memory. `--dry-run` shows what would change without touching anything.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases — NullClaw's own README says so. Pin a version if that matters to you.

## Joining the stack later

A directly-installed NullClaw composes with the rest of the family whenever you are ready: point its OTLP diagnostics at [NullWatch](/docs/recipes/observable-agent-stack/), give it a backlog with [NullTickets](/docs/recipes/durable-backlog/), or hand supervision to [NullHub](/docs/start/install-nullhub/). Full agent documentation lives at [claw.nullmenu.ai](https://claw.nullmenu.ai/).
