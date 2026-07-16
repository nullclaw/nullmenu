---
title: Build and run
description: Build NullDesk from source with Zig 0.16.0 and run the GUI, TUI, or local web frontend.
order: 2
---

NullDesk has no packages and no release binaries yet — you build it from source. One `zig build` produces a single binary that serves all three frontends.

## Requirements

- Zig 0.16.0 or newer.
- macOS with Xcode Command Line Tools for the native AppKit GUI. The TUI and web frontends are cross-platform.
- `git` and `bash` for the repository test gates.

## Build

```bash
git clone https://github.com/nullclaw/nulldesk
cd nulldesk

# debug binary
zig build

# release build
zig build -Doptimize=ReleaseSafe
```

The installed binary lands in `./zig-out/bin/nulldesk`. Check it works:

```bash
./zig-out/bin/nulldesk --help
```

## Run a frontend

Point NullDesk at a workspace — the directory whose files and tasks you want to operate on:

```bash
# default frontend
zig build run -- --workspace "$PWD"

# explicit frontends
zig build run -- gui --workspace "$PWD"
zig build run -- tui --workspace "$PWD"

# web frontend: build the SPA first, then serve
zig build web
zig build run -- web --workspace "$PWD"
```

`zig build web` builds the SvelteKit SPA and the browser WASM search module into `web/build`. `nulldesk web` then starts a local HTTP server on `127.0.0.1:8765` by default and prints the URL.

> [!NOTE]
> The web server binds to loopback only. Use `--web-host` and `--web-port` if you need a different bind address — but the local-only default is the point.

## Connect an agent

NullDesk drives [NullClaw](https://claw.nullmenu.ai/) as its agent runtime. Pass the path to your `nullclaw` binary; NullDesk starts it as `nullclaw acp` and speaks ACP over stdio — no separate adapter needed.

```bash
zig build run -- \
  --workspace /path/to/workspace \
  --nullclaw-bin /path/to/nullclaw \
  --keymap vscode \
  --editing-style standard \
  --web-out /path/to/nulldesk.html
```

## Flags

| Flag | Values | What it does |
| --- | --- | --- |
| `--workspace` | path | Workspace directory to operate on |
| `--nullclaw-bin` | path | NullClaw binary, started as `nullclaw acp` over stdio |
| `--keymap` | `vscode` `emacs` `vim` `helix` `jetbrains` | Keybinding preset; GUI defaults to `vscode`, TUI to `vim` |
| `--editing-style` | `standard` `modal` | Force an editing style; without an explicit keymap, `standard` falls back to `vscode`, `modal` to `vim` |
| `--web-host` | host | Web bind address (default `127.0.0.1`) |
| `--web-port` | port | Web port (default `8765`) |
| `--web-out` | path or `-` | Standalone HTML export; `-` writes to stdout |

## Limit what agents can see

Workspace agent scope lives in `.nulldesk/config.json`:

```json
{
  "version": 1,
  "allowed_scopes": ["."]
}
```

Use relative paths such as `["docs", "src/runtime"]` to limit which workspace files can be attached to agent sessions or accepted from agent responses. Everything else NullDesk keeps — tasks, patches, memory, artifacts, the events timeline — also lives under `.nulldesk/` as plain files.

## Verify the build

The repository's main verification gates:

```bash
zig build test --summary all
tests/smoke.sh
git diff --check
```

> [!WARNING]
> Pre-1.0: config and CLI may change between releases. There are no releases or tags yet, so `main` is the only version there is.

For deeper build, release, and troubleshooting notes, see `docs/development.md` in the repo. For what all of this is for, go back to the [overview](/docs/start/overview/).
