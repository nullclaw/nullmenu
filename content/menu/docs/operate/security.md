---
title: Security
description: Sandboxing, pairing, encrypted secrets and the trust model across the family.
order: 4
verified: v2026.5.29
---

Autonomous agents run tools, read files and talk to strangers on chat networks. The family's answer is layered: gate who can talk to an agent, constrain what the agent can touch, and record what it did. This page describes those layers as the projects document them — self-reported, pre-1.0, not independently audited.

## Who can talk to an agent

- **Pairing codes.** NullClaw's gateway hands out bearer tokens only in exchange for a one-time 6-digit pairing code (`POST /pair`) — reaching the port is not enough.
- **Allowlists.** Channels restrict who may interact; nllclw's Telegram channel is allowlist-only by chat id or username.
- **Tokens on every API.** See [Secrets and networking](/docs/operate/secrets-and-networking/) for the per-component table.

## What the agent can touch

NullClaw runs tools under multi-backend sandboxing — Landlock, Firejail, Bubblewrap, or Docker, depending on what the host offers — with workspace scoping so an agent operates inside its own directory rather than your home. Each agent profile gets its own workspace and memory namespace.

nllclw takes the compile-time route: the shell tool exists only in a `-Dshell-tool=true` build and is absent from the default binary; filesystem tools are capability-gated, restricted to CWD-relative paths, and secret-looking paths (`.env`, `.ssh`, `.aws`, private keys) are denied outright.

NullDesk adds the human boundary for code work: agents cannot write files directly — every change is a reviewable patch, shell commands carry low/medium/high risk classification, and high-risk patterns (`curl | sh`, `rm -rf`) are architecturally blocked from approval, not just flagged.

## Secrets at rest

NullClaw encrypts stored secrets with ChaCha20-Poly1305. NullTickets never stores lease tokens in plaintext — SHA-256 hashes only. NullPantry sanitizes child-process environments before invoking external CLIs. Config files still hold what they hold: treat `~/.nullclaw/config.json` and friends as sensitive files with appropriate permissions and encrypted backups.

## Who may know what

NullPantry's retrieval is permission-aware end to end: bearer tokens map to principals with distinct capabilities (read, propose, write, verify, delete, export, feed_apply), and an answer is only valid if every source, atom, relation, chunk and citation is visible to the requesting actor. Agents with different clearances can share one knowledge base without leaking across the boundary.

## What actually happened

- NullClaw keeps a signed audit log.
- NullDesk appends every task, run, file read, review, approval, command and commit to `events.jsonl` — append-only.
- NullWatch and NullTickets record spans and run events, useful as a forensic timeline as much as an ops tool.

## Network posture

Loopback-first everywhere; nothing is exposed by default, and nothing reports to a hosted service — there isn't one. Exposure is explicit: tunnels for agents, `--allowed-origin` for the hub, and NullPantry flatly refuses unauthenticated non-loopback binds.

> [!WARNING]
> These mechanisms are the projects' own descriptions of their behavior. Pre-1.0 software changes; no third-party audit exists yet. Size your trust accordingly — and for anything sensitive, add your own outer layer (VM, container, dedicated user) around the agent's sandbox.

## Reporting

NullClaw ships a `SECURITY.md` in its repository with the disclosure process. For other components, open an issue on the relevant [nullclaw org repo](https://github.com/nullclaw) — or better, a private report if the repo has security advisories enabled.
