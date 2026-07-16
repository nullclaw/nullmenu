---
title: Installing components
description: Add NullClaw, NullBoiler, NullTickets and NullWatch through the manifest-driven wizard.
order: 1
verified: v2026.5.29
---

NullHub is a generic install engine: each component publishes a `nullhub-manifest.json` that describes how to fetch it, configure it, launch it, and check its health. NullHub interprets the manifest and runs the wizard — it has no component-specific installers baked in.

## What it can install

| Component | What you get |
| --- | --- |
| [NullClaw](https://claw.nullmenu.ai/) | The agent runtime, plus an instance-scoped admin API (status, config, models, cron, channels, skills) |
| [NullBoiler](https://boiler.nullmenu.ai/) | Workflow orchestration, with a workflow editor and run monitoring in the dashboard |
| [NullTickets](https://tickets.nullmenu.ai/) | Durable task state, with a key-value store browser proxied through NullHub |
| [NullWatch](https://watch.nullmenu.ai/) | Tracing and evals, rendered in the Flight Recorder page |

That list is the whole list. NullPantry, NullDesk, NullCap and nllclw are not hub-installable today — install those from their own repos.

## Terminal wizard

```bash
nullhub install nullclaw
```

The wizard is defined by the component's manifest: select steps, secrets (API keys), text and number fields, toggles — some conditional on earlier answers, some marked advanced. Answer the prompts and NullHub downloads the platform binary (or builds from source when the manifest defines that), writes config, and registers the instance.

The web UI's **Install Component** flow runs the same wizard steps in the browser. Pick whichever you prefer; the result is identical.

## Example: a local NullWatch

From the README's own walkthrough:

1. Start NullHub (`nullhub serve --no-open` if you don't want a browser).
2. In the web UI, open **Install Component**, select **NullWatch**, keep or set the API port to `7710`, and finish the wizard.
3. The installer starts the NullWatch instance, and NullHub's `/api/nullwatch/*` proxy discovers it automatically — the Flight Recorder page starts rendering run summaries, spans, evals, token usage and cost without further wiring.

## Cross-component linking

Manifests declare `depends_on` and `connects_to` relationships, and NullHub acts on them. The concrete case today: installing NullTickets and NullBoiler locally auto-connects them — NullHub generates the native tracker config and lets you inspect queue and orchestrator status from one UI.

## Lifecycle after install

```bash
nullhub start nullclaw/main      # or stop, restart
nullhub start-all                # everything at once
nullhub status                   # who's up, who's not
nullhub logs nullclaw/main -f    # follow logs
nullhub uninstall nullclaw/main  # remove an instance
```

Uninstalling removes the instance; the component's binary and your other instances are untouched. You can run several instances of one component side by side — see [Multi-instance](/docs/operate/multi-instance/).

> [!NOTE]
> Pre-1.0: wizard steps and manifest fields may change between releases. The manifest schema as currently parsed is documented in [Manifests](/docs/reference/manifests/).
