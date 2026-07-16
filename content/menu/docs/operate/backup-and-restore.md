---
title: Backup and restore
description: Every component stores state in local files. Know where, copy them, sleep well.
order: 2
verified: v2026.5.29
---

No component in the family uses an external database or a cloud store. State is files in predictable places — which makes backup a matter of knowing the places.

## Where state lives

| Component | State | Contents |
| --- | --- | --- |
| NullHub | `~/.nullhub/` | Config, instances, downloaded binaries, logs, cached manifests, Mission Control replays |
| NullClaw | `~/.nullclaw/` | `config.json` (providers, channels, secrets), memory (SQLite by default), workspaces |
| NullBoiler | `~/.nullboiler/` + its SQLite db | Config, workflow files, run/checkpoint state |
| NullTickets | `~/.nulltickets/` + its SQLite db | Config; the db holds pipelines, tasks, leases, events, KV store |
| NullWatch | `~/.nullwatch/` | `config.json` plus `data/` — spans, runs, evals as JSONL |
| NullPantry | `.nullpantry/nullpantry.db` | Knowledge, memory atoms, vectors (default profile) |
| nllclw | user config + state dirs | `~/.config/nllclw/config.json`; state in the platform state dir |
| NullDesk | `<workspace>/.nulldesk/` | Tasks, patches, memory, artifacts, `events.jsonl` audit log |

Docker installs keep the same state in named volumes: `nullhub-data`, `nullclaw-data`, and for NullPantry's container, `/var/lib/nullpantry`.

Instance homes are movable: `NULLBOILER_HOME` and `NULLTICKETS_HOME` relocate those components' directories, `--home` does it for NullPantry. If you set these, your backup paths move too.

## Taking a backup

SQLite databases (NullTickets, NullBoiler, NullClaw memory, NullPantry) should not be copied mid-write — NullBoiler runs WAL mode, and a half-copied WAL is a corrupt restore. Stop first:

```bash
nullhub stop-all
```

Then copy the directories with whatever you trust:

```bash
tar czf null-backup-$(date +%F).tar.gz \
  ~/.nullhub ~/.nullclaw ~/.nullboiler ~/.nulltickets ~/.nullwatch
```

Bring everything back up:

```bash
nullhub start-all && nullhub status
```

For Docker volumes, run a throwaway container that tars the volume, or use your volume-backup tooling of choice.

> [!WARNING]
> `~/.nullclaw/config.json` contains provider API keys and channel credentials, and other components' configs hold API tokens. Treat backups as secrets: encrypt them, and keep them off shared storage. See [Secrets and networking](/docs/operate/secrets-and-networking/).

> [!TIP]
> NullWatch's JSONL files are append-only, which makes them friendly to incremental backup tools — only new lines change. NullDesk's `events.jsonl` behaves the same way.

## Restoring

1. Stop everything (`nullhub stop-all`, plus any standalone components).
2. Unpack the backup over the state directories.
3. Match binary versions to the backup: state written by `v2026.5.29` should be read by `v2026.5.29`. Pre-1.0, schema compatibility across versions is not promised. Pin image tags or keep old release binaries around.
4. Start and verify: `nullhub status`, `nullclaw doctor`, `curl` the health endpoints.

## What you can skip

- `~/.nullhub/` cached binaries — the hub re-downloads them.
- Logs, unless you want the history.
- Anything reproducible from your own git repos (NullBoiler workflow JSON is better versioned in git than in backups — it hot-reloads from `workflows/` anyway).

The one file to never skip: the NullTickets database. It is the source of truth for what your agents were doing — lose it and the backlog is gone, which rather defeats [the durable backlog](/docs/recipes/durable-backlog/).
