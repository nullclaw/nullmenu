---
title: Overview
description: What NullCap is, how it routes everything through NullHub, and what it stores.
order: 1
---

NullCap is a desktop overlay for live calls — interviews, meetings, sales calls, demos. It renders cue cards, transcripts and post-call notes on top of your screen, and it talks to exactly one service: your local [NullHub](https://hub.nullmenu.ai/).

## The runtime contract

NullCap is architecturally strict about where data goes. From the project's own runtime contract:

- It never calls model or transcription providers directly.
- It never calls NullClaw directly.
- NullHub is expected at `http://127.0.0.1:19800` unless configured otherwise.
- The selected instance defaults to `nullclaw/nullcap`; all model work runs over instance-scoped NullHub routes.
- No provider API keys are ever stored locally.

In ecosystem terms: [NullHub](https://hub.nullmenu.ai/) is the gateway, [NullClaw](https://claw.nullmenu.ai/) does the model work behind it, and approved action items can be exported toward [NullTickets](https://tickets.nullmenu.ai/) and other trackers (text, JSON, Jira, Linear, Asana formats).

## Session modes

The session mode shapes every cue, prompt and post-call artifact. The default is `interview`; the others are `meeting`, `demo`, `sales`, `debug`, `system-design` and `general`.

```bash
zig build run -- mode meeting
zig build run -- mode system-design
```

Each mode gets its own scorecard shape after the call (`postcall --mode sales`, for example).

## What it stores

Local state lives under `~/.nullcap` — sessions, chats, transcripts, knowledge, jobs, skills, calendar and telemetry. The defaults are conservative:

- Transcript context is kept in memory only.
- Local logging is disabled by default.
- Persistence is opt-in per store (`privacy.save_transcript`, `privacy.save_conversations`), with retention windows (`privacy.retention_minutes`) and `privacy purge` to clear expired data.

`zig build run -- config path` prints where the private config file actually is.

## Screen sharing and the overlay

The overlay window asks the OS to exclude it from screen capture — `NSWindowSharingNone` on macOS, `WDA_EXCLUDEFROMCAPTURE` on Windows — so it does not appear in Zoom, Meet, Teams or OBS shares.

> [!WARNING]
> The project's own `docs/stealth.md` scopes this narrowly. NullCap does not defeat proctoring software (Pearson VUE, ProctorU, Respondus Lockdown), kernel capture drivers, or HDMI capture cards, and does no runtime process-name spoofing. It is a presentation convenience, not a proctoring bypass. Use it where AI assistance is permitted.

## Status

NullCap is experimental. There are no tagged releases and no license file yet; the only install path is building from source.

> [!NOTE]
> Unreleased: nothing is tagged yet, and config and CLI may change without notice.

Next: [Build and run](/docs/start/build-and-run/).
