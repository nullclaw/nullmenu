---
title: Manifests
description: The nullhub-manifest.json schema — how components describe their install, launch, health and wizard.
order: 2
verified: v2026.5.29
---

NullHub has no component-specific installers. Each component publishes a `nullhub-manifest.json` that declares how to fetch it, build it, configure it, launch it, and check its health — NullHub is a generic engine that interprets the manifest. This page documents the schema as parsed by `src/core/manifest.zig` at v2026.5.29. Unknown fields are ignored by the parser.

> [!WARNING]
> Pre-1.0: the manifest schema may change between releases. The current `schema_version` is `1`.

## Top-level fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `schema_version` | number | yes | Schema version; currently `1` |
| `name` | string | yes | Component id, e.g. `nullclaw` |
| `display_name` | string | yes | Human-readable name shown in the UI |
| `description` | string | yes | One-line description |
| `icon` | string | yes | Icon identifier |
| `repo` | string | yes | GitHub repo, `owner/name` |
| `platforms` | map | yes | Platform target → release asset (see below) |
| `build_from_source` | object | no | Fallback build recipe (see below) |
| `launch` | object | yes | How to start an instance |
| `health` | object | yes | Health-check spec |
| `ports` | array | yes | Declared ports |
| `wizard` | object | yes | Install-wizard steps |
| `depends_on` | array of strings | yes | Component ids this one needs |
| `connects_to` | array | yes | Optional integrations (see below) |

## `platforms`

Keys are target triples like `aarch64-macos`; values name the release asset and the binary inside it:

| Field | Description |
| --- | --- |
| `asset` | Release asset name, e.g. `nullclaw-macos-aarch64` |
| `binary` | Binary name inside the asset |

## `build_from_source`

Used when no prebuilt asset matches the platform:

| Field | Description |
| --- | --- |
| `zig_version` | Required Zig version (the family pins `0.16.0`) |
| `command` | Build command |
| `output` | Path of the produced binary |

## `launch`

| Field | Default | Description |
| --- | --- | --- |
| `command` | — | Subcommand or executable to launch |
| `args` | `[]` | Argument list |
| `env` | `null` | Environment variables as a JSON object |

## `health`

| Field | Default | Description |
| --- | --- | --- |
| `endpoint` | — | HTTP path to poll, e.g. `/health` |
| `port_from_config` | — | Config key holding the port, e.g. `gateway.port` |
| `interval_ms` | `15000` | Poll interval |

## `ports`

Each entry: `name`, `config_key` (where the value lives in the instance config), `default` (number), `protocol` (e.g. `http`). The wizard prompts for these, which is what makes [multi-instance](/docs/operate/multi-instance/) port separation work.

## `wizard.steps`

Each step:

| Field | Default | Description |
| --- | --- | --- |
| `id` | — | Step identifier |
| `title` | — | Prompt title |
| `description` | `""` | Longer prompt text |
| `type` | — | One of `select`, `multi_select`, `secret`, `text`, `number`, `toggle`, `dynamic_select` |
| `required` | `true` | Whether the step must be answered |
| `options` | `[]` | For selects: `value`, `label`, `description`, `recommended` |
| `default_value` | `""` | Pre-filled value |
| `dynamic_source` | `null` | For `dynamic_select`: a `command` producing options, plus `depends_on` step ids |
| `condition` | `null` | Show the step only when another step's answer matches |
| `advanced` | `false` | Tucked behind the advanced toggle |
| `group` | `null` | Visual grouping |

Conditions reference an earlier step and match with one of `equals`, `not_equals`, `contains`, or `not_in` (comma-separated exclusion list).

## `connects_to`

Declares optional integrations between components: `component` (target id), `role`, `description`, and `auto_config` (a JSON object NullHub applies to wire the two together). This is what drives the automatic NullTickets → NullBoiler linking during install.

## Minimal example

The parser's own test fixture:

```json
{
  "schema_version": 1,
  "name": "nullclaw",
  "display_name": "NullClaw",
  "description": "AI agent",
  "icon": "agent",
  "repo": "nullclaw/nullclaw",
  "platforms": {
    "aarch64-macos": { "asset": "nullclaw-macos-aarch64", "binary": "nullclaw" }
  },
  "launch": { "command": "gateway", "args": [] },
  "health": { "endpoint": "/health", "port_from_config": "gateway.port", "interval_ms": 15000 },
  "ports": [{ "name": "gateway", "config_key": "gateway.port", "default": 3000, "protocol": "http" }],
  "wizard": { "steps": [] },
  "depends_on": [],
  "connects_to": []
}
```

## Who publishes manifests

NullClaw, NullBoiler, NullTickets and NullWatch all ship manifest support — that set defines what `nullhub install` accepts. Cached manifests live under `~/.nullhub/`.
