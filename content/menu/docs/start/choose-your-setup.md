---
title: Choose your setup
description: Decide between a single agent, the managed stack, or the minimal sibling.
order: 2
verified: v2026.5.29
---

There are three sensible entry points into the Null ecosystem. Pick by appetite: a single dish, the tasting menu, or the recipe card you can read in one sitting.

## Path 1: just the agent

If you want one autonomous agent on one machine, install NullClaw directly. It is the smoothest install in the family — Homebrew, Docker, or a Nix flake — and it works entirely on its own: providers, channels, memory, tools, scheduling and a gateway in one binary.

```bash
brew install nullclaw
nullclaw onboard --api-key sk-... --provider openrouter
nullclaw agent -m "Hello, nullclaw!"
```

Choose this if: you are exploring, you want a chat-channel assistant, or you are deploying to small hardware. See [Install NullClaw directly](/docs/start/install-nullclaw-directly/).

## Path 2: the managed stack

If you want more than one component — orchestration, durable tasks, observability — start with NullHub. It installs and supervises the core four (NullClaw, NullBoiler, NullTickets, NullWatch), gives you one dashboard for status, logs, config and updates, and registers OS services.

```bash
docker run --rm -p 19800:19800 -v nullhub-data:/nullhub-data ghcr.io/nullclaw/nullhub:latest
```

Choose this if: you plan to run agents continuously, you want updates with rollback, or several components need to talk to each other. See [Install NullHub](/docs/start/install-nullhub/).

> [!NOTE]
> NullHub manages NullClaw, NullBoiler, NullTickets and NullWatch today. NullPantry, NullDesk, NullCap and nllclw are installed separately — do not expect `nullhub install` to know them.

## Path 3: the minimal sibling

If you want a complete assistant you can read end to end, [nllclw](https://clw.nullmenu.ai/) is a standalone implementation in about 21k lines of Zig: OpenAI-compatible providers, local memory, capability-gated tools, Telegram and WebSocket. Under 1 MB. Shell access is compiled out of the default binary.

```bash
# download from https://github.com/nullclaw/nllclw/releases/latest
chmod +x nllclw
./nllclw init
./nllclw "what are you?"
```

Choose this if: you want a small, auditable starting point rather than a platform.

## Matching goals to recipes

| You want | Components | Recipe |
| --- | --- | --- |
| A personal assistant on Telegram/Discord/etc. | NullClaw | [Personal assistant](/docs/recipes/personal-assistant/) |
| Agents that share a knowledge base | NullClaw + NullPantry | [Shared knowledge](/docs/recipes/shared-knowledge/) |
| A backlog agents work through unattended | NullTickets + NullClaw | [Durable backlog](/docs/recipes/durable-backlog/) |
| Multi-step workflows across several agents | NullBoiler + NullTickets + NullClaw | [Multi-agent workflow](/docs/recipes/multi-agent-workflow/) |
| Traces, evals and cost per run | NullClaw + NullWatch (+ NullHub UI) | [Observable agent stack](/docs/recipes/observable-agent-stack/) |

Whichever path you take, the components compose later. A standalone NullClaw can join a hub-managed stack; a hub-managed stack can shed pieces you stop using.

> [!TIP]
> All paths need nothing beyond the binary itself at runtime. If you can run a static executable, you can run the stack.
