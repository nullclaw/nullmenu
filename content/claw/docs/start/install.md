---
title: Install
description: Get the NullClaw binary via Homebrew, Docker, or a source build with Zig 0.16.0.
order: 1
verified: v2026.5.29
---

NullClaw ships as a single static binary with no runtime dependencies besides libc. The chef travels light: pick one of the paths below and you are done in a minute or two.

> [!NOTE]
> Pre-1.0: config and CLI may change between releases.

## Homebrew (recommended for macOS and Linux)

```bash
brew install nullclaw
nullclaw --help
```

If the help output prints, the install is complete.

To upgrade later:

```bash
brew update
brew upgrade nullclaw
```

## Docker or Podman

NullClaw publishes an official OCI image at `ghcr.io/nullclaw/nullclaw`. The container keeps all persistent state under `/nullclaw-data` — config at `/nullclaw-data/config.json`, workspace at `/nullclaw-data/workspace`.

```bash
# one-off command
docker run --rm -it \
  -v nullclaw-data:/nullclaw-data \
  ghcr.io/nullclaw/nullclaw:latest status

# initialize config interactively
docker run --rm -it \
  -v nullclaw-data:/nullclaw-data \
  ghcr.io/nullclaw/nullclaw:latest onboard --interactive

# run the HTTP gateway on host loopback
docker run --rm -it \
  -p 127.0.0.1:3000:3000 \
  -v nullclaw-data:/nullclaw-data \
  ghcr.io/nullclaw/nullclaw:latest
```

The repository also ships a Makefile wrapper around Docker Compose:

```bash
make build
make config
make up
```

`make config` runs `nullclaw onboard --interactive` inside the container. Pass only non-secret flags through `CONFIG_ARGS` — command-line arguments can leak via shell history and process listings:

```bash
make config CONFIG_ARGS="--provider openrouter"
```

## Build from source

You need **Zig 0.16.0 exactly**. Other versions are unsupported and may fail to build. Check first:

```bash
zig version   # must print 0.16.0
```

Then:

```bash
git clone https://github.com/nullclaw/nullclaw.git
cd nullclaw
zig build -Doptimize=ReleaseSmall
zig build test --summary all
```

The binary lands at `zig-out/bin/nullclaw`. To put it on your `PATH`:

```bash
zig build -Doptimize=ReleaseSmall -p "$HOME/.local"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
# bash users: ~/.bashrc
```

## Android / Termux

Official releases include pre-built Android/Termux binaries for `aarch64`, `armv7`, and `x86_64`. You can also build natively on the device:

```bash
pkg update
pkg install git zig
git clone https://github.com/nullclaw/nullclaw.git
cd nullclaw
zig build -Doptimize=ReleaseSmall
./zig-out/bin/nullclaw --help
```

On Android, prefer foreground use (`agent`, `gateway`) before trying service mode.

## Verify

```bash
nullclaw --help
nullclaw --version
nullclaw status
```

If `status` returns component state, the runtime basics are ready.

## Keeping it current

The binary can update itself:

```bash
nullclaw update --check   # check only
nullclaw update --yes     # install without prompting
```

Releases use CalVer tags (`vYYYY.M.D`); `nullclaw --version` prints the version embedded from the git tag.

## Next

Continue with [Quickstart](/docs/start/quickstart/) to onboard a provider and send your first message.
