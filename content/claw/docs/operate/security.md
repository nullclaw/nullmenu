---
title: Security
description: The layers NullClaw enforces by default, the settings that widen them, and how to audit for leaked secrets.
order: 2
verified: v2026.5.29
---

NullClaw is secure by default: loopback bind, pairing auth, sandbox isolation, workspace scoping, least privilege. This page describes each layer and — more importantly — which settings switch them off.

## Baseline controls

| Control | Default | How |
| --- | --- | --- |
| Gateway not publicly exposed | On | Binds `127.0.0.1`; refuses public bind without tunnel or explicit `allow_public_bind` |
| Pairing required | On | One-time 6-digit code, exchanged via `POST /pair` for a bearer token |
| Filesystem scoped | On | `workspace_only = true`; null-byte injection blocked, symlink escapes detected |
| Tunnel-aware exposure | On | Public access expected via Tailscale, Cloudflare, ngrok, or custom tunnel |
| Sandbox isolation | On | Auto-selects Landlock, Firejail, Bubblewrap, or Docker |
| Encrypted secrets | On | ChaCha20-Poly1305 with a local key file |
| Resource limits | Configurable | Memory, CPU, disk, subprocess limits |
| Audit logging | Configurable | Signed event trail with retention policy |

A sensible hardened block:

```json
{
  "gateway": { "host": "127.0.0.1", "port": 3000, "require_pairing": true, "allow_public_bind": false },
  "autonomy": { "level": "supervised", "workspace_only": true, "max_actions_per_hour": 20 },
  "security": {
    "sandbox": { "backend": "auto" },
    "audit": { "enabled": true, "retention_days": 90 }
  }
}
```

## Channel allowlists

- Empty `allow_from` denies inbound messages on allowlist-based channels.
- Explicit user ids make a private bot.
- `"allow_from": ["*"]` allows all sources — high-risk, explicit opt-in.
- Nostr: the `owner_pubkey` is always allowed regardless of `dm_allowed_pubkeys`; private keys are stored encrypted (`enc2:` prefix) and decrypted in memory only while the channel runs.

## Shell environment

Only a minimal set of variables (`PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`) is passed to shell child processes, so a tool call cannot read your API keys out of the environment. If mounted tooling needs path-style variables like `LD_LIBRARY_PATH`, declare them in `tools.path_env_vars` — every path component is canonicalized and validated against the workspace and `allowed_paths` before the variable passes through; one bad component drops the whole variable.

## High-risk settings

These widen trust boundaries. Use them only in controlled environments:

- `autonomy.level = "full"` or `"yolo"`
- `allowed_commands = ["*"]` and `allowed_paths = ["*"]`
- `block_high_risk_commands = false` — enables destructive commands (`rm`, `sudo`, `dd`, `mkfs`)
- `block_medium_risk_commands = false` — enables network/transfer commands (`curl`, `wget`, `nc`, `scp`) and local mutations
- `gateway.allow_public_bind = true`

> [!DANGER]
> Combining a `"*"` channel allowlist with `autonomy.level = "full"` hands shell access to anyone who can message your bot. Never do this on a machine you care about.

## PII redaction

When redaction is enabled, detected sensitive values (emails, phones, Luhn-valid cards, id and token patterns) are replaced with deterministic placeholders like `[EMAIL_1]` before provider calls, session persistence, memory autosave, diagnostics, and embedding sync. The redactor is one-way by default — it keys values by HMAC-SHA256 fingerprints and keeps no plaintext. It is a text scanner, not a DLP engine: images, OCR text and EXIF metadata are out of scope. The `anonymize_text` tool exposes the same primitive for one-off snippets.

## Auditing your workspace for secrets

`nullclaw workspace audit` scans the workspace, a staged Git diff, or a revision range for likely leaks — token-prefix fingerprints (`AKIA…`, `ghp_`, `sk-`, `xoxb-` and friends), PEM blocks, credentials in URLs, and high-entropy strings:

```bash
nullclaw workspace audit
nullclaw workspace audit --staged
nullclaw workspace audit --json --fail-on high   # CI-friendly exit codes
```

Detection runs entirely locally. An optional second stage, `--llm-triage external`, classifies findings via your configured LLM using privacy-preserving envelopes — the raw secret value never leaves the machine, and `--llm-triage dry-run` prints exactly what would be sent before you enable it.

## Reporting

Found a vulnerability in NullClaw itself? Follow the repo's [SECURITY.md](https://github.com/nullclaw/nullclaw/blob/main/SECURITY.md).

> [!NOTE]
> Pre-1.0: config and CLI may change between releases — re-review this page after upgrades that touch gateway or autonomy settings.
