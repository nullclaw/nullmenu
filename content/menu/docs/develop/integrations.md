---
title: Integrations
description: The extension seams — worker protocols, tracker contract, OTLP, MCP, A2A, manifests.
order: 2
verified: v2026.5.29
---

You don't need to write Zig to build on the ecosystem. Every component exposes a documented seam — a protocol or contract that outside software can implement. This page catalogs them, roughly in order of usefulness.

## Bring your own worker (NullBoiler)

NullBoiler dispatches to anything that speaks one of its worker protocols:

| Protocol | Implement this if |
| --- | --- |
| `webhook` | You have an HTTP endpoint that accepts a task and returns a result |
| `openai_chat` | Your worker is any OpenAI-compatible gateway (set `model` in the worker config) |
| `api_chat` | Your worker exposes a chat-style API (ZeroClaw does) |
| `a2a` | Your worker speaks Google's A2A JSON-RPC (NullClaw does) |
| MQTT / Redis Streams | You want async dispatch through a broker you already run |

A bundled bridge (`tools/picoclaw_webhook_bridge.py`) shows the webhook pattern for adapting a runtime that doesn't natively fit. Workers declare tags and capacity; the engine handles selection, retries, backoff and health checks.

## Implement the tracker contract (NullTickets)

Any runtime becomes a NullTickets worker by implementing three moves: claim (`POST /leases/claim` by role, keep the lease heartbeated), report (append run events, attach artifacts), transition or fail (with optimistic `expected_stage` / `expected_task_version` checks). The full schema is served by the tracker itself at `/openapi.json` — agents are expected to bootstrap from it. See [Durable backlog](/docs/recipes/durable-backlog/) for the semantics.

## Send telemetry (OTLP)

NullWatch (`127.0.0.1:7710`) and NullTickets (`:7700`) both accept OTLP/HTTP JSON on `/v1/traces` and `/otlp/v1/traces`. Anything that emits OpenTelemetry traces can use them as local sinks. For NullTickets, add `nulltickets.run_id` / `nulltickets.task_id` span attributes to link traces to tasks.

For NullWatch there is also a community Python SDK — `nullwatch-python-sdk`, zero required dependencies, with built-in eval scorers for RAG hallucination detection and tool-call schema validation.

## Extend the agent (NullClaw)

- **MCP servers.** NullClaw is an MCP client over stdio and HTTP — the standard way to add tools without touching the binary.
- **Skills.** Packaged capabilities, installable from a registry: `nullclaw skills install <name>`.
- **A2A v0.3.0.** NullClaw exposes Google's agent-to-agent JSON-RPC, so external agents can call yours as a peer.
- **ACP.** `nullclaw acp` speaks the Agent Client Protocol over stdio for ACP-compatible editors; NullDesk drives NullClaw the same way.
- **Providers.** Any OpenAI-compatible endpoint works via `custom:https://...` — local inference servers included.
- **Vtable interfaces.** In-tree, everything is swappable: providers, channels, tools, memory engines, tunnels, runtimes, peripherals (Arduino, Raspberry Pi GPIO, STM32).

## Serve memory (NullPantry)

NullPantry exposes NullClaw-compatible memory routes (`/v1/agent`, `/v1/memory`, `/v1/agent-memory`, `/v1/agent-sessions`) — and conversely, its agent-memory layer proxies to 10+ external memory services (Mem0, Zep, Supermemory, Honcho and others) plus Redis, ClickHouse and Markdown workspaces. If you run a memory service, there may already be an adapter; backends are selected at compile time.

## Join the hub (manifest contract)

A component becomes hub-manageable by publishing a `nullhub-manifest.json` describing install, config, launch, health checks and wizard steps, and by supporting `--export-manifest` / `--from-json`. NullWatch is the smallest worked example of the pattern.

## Build UIs

Everything headless is deliberately headless so UIs can be thin:

- `nullhub api GET /api/... --pretty` — the hub API, plus its reverse proxies to NullBoiler, the NullTickets store, and NullWatch.
- nllclw's WebSocket channel (`ws://127.0.0.1:8765/ws?token=...`) with `chat`, `status`, `ping`, `close` message types — made for custom dashboards.
- NullWatch's query API for observability frontends; NullHub's Flight Recorder is one client of it, not the only possible one.

> [!NOTE]
> Pre-1.0: contracts can shift between releases. The OpenAPI-first services (NullTickets, NullBoiler, NullPantry) are the safest to code against, because the schema you fetch is the schema you get.
