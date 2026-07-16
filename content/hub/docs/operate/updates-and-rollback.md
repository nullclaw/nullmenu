---
title: Updates and rollback
description: Check for new component versions, update with config migration, roll back on failure.
order: 1
verified: v2026.5.29
---

NullHub updates the components it manages: it checks upstream for new releases, downloads them, migrates config, and rolls back when an update fails. You never hand-edit a component's install to move it forward.

## Check what's stale

```bash
nullhub check-updates
```

This compares each installed instance against the component's latest release. The dashboard shows the same information on the status cards.

## Update

```bash
# one instance
nullhub update nullclaw/main

# everything at once
nullhub update-all
```

An update is three steps, in order:

1. **Download** — the new version's platform binary is fetched into `~/.nullhub/`.
2. **Migrate** — the instance's config is carried over to the new version.
3. **Verify or roll back** — if the update fails, NullHub restores the previous version rather than leaving the instance broken.

The web UI exposes the same flow as one-click updates per instance.

## Version numbers

The whole family uses calendar versioning — `v2026.5.29` is a date, not a maturity signal. Two consequences worth internalizing:

- There is no semver contract. A new release may change config shape or CLI flags; the migration step exists precisely because of this.
- "Latest" moves often. `check-updates` is cheap — run it routinely, or script it via `nullhub api`.

> [!WARNING]
> Pre-1.0: config and CLI may change between releases. Read the component's release notes before `update-all` on a setup you care about.

## Updating NullHub itself

`nullhub update` handles managed components, not the hub binary. To update NullHub, replace the binary the same way you installed it — pull the newer Docker tag, download the newer release asset, or rebuild from source. State under `~/.nullhub/` is separate from the binary and survives the swap.

If you registered NullHub as an OS service, restart it after the swap:

```bash
nullhub service status
```

## When something goes wrong

- `nullhub status <c>/<n>` shows single-instance detail, including health.
- `nullhub logs <c>/<n> -f` follows the instance's logs live.
- The supervisor restarts crashed instances with backoff, so a bad update that starts-then-dies is visible as a crash loop in the logs rather than a silent absence.

A failed update that triggered rollback leaves the previous version running. Fix the cause (often a config value the new version rejects — `nullhub config <c>/<n> --edit`), then update again.
