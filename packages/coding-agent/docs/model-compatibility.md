# Model Compatibility

Reference charts for all supported providers, models, capabilities, APIs, and pricing.

---

## Table of Contents

- [Provider Matrix](#provider-matrix)
- [Model Matrix](#model-matrix)
- [API Types](#api-types)
- [Capability Matrix](#capability-matrix)
- [Thinking Format Compatibility](#thinking-format-compatibility)
- [Prompt Caching Support](#prompt-caching-support)
- [Image Support](#image-support)
- [Pricing Guide](#pricing-guide)
- [Local Model Setup](#local-model-setup)

---

## Provider Matrix

| Provider | Auth Type | Env Variable / Login | Supported APIs | Models |
|----------|-----------|---------------------|----------------|--------|
| **Anthropic** | API key | `ANTHROPIC_API_KEY` | `anthropic-messages` | Claude 3.5/4/4.5, Fable 5 |
| **Anthropic Subscription** | OAuth | `/login` | `anthropic-messages` | Claude Pro/Max |
| **OpenAI** | API key | `OPENAI_API_KEY` | `openai-responses` | GPT-4, GPT-4o, o-series, GPT-4.1, GPT-5.x |
| **OpenAI Codex** | OAuth | `/login` (ChatGPT Plus/Pro) | `openai-codex-responses` | GPT-5.x Codex Spark, o-series |
| **Google Gemini** | API key | `GEMINI_API_KEY` | `google-generative-ai` | Gemini 2.0/2.5 Flash/Pro |
| **Google Vertex AI** | ADC | `gcloud auth application-default login` | `google-vertex` | Gemini 2.5 Flash/Pro, Claude on Vertex |
| **Amazon Bedrock** | AWS profile / IAM | `AWS_PROFILE` or `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | `bedrock-converse-stream` | Nova, Claude on Bedrock |
| **Azure OpenAI** | API key | `AZURE_OPENAI_API_KEY` + `AZURE_OPENAI_BASE_URL` | `azure-openai-responses` | GPT-4, GPT-4o, o-series |
| **GitHub Copilot** | OAuth | `/login` | `openai-completions`, `anthropic-messages` | Claude Fable 5, Haiku 4.5, Sonnet 4, GPT-4o, o-series |
| **DeepSeek** | API key | `DEEPSEEK_API_KEY` | `openai-completions` | DeepSeek V4 Flash/Pro |
| **Mistral** | API key | `MISTRAL_API_KEY` | `mistral-conversations` | Codestral, Devstral, Mistral Large/Small |
| **Groq** | API key | `GROQ_API_KEY` | `openai-completions` | Llama 3.x, Mixtral, Gemma 2 |
| **Cerebras** | API key | `CEREBRAS_API_KEY` | `openai-completions` | GPT OSS 120B, Z.AI GLM |
| **OpenRouter** | API key | `OPENROUTER_API_KEY` | `openai-completions` | 300+ models via routing |
| **Fireworks** | API key | `FIREWORKS_API_KEY` | `anthropic-messages` | DeepSeek V4, Llama, Qwen, Mixtral |
| **Together AI** | API key | `TOGETHER_API_KEY` | `openai-completions` | MiniMax, DeepSeek, Llama, Qwen |
| **Hugging Face** | API key / token | `HF_TOKEN` | `openai-completions` | MiniMax M2/M2.1, community models |
| **xAI** | API key | `XAI_API_KEY` | `openai-completions` | Grok 3, Grok 3 Fast |
| **NVIDIA NIM** | API key | `NVIDIA_API_KEY` | `openai-completions` | Llama 3.1, Nemotron, Mistral |
| **Cloudflare AI Gateway** | API key | `CLOUDFLARE_API_KEY` + account + gateway IDs | `anthropic-messages`, `openai-completions` | Claude, GPT, Workers AI models |
| **Cloudflare Workers AI** | API key | `CLOUDFLARE_API_KEY` + account ID | `openai-completions` | Gemma, Granite, Qwen, Llama |
| **Vercel AI Gateway** | API key | `AI_GATEWAY_API_KEY` | `anthropic-messages`, `openai-completions` | Multi-provider routing |
| **ZAI (Global)** | API key | `ZAI_API_KEY` | `openai-completions` | GLM-4.5, GLM-4.7 |
| **ZAI (China)** | API key | `ZAI_CODING_CN_API_KEY` | `openai-completions` | GLM-4.5, GLM-4.7 |
| **OpenCode Zen** | API key | `OPENCODE_API_KEY` | `openai-completions`, `anthropic-messages` | Big Pickle, Claude Haiku, DeepSeek |
| **OpenCode Go** | API key | `OPENCODE_API_KEY` | `openai-completions` | DeepSeek V4 Flash/Pro |
| **Kimi For Coding** | API key | `KIMI_API_KEY` | `anthropic-messages` | Kimi K2.7 Code |
| **Moonshot AI** | API key | `KIMI_API_KEY` | `openai-completions` | Kimi K2 |
| **Moonshot AI (China)** | API key | `KIMI_API_KEY` | `openai-completions` | Kimi K2 (CN endpoint) |
| **MiniMax** | API key | `MINIMAX_API_KEY` | `anthropic-messages` | MiniMax-M2.7 |
| **MiniMax (China)** | API key | `MINIMAX_CN_API_KEY` | `anthropic-messages` | MiniMax-M2.7 (CN endpoint) |
| **Ant Ling** | API key | `ANT_LING_API_KEY` | `openai-completions` | Ling 2.6 1T, Ling 2.6 Flash |
| **Xiaomi MiMo** | API key | `XIAOMI_API_KEY` | `openai-completions` | MiMo-V2-Flash, MiMo-V2-Omni, MiMo-V2-Pro |
| **Xiaomi Token Plan CN** | API key | `XIAOMI_TOKEN_PLAN_CN_API_KEY` | `openai-completions` | MiMo-V2-Omni, MiMo-V2-Pro |
| **Xiaomi Token Plan AMS** | API key | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` | `openai-completions` | MiMo-V2-Omni, MiMo-V2-Pro |
| **Xiaomi Token Plan SGP** | API key | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` | `openai-completions` | MiMo-V2-Omni, MiMo-V2-Pro |

---

## Model Matrix

### Anthropic

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `claude-3-5-sonnet-20240620` | Claude Sonnet 3.5 | 200K | 8K | ✗ | ✓ | $3/M | $15/M |
| `claude-3-5-sonnet-20241022` | Claude Sonnet 3.5 v2 | 200K | 8K | ✗ | ✓ | $3/M | $15/M |
| `claude-3-5-haiku-20241022` | Claude Haiku 3.5 | 200K | 8K | ✗ | ✓ | $0.80/M | $4/M |
| `claude-3-opus-20240229` | Claude Opus 3 | 200K | 4K | ✗ | ✓ | $15/M | $75/M |
| `claude-3-haiku-20240307` | Claude Haiku 3 | 200K | 4K | ✗ | ✓ | $0.25/M | $1.25/M |
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | 200K | 8K | ✓ | ✓ | $3/M | $15/M |
| `claude-sonnet-4-5-20250610` | Claude Sonnet 4.5 | 200K | 8K | ✓ | ✓ | $3/M | $15/M |
| `claude-haiku-4-20250717` | Claude Haiku 4 | 200K | 8K | ✓ | ✓ | $0.80/M | $4/M |
| `claude-opus-4-5-20251114` | Claude Opus 4.5 | 200K | 8K | ✓ | ✓ | $15/M | $75/M |
| `claude-opus-4-20250715` | Claude Opus 4 | 200K | 64K | ✓ | ✓ | $15/M | $75/M |
| `claude-fable-5-20260610` | Claude Fable 5 | 1M | 128K | ✓ | ✓ | $10/M | $50/M |

### OpenAI

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `gpt-4o` | GPT-4o | 128K | 16K | ✗ | ✓ | $2.50/M | $10/M |
| `gpt-4o-mini` | GPT-4o Mini | 128K | 16K | ✗ | ✓ | $0.15/M | $0.60/M |
| `o3` | o3 | 200K | 100K | ✓ | ✓ | $10/M | $40/M |
| `o4-mini` | o4-mini | 200K | 100K | ✓ | ✓ | $1.10/M | $4.40/M |
| `gpt-4.1` | GPT-4.1 | 1M | 32K | ✗ | ✓ | $2/M | $8/M |
| `gpt-4.1-mini` | GPT-4.1 Mini | 1M | 32K | ✗ | ✓ | $0.40/M | $1.60/M |
| `gpt-4.1-nano` | GPT-4.1 Nano | 1M | 32K | ✗ | ✓ | $0.10/M | $0.40/M |
| `gpt-5.3-codex-spark` | GPT-5.3 Codex Spark | 128K | 128K | ✓ | ✗ | $1.75/M | $14/M |
| `gpt-5.4` | GPT-5.4 | 128K | 128K | ✓ | ✓ | $5/M | $20/M |

### Google

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `gemini-2.0-flash` | Gemini 2.0 Flash | 1M | 8K | ✗ | ✓ | $0.10/M | $0.40/M |
| `gemini-2.0-flash-lite` | Gemini 2.0 Flash-Lite | 1M | 8K | ✗ | ✓ | $0.04/M | $0.15/M |
| `gemini-2.5-flash` | Gemini 2.5 Flash | 1M | 64K | ✓ | ✓ | $0.15/M | $0.60/M |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash-Lite | 1M | 64K | ✓ | ✓ | $0.04/M | $0.15/M |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 1M | 64K | ✓ | ✓ | $1.25/M | $5/M |

### DeepSeek

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `deepseek-v4-flash` | DeepSeek V4 Flash | 1M | 384K | ✓ | ✗ | $0.14/M | $0.28/M |
| `deepseek-v4-pro` | DeepSeek V4 Pro | 1M | 384K | ✓ | ✗ | $0.55/M | $1.10/M |
| `deepseek-chat` | DeepSeek V3 | 64K | 8K | ✗ | ✗ | $0.27/M | $1.10/M |

### Mistral

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `codestral-latest` | Codestral | 256K | 4K | ✗ | ✗ | $0.30/M | $0.90/M |
| `devstral-2512` | Devstral 2 | 256K | 4K | ✗ | ✗ | — | — |
| `mistral-large-latest` | Mistral Large | 128K | 16K | ✓ | ✓ | $2/M | $6/M |
| `mistral-small-latest` | Mistral Small | 32K | 8K | ✗ | ✓ | $0.20/M | $0.60/M |

### xAI

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `grok-3` | Grok 3 | 131K | 8K | ✗ | ✗ | $3/M | $15/M |
| `grok-3-fast` | Grok 3 Fast | 131K | 8K | ✗ | ✗ | — | — |

### MiniMax

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `MiniMax-M2.7` | MiniMax-M2.7 | 204K | 131K | ✓ | ✗ | $0.30/M | $1.20/M |
| `MiniMax-M2.7-highspeed` | MiniMax-M2.7 HS | 204K | 131K | ✓ | ✗ | — | — |

### Xiaomi MiMo

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `mimo-v2-flash` | MiMo-V2-Flash | 262K | 65K | ✓ | ✗ | $0.14/M | $0.28/M |
| `mimo-v2-omni` | MiMo-V2-Omni | 262K | 131K | ✓ | ✓ | $0.14/M | $0.28/M |
| `mimo-v2-pro` | MiMo-V2-Pro | 262K | 131K | ✓ | ✓ | $0.14/M | $0.28/M |

### Kimi / Moonshot

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `k2p7` | Kimi K2.7 Code | 262K | 32K | ✓ | ✓ | Free | Free |
| `kimi-for-coding` | Kimi For Coding | 262K | 32K | ✓ | ✓ | Free | Free |
| `kimi-k2-0711-preview` | Kimi K2 0711 | 131K | 16K | ✗ | ✗ | $0.60/M | $2.50/M |
| `kimi-k2-0905-preview` | Kimi K2 0905 | 131K | 16K | ✗ | ✗ | $0.60/M | $2.50/M |

### Amazon Bedrock

| Model ID | Name | Context | Max Output | Reasoning | Images | Cost In | Cost Out |
|----------|------|---------|------------|-----------|--------|---------|----------|
| `amazon.nova-2-lite-v1:0` | Nova 2 Lite | 128K | 4K | ✓ | ✓ | $0.33/M | $2.75/M |
| `amazon.nova-lite-v1:0` | Nova Lite | 128K | 4K | ✗ | ✓ | $0.06/M | $0.24/M |
| `amazon.nova-pro-v1:0` | Nova Pro | 128K | 4K | ✓ | ✓ | $0.80/M | $3.20/M |
| `us.anthropic.claude-sonnet-4-20250514-v1:0` | Claude Sonnet 4 | 200K | 8K | ✓ | ✓ | $3/M | $15/M |
| `us.anthropic.claude-haiku-4-20250717-v1:0` | Claude Haiku 4 | 200K | 8K | ✓ | ✓ | $0.80/M | $4/M |
| `us.anthropic.claude-opus-4-20250715-v1:0` | Claude Opus 4 | 200K | 64K | ✓ | ✓ | $15/M | $75/M |

### GitHub Copilot

| Model ID | Name | Cost |
|----------|------|------|
| `claude-fable-5` | Claude Fable 5 | Included with subscription |
| `claude-haiku-4.5` | Claude Haiku 4.5 | Included with subscription |
| `claude-sonnet-4` | Claude Sonnet 4 | Included with subscription |
| `gpt-4o` | GPT-4o | Included with subscription |
| `o3` | o3 | Included with subscription |
| `o4-mini` | o4-mini | Included with subscription |

### Local / Open Models (via Ollama, vLLM, LM Studio)

Configured via [models.json](models.md). No built-in model registry. Typical setups:

| Local Engine | API | Compat Flags |
|-------------|-----|-------------|
| Ollama | `openai-completions` | `supportsDeveloperRole: false`, `supportsReasoningEffort: false` |
| vLLM | `openai-completions` | — |
| LM Studio | `openai-completions` | — |
| SGLang | `openai-completions` | — |

---

## API Types

Each provider implements one or more API types. The API type determines the wire protocol, streaming format, and available features.

| API Type | Protocol | Providers | Thinking | Caching | Streaming |
|----------|----------|-----------|----------|---------|-----------|
| `anthropic-messages` | Anthropic Messages API | Anthropic, Fireworks, Kimi, MiniMax, OpenCode, Vercel, Cloudflare AI Gateway | ✓ Extended thinking | ✓ `cache_control` markers | SSE |
| `openai-completions` | OpenAI Chat Completions | DeepSeek, Groq, Cerebras, OpenRouter, Together, xAI, NVIDIA, Hugging Face, ZAI, Ant Ling, Moonshot, Xiaomi, GitHub Copilot, OpenCode Go | ✓ Via `thinkingFormat` compat | ✓ Via `cacheControlFormat` | SSE |
| `openai-responses` | OpenAI Responses API | OpenAI | ✓ `reasoning_effort` | ✓ Automatic | SSE |
| `openai-codex-responses` | OpenAI Codex | OpenAI Codex subscription | ✓ | ✓ | SSE/WS |
| `google-generative-ai` | Google AI | Google Gemini | ✓ | ✓ Context caching | SSE |
| `google-vertex` | Vertex AI | Google Vertex | ✓ | ✓ Context caching | SSE |
| `bedrock-converse-stream` | AWS Bedrock Converse | Amazon Bedrock | ✓ | ✓ For recognized Claude models | SSE |
| `mistral-conversations` | Mistral API | Mistral | ✗ | ✗ | SSE |
| `azure-openai-responses` | Azure OpenAI | Azure OpenAI | ✓ | ✗ | SSE |

---

## Capability Matrix

### Thinking (Extended Reasoning)

| Capability | Models |
|-----------|--------|
| **Adaptive thinking** (automatic effort) | Claude Sonnet 4+, Claude Opus 4+, Claude Fable 5 |
| **Configurable effort** (off/minimal/low/medium/high/xhigh) | o3, o4-mini, GPT-5.x Codex, Gemini 2.5 Flash/Pro, DeepSeek V4 |
| **Thinking on/off only** | Bedrock Claude models, MiniMax-M2.7 |
| **No thinking** | GPT-4o, GPT-4.1, Gemini 2.0, Codestral, Grok 3, Groq models |

### Thinking Level Map

Thinking levels map differently per provider:

| 1bit Level | Anthropic | OpenAI | Gemini | DeepSeek | Cerebras | Together |
|-----------|-----------|--------|--------|----------|----------|----------|
| `off` | `disabled` | `none` | — | — | — | — |
| `minimal` | Adaptive | `low` | — | — | — | — |
| `low` | Adaptive | `medium` | — | — | — | — |
| `medium` | Adaptive | `high` | — | — | — | — |
| `high` | Adaptive | `high` | — | `high` | — | — |
| `xhigh` | Adaptive | `xhigh` | — | `max` | — | — |

`—` means the level maps to the provider default. DeepSeek V4 only supports `off`, `high`, and `max` (others are `null` in `thinkingLevelMap`).

### Thinking Format Values

For `openai-completions` providers, `thinkingFormat` in `compat` controls how thinking is serialized:

| Format | Providers | Serialization |
|--------|-----------|--------------|
| `deepseek` | DeepSeek, Moonshot CN, OpenCode Go, Xiaomi | `reasoning_content` field on assistant messages |
| `openrouter` | OpenRouter | OpenRouter-specific thinking headers |
| `together` | Together AI | Together-specific thinking format |
| `zai` | ZAI Global/CN | Z.AI-specific thinking format |
| `qwen` | Qwen models | Qwen-specific format |
| `chat-template` | Custom | Chat template based |
| `qwen-chat-template` | Custom | Qwen chat template based |
| `ant-ling` | Ant Ling | Ant Ling-specific format |
| (omitted) | Most models | Standard `reasoning_effort` or automatic |

---

## Thinking Level Compatibility

| Provider | Thinking Support | Notes |
|----------|-----------------|-------|
| Anthropic | ✓ Extended thinking | Adaptive thinking on Sonnet 4+, Opus 4+, Fable 5. Configurable token budgets via `thinkingBudgets` setting. |
| OpenAI (Responses) | ✓ | `reasoning_effort` levels: `none`, `low`, `medium`, `high`. o-series models only. |
| OpenAI Codex | ✓ | GPT-5.x Codex Spark uses custom thinking level map. |
| Google Gemini | ✓ | Gemini 2.5 models support thinking. Effort maps to provider defaults. |
| Google Vertex | ✓ | Same as Gemini via ADC. |
| Amazon Bedrock | ✓ | Claude models support thinking on Bedrock. |
| DeepSeek | ✓ | Off/high/max only. Uses `reasoning_content` field. |
| Fireworks | ✓ | Via `anthropic-messages` API with Claude/DSeepSeek models. |
| Cerebras | ✓ | GPT OSS 120B supports thinking. |
| Together AI | ✓ | MiniMax models with Together-specific format. |
| OpenRouter | ✓ | Provider-dependent. Uses OpenRouter thinking format. |
| Kimi For Coding | ✓ | Via `anthropic-messages` API. |
| MiniMax | ✓ | Via `anthropic-messages` API. |
| GitHub Copilot | ✓ | Model-dependent. |
| Mistral | ✓ | Mistral Large only. |
| Groq | ✗ | No thinking support on hosted models. |
| xAI | ✗ | Grok 3 does not support thinking in 1bit. |
| NVIDIA NIM | ✗ | No thinking support. |
| Cloudflare Workers AI | ✓ | Model-dependent (Gemma 4 supports thinking). |
| Cloudflare AI Gateway | ✓ | Passthrough to upstream provider. |
| Vercel AI Gateway | ✓ | Passthrough to upstream provider. |
| ZAI | ✓ | GLM-4.5/4.7 support thinking. |
| Ant Ling | ✗ | Ling models do not support thinking. |
| Moonshot AI | ✗ | Kimi K2 previews do not support thinking. |
| OpenCode Zen | ✓ | Big Pickle supports thinking. |
| OpenCode Go | ✓ | DeepSeek V4 on OpenCode Go. |
| Xiaomi MiMo | ✓ | All MiMo models support thinking. |

---

## Prompt Caching Support

| Provider | Cache Type | How It Works |
|----------|-----------|--------------|
| **Anthropic** | Prompt caching | Automatic via `cache_control` markers on system prompt, tool definitions, and text content. Set `PI_CACHE_RETENTION=long` for extended cache. |
| **OpenAI** | Context caching | Automatic on `openai-responses` API. No explicit marker needed. |
| **OpenAI Codex** | Session caching | Persistent connection reuses cached context across sessions. |
| **Google Gemini** | Context caching | Supported via `google-generative-ai` and `google-vertex` APIs. |
| **Amazon Bedrock** | Prompt caching | Automatic for Claude models with recognizable model IDs. Set `AWS_BEDROCK_FORCE_CACHE=1` for application inference profiles. |
| **DeepSeek** | Context caching | `cacheRead` pricing listed in model costs. |
| **Fireworks** | Session affinity | `sendSessionAffinityHeaders` compat flag enables session-based caching. |
| **Cloudflare Workers AI** | Prefix caching | Automatic via `x-session-affinity` header. |
| **Cloudflare AI Gateway** | Passthrough | Depends on upstream provider. |
| **OpenRouter** | Provider-dependent | Depends on the routed provider. |
| **Mistral** | ✗ | No caching support. |
| **Groq** | ✗ | No caching support. |
| **xAI** | Partial | `cacheRead` cost listed for Grok 3. |
| **Together AI** | ✗ | `supportsLongCacheRetention: false`. |
| **NVIDIA NIM** | ✗ | `supportsLongCacheRetention: false`. |

---

## Image Support

| Provider | Image Support | Formats |
|----------|--------------|---------|
| **Anthropic** | ✓ | JPEG, PNG, GIF, WebP |
| **OpenAI** | ✓ | JPEG, PNG, GIF, WebP |
| **OpenAI Codex** | ✓ | Various |
| **Google Gemini** | ✓ | JPEG, PNG, GIF, WebP, HEIC, HEIF |
| **Google Vertex** | ✓ | Same as Gemini |
| **Amazon Bedrock** | ✓ | Nova and Claude models |
| **GitHub Copilot** | ✓ | Model-dependent |
| **Fireworks** | ✓ | Via Anthropic API models |
| **Cloudflare Workers AI** | ✓ | Gemma 4 models support images |
| **Kim For Coding** | ✓ | Kimi K2.7 Code |
| **Xiaomi MiMo** | ✓ | MiMo-V2-Omni and MiMo-V2-Pro |
| **DeepSeek** | ✗ | Text-only models |
| **Mistral** | ✓ | Mistral Large, Mistral Small |
| **Groq** | ✗ | Text-only models |
| **xAI** | ✗ | Text-only |
| **Cerebras** | ✗ | Text-only |
| **NVIDIA NIM** | ✗ | Text-only |
| **Together AI** | ✗ | Text-only |
| **OpenRouter** | ✓ | Model-dependent |
| **MiniMax** | ✗ | Text-only |
| **Ant Ling** | ✗ | Text-only |
| **Moonshot AI** | ✗ | Text-only |
| **ZAI** | ✗ | Text-only |
| **Hugging Face** | ✗ | Text-only |
| **OpenCode** | ✗ | Text-only |
| **Vercel AI Gateway** | ✓ | Model-dependent |

---

## Pricing Guide

### Free / Subscription

| Provider | Cost Model |
|----------|-----------|
| **GitHub Copilot** | Included with GitHub Copilot subscription ($10-39/mo) |
| **OpenAI Codex** | Included with ChatGPT Plus ($20/mo) or Pro ($200/mo) |
| **Anthropic Subscription** | Included with Claude Pro ($20/mo) or Max ($100-200/mo) |
| **Kimi For Coding** | Free |

### API Key Pricing Tiers

| Tier | Providers | Typical Range (Input) | Typical Range (Output) |
|------|-----------|----------------------|-----------------------|
| **Budget** | DeepSeek V4 Flash, Groq, Cloudflare Workers AI, Xiaomi | $0.05 – $0.14/M | $0.08 – $0.28/M |
| **Standard** | Gemini 2.5 Flash, Ant Ling, GPT-4.1 Nano, Mistral Small | $0.04 – $0.40/M | $0.15 – $1.60/M |
| **Premium** | Claude Sonnet, GPT-4o, Gemini Pro, Cerebras | $0.30 – $2.50/M | $1.20 – $10/M |
| **High** | Claude Opus, GPT-4.1, GPT-5.x, Grok 3 | $2 – $15/M | $8 – $75/M |

### Cache Discounts

| Provider | Cache Read Discount | Cache Write Cost |
|----------|--------------------|-------------------|
| Anthropic | 90% off input | Cache write at 125% input |
| OpenAI (Responses) | 50% off input | — |
| Gemini | 75% off input (up to 1hr) | — |
| Bedrock | 90% off input (Claude) | Cache write at 125% input |
| DeepSeek | 98% off input | — |
| xAI | 75% off input | — |

---

## Local Model Setup

### Ollama

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        { "id": "llama3.1:8b", "name": "Llama 3.1 8B" },
        { "id": "qwen2.5-coder:7b", "name": "Qwen 2.5 Coder 7B" }
      ]
    }
  }
}
```

### LM Studio

```json
{
  "providers": {
    "lm-studio": {
      "baseUrl": "http://localhost:1234/v1",
      "api": "openai-completions",
      "apiKey": "lm-studio",
      "models": [
        { "id": "local-model", "name": "LM Studio Model" }
      ]
    }
  }
}
```

### vLLM

```json
{
  "providers": {
    "vllm": {
      "baseUrl": "http://localhost:8000/v1",
      "api": "openai-completions",
      "apiKey": "vllm",
      "models": [
        { "id": "meta-llama/Llama-3.1-8B-Instruct" }
      ]
    }
  }
}
```

---

## Model Selection Tips

**Best for coding with thinking:** Claude Sonnet 4/4.5, Claude Fable 5, o3, DeepSeek V4 Pro

**Best value:** DeepSeek V4 Flash ($0.14/M in), Gemini 2.5 Flash ($0.15/M in)

**Best free:** Kimi For Coding (K2.7 Code), GitHub Copilot (subscription)

**Best local:** Llama 3.1, Qwen 2.5 Coder, Gemma 4 via Ollama/LM Studio

**Best context window:** DeepSeek V4 (1M), Gemini 2.5 (1M), GPT-4.1 (1M), Claude Fable 5 (1M)

**Best with images:** Claude, Gemini, GPT-4o, Xiaomi MiMo

**Best throughput:** Groq (Llama 3.x), DeepSeek V4 Flash, Gemini 2.5 Flash

---

## See Also

- [Providers](providers.md) — authentication setup for each provider
- [Custom Models](models.md) — adding models via `models.json`
- [Custom Providers](custom-provider.md) — implementing custom provider APIs
- [Settings](settings.md) — configuring default provider and model
