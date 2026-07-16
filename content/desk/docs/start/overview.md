---
title: Overview
description: What NullDesk is, the write boundary it enforces, and where it sits in the Null family.
order: 1
---

NullDesk is a local-first operations desk for humans running AI agents. You assign structured tasks, review every proposed change as a diff, approve or reject shell commands, and keep a durable record of who decided what — all in files inside your workspace.

## What it is

Most agent tooling optimizes for the agent. NullDesk optimizes for the person responsible for the result. It is the daily workspace where you operate agents while keeping final ownership of the work: tasks, files, proposed changes, artifacts, run traces, approvals, and decision history in one local interface.

In kitchen terms, NullDesk is the pass — the counter where the head chef inspects every plate before it leaves the kitchen. Agents cook; nothing goes out without your sign-off.

It is not an editor clone and not a control panel. [NullHub](https://hub.nullmenu.ai/) owns install, configuration, monitoring, and control-plane state. NullDesk owns day-to-day agent work.

## The write boundary

The core safety invariant: **agents can never write files directly.** Every change an agent proposes becomes an approval item in the Review Center, shown as a side-by-side diff. You accept or reject whole files or individual hunks, with stale-file protection if the file changed underneath. Nothing touches disk until a human accepts.

Shell commands go through the same gate. Each command an agent wants to run is classified low, medium, or high risk. High-risk patterns — `curl | sh`, `rm -rf` — are visible in the queue but blocked from approval entirely. You can approve once, or set an approve-always rule scoped to a single task.

Autonomy is a per-task dial with five modes, from `ask_only` up to `autonomous_within_limits`. Even the most autonomous mode is bounded: at most 20 actions, a $2.00 cost cap, writes limited to `src/` and `tests/`, no network or destructive commands.

## How work is organized

- **Task packets** — JSON files under `.nulldesk/tasks/` with goal, constraints, done criteria, budget, and timeout. Nine statuses carry each task from Draft through Ready, Running, and Review to Done or Failed.
- **Agent profiles** — seeded role presets (researcher, coder, reviewer, tester, and others) with per-profile model, budget, permissions, and allowed commands.
- **Audit timeline** — every task change, run, file read, review, approval, command, and commit is appended to `.nulldesk/events.jsonl`. The history is append-only and lives in your workspace as plain JSONL.
- **Run health** — a per-run panel with latency, token usage, cost, failed tool calls, and retries, in the style of [NullWatch](https://watch.nullmenu.ai/), needing no server.

All state is local. The web frontend binds to `127.0.0.1` only, and there is no cloud sync — everything is plain JSON and JSONL files under `<workspace>/.nulldesk/`.

## Three frontends, one core

One Zig core compiles into one binary with three faces:

| Frontend | Command | Notes |
| --- | --- | --- |
| Native GUI | `nulldesk gui` | macOS AppKit; the primary frontend |
| TUI | `nulldesk tui` | Cross-platform terminal UI over the same core |
| Web | `nulldesk web` | Local-only server, default `127.0.0.1:8765` |

The agent side is [NullClaw](https://claw.nullmenu.ai/): NullDesk starts it as `nullclaw acp` and speaks the Agent Client Protocol over stdio JSON-RPC.

## Status

> [!WARNING]
> NullDesk is early. The repo has no published releases, no tags, and no license file; the README labels the current feature set an MVP. Pre-1.0: config and CLI may change between releases.

The codebase is substantial — three working frontends, a documented architecture, and per-feature ship-readiness tracking — but treat it as a preview, not a dependency.

Ready to try it? Continue to [Build and run](/docs/start/build-and-run/).
