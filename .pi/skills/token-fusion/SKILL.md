---
name: token-fusion
description: >-
  LLM context compression via the 14-stage Fusion Pipeline. Compresses prompts,
  tool results, and conversations before sending to the LLM. Reversible via
  RewindStore. Cuts token costs by 15-97% with zero LLM inference overhead.
  Use when context windows are tight, token costs are high, or long tool results
  need compression.
---

# Token Fusion Skill

## Setup

```bash
# Install the token-fusion Python library
pip install token-fusion  # or from source: pip install -e /path/to/token-fusion

# Verify
python3 -c "from token_fusion.pipeline import FusionEngine; print('✓ token-fusion ready')"
```

## Tools

This skill provides two tools:

### 1. `compress_context` — Compress conversation context

Compresses the system prompt, tool results, or any text content before LLM submission.

**Usage:**
```
compress_context(text="...", content_type="text", language="python")
```

**Parameters:**
- `text` (required): Content to compress
- `content_type`: "text", "code", "json", "log", "diff", "search" — auto-detected if omitted
- `language`: Programming language hint ("python", "go", "rust", etc.)
- `mode`: "balanced" (default), "aggressive" (heavier compression), "light" (minimal changes)
- `rewind`: true/false — enable reversible compression (default: false)

**Returns:** compressed text + stats (reduction %, tokens saved, time)

### 2. `rewind_retrieve` — Retrieve original compressed content

**Usage:**
```
rewind_retrieve(marker="[rewind:abc123...]")
```

### 3. `estimate_tokens` — Count tokens without compressing

**Usage:**
```
estimate_tokens(text="...", model="gpt-4")
```

## Workflow

### Compress before LLM call
1. Agent detects context is near the token limit
2. Calls `compress_context` on tool results and system prompt
3. Agent sees compressed text with `[rewind:...]` markers where originals are stored
4. If LLM needs the original, calls `rewind_retrieve`

### Compression tips by content type
| Content | Best stage | Expected reduction |
|---------|-----------|:------------------:|
| JSON tool results (50+ items) | Ionizer | 80-97% |
| Repeated log lines (identical) | LogCrunch + SemanticDedup | 70-96% |
| Search/grep results | SearchCrunch | 40-80% |
| Git diffs | DiffCrunch | 15-40% |
| Long agent conversations | Cross-message SemanticDedup | 10-30% |
| Python code with comments | Neurosyntax (NEVER strips docs) | 0-5% |

### What does NOT work well
| Scenario | Why |
|----------|-----|
| Short single-turn prompts | Saving 5 tokens on 100-token prompt = noise |
| Normal code without repetition | Comments carry intent; Neurosyntax never strips them |
| Unique text (no repetition) | No duplicate content to deduplicate |
| General text compression | Pipeline is algorithmic; no semantic understanding

## Rewind Protocol

When `rewind=true`, compressed output contains markers like `[rewind:deadbeef12345678]`.
The original content is stored in the RewindStore by its SHA-256 hash prefix.

The LLM can call `rewind_retrieve("[rewind:deadbeef12345678]")` to get the original back.
This enables lossless compression: compress aggressively, decompress on demand.

## Examples

```text
# Compress a large JSON tool result before sending to LLM
compress_context(text='[{"file":"src/main.py","issues":[...]},...]', content_type="json", rewind=true)

# → "[{... 47 more items (Ionizer sampled 3/50) ...}]"  (95% reduction, rewound)
```

```text
# Compress code with excessive comments
compress_context(text='def foo():\n    # old comment\n    # another comment\n    pass', content_type="code", language="python")

# → "def foo():\n    # ... 2 comment lines compressed\n    pass"
```

## Integration with Pi Compaction

Pi's built-in compaction uses LLM calls to summarize old context (expensive).
Token Fusion provides algorithmic compression as a cheaper alternative:

1. When `session_before_compact` fires, instead of LLM summarization:
2. Call `compress_context` on the messages to summarize
3. Return the compressed text as the "summary"
4. The RewindStore preserves the originals for retrieval if needed

See `packages/coding-agent/examples/extensions/token-fusion-compaction.ts` for a complete example.
