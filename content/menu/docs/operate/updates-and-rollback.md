---
title: Updates and rollback
description: Keep components current with NullHub, and recover when an update misbehaves.
order: 1
verified: v2026.5.29
---

Everything in the family is versioned with CalVer (`v2026.x.y`) and pre-1.0, so updates deserve a little ceremony. NullHub handles the mechanics for managed components; the rest update the way they were installed.

## Hub-managed components

Check what is stale, then update:

```bash
nullhub check-updates
nullhub update nullclaw/<instance>
nullhub update-all
```

An update downloads the new binary, migrates the instance config, and — if anything fails — rolls back to the previous version. That rollback is built in; you don't have to arrange it.

The dashboard exposes the same one-click updates with the same migration-and-rollback behavior.

> [!WARNING]
> Pre-1.0 means config and CLI may change between releases across the whole family. Skim the release notes on GitHub before `update-all` on a stack you care about. CalVer tags tell you when something was released, not how mature it is.

## NullHub itself

The hub does not update itself through `nullhub update`. Refresh it the way you installed it:

- **Docker**: pull the new image and recreate the container. State survives in the `nullhub-data` volume.

  ```bash
  docker pull ghcr.io/nullclaw/nullhub:latest
  ```

- **Release binary**: download the new binary from [GitHub releases](https://github.com/nullclaw/nullhub/releases) and replace the old one. State lives under `~/.nullhub/`, separate from the binary.
- **Source**: `git pull && zig build`.

If you registered an OS service (`nullhub service install`), restart it after replacing the binary.

## Standalone NullClaw

NullClaw has a self-updater:

```bash
nullclaw update --check    # see what's available
nullclaw update --yes      # apply without prompting
```

If you installed via Homebrew, update through Homebrew instead, so the formula and binary stay in sync. Docker installs update by pulling the newer image tag.

## Non-managed components

NullPantry, nllclw, NullDesk and NullCap are outside the hub's reach:

| Component | Update path |
| --- | --- |
| NullPantry | Pull a newer image: `docker pull ghcr.io/nullclaw/nullpantry:latest` (or a pinned tag like `v2026.06.09`); or rebuild from source |
| nllclw | Download the newer release binary and replace |
| NullDesk, NullCap | No releases yet — `git pull` and rebuild |

## Rolling back by hand

For anything the hub does not manage, rollback is manual but simple because state and binary are separate:

1. Stop the component.
2. Put back the previous binary (or pin the previous image tag — CalVer tags like `v2026.5.29` stay available).
3. Restore the component's state directory from [backup](/docs/operate/backup-and-restore/) if the newer version migrated data.
4. Start it and verify with its health check (`nullclaw doctor`, `curl .../health`).

Step 3 is the one people skip. A newer version may have rewritten SQLite schemas or config keys; an old binary reading new state is undefined territory. Back up before updating and rollbacks stay boring.

## A sensible cadence

Nightly builds exist (NullClaw publishes rolling prereleases) but tagged releases are the ones to run. Update the hub first, then managed components via `update-all`, then standalone pieces. One course at a time.
