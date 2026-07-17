---
title: Providers
description: Connect ~60 model providers, set the default route, and add fallbacks and auto-routing.
order: 2
verified: v2026.5.29
---

NullClaw talks to ~60 AI providers through one vtable interface — OpenRouter, Anthropic, OpenAI, Azure OpenAI, Gemini, Vertex AI, Ollama, Groq, Mistral, xAI, DeepSeek, Bedrock and more — plus any OpenAI-compatible endpoint you point it at.

## Credentials

Providers live under `models.providers`. Each entry takes at minimum an `api_key`:

```json
{
  "models": {
    "providers": {
      "openrouter": { "api_key": "sk-or-..." },
      "anthropic": { "api_key": "sk-ant-...", "base_url": "https://api.anthropic.com" },
      "groq": { "api_key": "gsk_..." }
    }
  }
}
```

Common per-provider fields:

| Field | Purpose |
| --- | --- |
| `api_key` | Credential for that provider entry |
| `base_url` | Override for custom or self-hosted OpenAI-compatible endpoints |
| `api_mode` | `chat_completions` or `responses`, for compatible providers |
| `user_agent` | Optional `User-Agent` header override |
| `max_streaming_prompt_bytes` | Skip streaming above this estimated prompt size |

With `secrets.encrypt` enabled, API keys are encrypted at rest with ChaCha20-Poly1305 using a local key file.

## The default model route

The default model is a `provider/vendor/model` route under `agents.defaults`:

```json
{
  "agents": {
    "defaults": {
      "model": { "primary": "openrouter/anthropic/claude-sonnet-4" }
    }
  }
}
```

Any OpenAI-compatible API works via a custom route of the form `custom:https://your-api.com` — no code changes, no plugin.

## Auto-routing with `model_routes`

Optionally, NullClaw can pick a model per turn. Each route maps a hint to a provider and model; recognized hints are `fast`, `balanced`, `deep`, `reasoning`, and `vision`:

```json
{
  "model_routes": [
    { "hint": "fast", "provider": "groq", "model": "llama-3.3-70b", "cost_class": "free" },
    { "hint": "balanced", "provider": "openrouter", "model": "anthropic/claude-sonnet-4" },
    { "hint": "deep", "provider": "openrouter", "model": "anthropic/claude-opus-4", "cost_class": "premium" }
  ]
}
```

Short structured tasks prefer `fast`; investigation and planning prefer `deep`/`reasoning`; image turns use `vision`; everything ambiguous stays on `balanced`. Routes that hit rate limits are temporarily degraded and skipped until their cooldown expires.

In `nullclaw agent`:

- `/model` shows the current model, routing status, and the last auto-route decision.
- `/model <provider/model>` pins the session and disables auto-routing.
- `/model auto` clears the pin and re-enables routes.

Starting with `--model` or `--provider` also pins the run.

## Retries and fallbacks

The `reliability` section controls what happens when a provider fails:

```json
{
  "reliability": {
    "provider_retries": 2,
    "provider_backoff_ms": 500,
    "fallback_providers": ["groq", "openai"],
    "model_fallbacks": [
      { "model": "anthropic/claude-sonnet-4", "fallbacks": ["openai/gpt-4o", "groq/llama-3.3-70b"] }
    ]
  }
}
```

If you hold multiple keys for one provider, add `reliability.api_keys` and NullClaw rotates them on 429 errors.

## Inspecting models from the CLI

```bash
nullclaw models list        # providers and default models
nullclaw models info <model>
nullclaw models benchmark   # model latency benchmark
nullclaw models refresh     # refresh the model catalog
```

For OAuth-based access, `nullclaw auth login openai-codex` runs a device flow (`--import-codex` imports existing `~/.codex/auth.json` credentials). `auth` currently supports only `openai-codex`.

> [!TIP]
> Vertex AI accepts either a bearer token or a full Google service-account JSON object as `api_key`. Service-account mode needs `openssl` on `$PATH` for JWT signing.

## Next

Models chosen — now decide what the agent remembers in [Memory](/docs/configure/memory/).
