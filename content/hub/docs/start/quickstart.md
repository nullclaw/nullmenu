---
title: Quickstart
description: Start the server, open the dashboard, install your first component.
order: 2
verified: v2026.5.29
---

From zero to a supervised agent in a few commands. This assumes you already have the binary — if not, see [Install](/docs/start/install/).

## 1. Start the server

```bash
nullhub
```

This starts the server and opens your browser at the dashboard. NullHub tries a chain of local addresses, in order:

1. `http://nullhub.local:19800` — published via `dns-sd`/Bonjour or `avahi-publish` when available
2. `http://nullhub.localhost:19800`
3. `http://127.0.0.1:19800`

If you want the server without the browser popping open, or on a different address:

```bash
nullhub serve --host 127.0.0.1 --port 19800 --no-open
```

`serve` also accepts repeated `--allowed-origin ORIGIN` flags to authorize extra CORS origins (a Tailscale domain, for instance). The same list can come from the `NULLHUB_ALLOWED_ORIGINS` environment variable, comma-separated.

## 2. Install a component

The terminal wizard walks you through provider, ports, and keys. The web UI's **Install Component** flow uses the same steps:

```bash
nullhub install nullclaw
```

NullHub can install and manage four components: [NullClaw](https://claw.nullmenu.ai/), [NullBoiler](https://boiler.nullmenu.ai/), [NullTickets](https://tickets.nullmenu.ai/), and [NullWatch](https://watch.nullmenu.ai/). Details in [Installing components](/docs/guides/install-components/).

## 3. Run it and look at it

```bash
# start everything that's installed
nullhub start-all

# table of all instances, or one instance in detail
nullhub status
nullhub status nullclaw/main

# follow logs live
nullhub logs nullclaw/main -f
```

Instances are addressed as `{component}/{instance-name}` everywhere in the CLI and the API.

## 4. Check the dashboard

Open the dashboard and you get status cards with periodic health checks, per-instance config editors, live log streaming over SSE, and the component UIs (workflow editor, store browser, Flight Recorder). Tour in [Web dashboard](/docs/guides/web-dashboard/).

## What just happened

- The component's binary was downloaded (or built) according to its published `nullhub-manifest.json` — see [Manifests](/docs/reference/manifests/).
- Its config, binary, and logs landed under `~/.nullhub/`.
- The supervisor now restarts it on crashes, with backoff, and polls its health endpoint.

> [!TIP]
> Everything the dashboard does goes through the same HTTP API. `nullhub api GET /api/instances/nullclaw/main/status --pretty` shows you the raw JSON — useful for scripting before you reach for the [CLI reference](/docs/reference/cli/).
