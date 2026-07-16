---
title: Quickstart
description: Start the server, make a first request, and understand the defaults.
order: 2
verified: v2026.06.09
---

Five minutes from `zig build` to a running knowledge service. This page covers the defaults, the first requests, and where configuration comes from.

## Run the server

```bash
zig build run -- --db .nullpantry/nullpantry.db
```

Defaults:

| Setting | Default |
| --- | --- |
| host | `127.0.0.1` |
| port | `8765` |
| SQLite path | `.nullpantry/nullpantry.db` |
| auth | optional on loopback |
| record store | SQLite |

For the complete runtime flag list:

```bash
zig build run -- --help
```

## First requests

The running service publishes its own API manifest — start there:

```bash
curl -sS http://127.0.0.1:8765/v1/openapi.json
curl -sS http://127.0.0.1:8765/v1/agent/health
```

On loopback without a token these work as-is. With a token, add the header:

```bash
curl -sS -H 'Authorization: Bearer dev-token' http://127.0.0.1:8765/v1/vector/status
```

## Add a token

Loopback runs can skip auth while you experiment. For anything more, bind a token with scopes and capabilities:

```bash
NULLPANTRY_TOKEN='dev-token' \
NULLPANTRY_SCOPES='["admin"]' \
NULLPANTRY_CAPABILITIES='["read","write","propose","verify","delete","export","feed_apply"]' \
zig build run -- --db .nullpantry/dev.db
```

For multiple agents or users, use `NULLPANTRY_TOKEN_PRINCIPALS` instead — one token per actor. See [NullClaw memory](/docs/guides/nullclaw-memory/) for the full actor model.

## Where config comes from

Precedence, lowest to highest:

```text
defaults < home defaults < config file < environment variables < CLI flags
```

- `--config PATH` (or `-c PATH`, or `NULLPANTRY_CONFIG`) loads a strict JSON config file. Unknown fields are rejected at startup — typos fail loudly instead of being ignored.
- `--home PATH` (or `NULLPANTRY_HOME`) keeps all default local files under one directory and auto-loads `PATH/nullpantry.json` if it exists and is permission-safe.

```bash
NULLPANTRY_HOME="$HOME/nullhub/nullpantry" zig build run
```

> [!TIP]
> Keep secrets in the real process environment, not in CLI flags — environment variables override the config file, and flags override both.

## Next steps

- Point a NullClaw agent at this server: [NullClaw memory](/docs/guides/nullclaw-memory/).
- Swap SQLite for Postgres, add Redis memory or a vector store: [Backends](/docs/guides/backends/).
- Browse the full route surface: [API reference](/docs/reference/api/).
