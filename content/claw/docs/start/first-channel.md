---
title: Your first channel
description: Connect NullClaw to Telegram (or any of the 19 channels) and lock it down with allowlists.
order: 3
verified: v2026.5.29
---

A channel is how people reach your agent: Telegram, Discord, Signal, Slack, WhatsApp, Matrix, IRC, Email, Nostr and more — 19 in total, the CLI included. This page walks through Telegram, the most common first choice.

## Configure the channel

The channel wizard reconfigures channels and allowlists without touching the rest of your setup:

```bash
nullclaw onboard --channels-only
```

Or edit `~/.nullclaw/config.json` directly. Channels use `accounts` wrappers — the object key becomes the account id:

```json
{
  "channels": {
    "telegram": {
      "accounts": {
        "main": {
          "bot_token": "123:ABC",
          "allow_from": ["user1"],
          "reply_in_private": true
        }
      }
    }
  }
}
```

Get the `bot_token` from Telegram's @BotFather, and put your own user id in `allow_from`.

## Allowlists: empty means deny

Every channel sits behind an allowlist. The rules are strict on purpose:

- Empty `allow_from` **denies inbound messages** on allowlist-based channels.
- Explicit ids make a private bot — the usual setup.
- `"allow_from": ["*"]` allows everyone. High-risk; opt in deliberately.

> [!WARNING]
> Do not set `"*"` on a bot that has shell or file tools enabled unless you have read [Security](/docs/operate/security/) and tightened autonomy limits first.

## Start it

Channels can run individually in the foreground, or all together under the gateway:

```bash
# just this channel
nullclaw channel start telegram

# or the full runtime: gateway + all configured channels + heartbeat + scheduler
nullclaw gateway
```

Then check health:

```bash
nullclaw channel status
nullclaw channel list          # known and configured channels
nullclaw channel info telegram # accounts configured for one channel type
```

## If nothing arrives

Work through these in order:

1. `nullclaw channel status` — is the channel healthy?
2. Check `channels.telegram.accounts.*` — token typos are the usual suspect.
3. Check gating settings: `allow_from`, `group_allow_from`, `require_mention` and similar per-channel keys.
4. `nullclaw doctor` for exact error details.

## Beyond Telegram

The same `accounts` pattern applies across channels. A Discord account takes `token`, `guild_id`, `allow_from` and `allow_bots`; IRC takes `host`, `port`, `nick`, `channel` and `tls`. Two channels have extra prerequisites worth knowing:

- **Nostr** uses [`nak`](https://github.com/fiatjaf/nak) under the hood — install it and make sure it's on `$PATH`. The onboarding wizard can generate or import a keypair and encrypts it at rest. Your `owner_pubkey` is always allowed through the DM policy.
- **WhatsApp** and **Telegram webhooks** flow through the HTTP gateway with their own verification rules — see [Gateway and service](/docs/operate/gateway-and-service/).

One agent per chat is only the beginning: named agent profiles can be bound to specific chats or Telegram forum topics with `/bind` — each with its own workspace and memory namespace. The binding pattern lives in [Configuration](/docs/configure/configuration/).

## Next

Your agent talks. Now decide what it remembers — [Memory](/docs/configure/memory/) — and which models it thinks with — [Providers](/docs/configure/providers/).
