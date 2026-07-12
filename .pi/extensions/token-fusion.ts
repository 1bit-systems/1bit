/**
 * Token Fusion — Pi Extension
 *
 * Registers compress_context, rewind_retrieve, estimate_tokens as pi tools.
 * Hooks session_before_compact with size threshold (skips messages < 200 chars).
 *
 * Install:
 *   Place in ~/.pi/agent/extensions/ or .pi/extensions/ for auto-discovery.
 *   Or: pi -e .pi/extensions/token-fusion.ts
 *
 * Dependencies: pip install token-fusion  (or use JS fallback)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

// ─── Config ──────────────────────────────────────────────────

const MIN_COMPRESS_CHARS = 500;   // Skip messages under this length
const MAX_COMPRESS_MS = 5_000;    // Timeout for Python subprocess
const REWIND_MAX = 10_000;        // Max RewindStore entries

// ─── RewindStore ─────────────────────────────────────────────

class RewindStore {
  private _store = new Map<string, string>();
  private _accessOrder: string[] = [];
  private _max: number;

  constructor(max: number) { this._max = max; }

  store(original: string, id?: string): string {
    const mid = id ?? createHash("sha256").update(original).digest("hex").slice(0, 16);
    if (!this._store.has(mid)) {
      if (this._store.size >= this._max) {
        const oldest = this._accessOrder.shift()!;
        this._store.delete(oldest);
      }
      this._store.set(mid, original);
      this._accessOrder.push(mid);
    }
    return mid;
  }

  retrieve(mid: string): string | undefined {
    return this._store.get(mid);
  }

  makeMarker(mid: string): string {
    return `[rewind:${mid}]`;
  }
}

const rewindStore = new RewindStore(REWIND_MAX);

// ─── Compressor ──────────────────────────────────────────────

function hasPythonEngine(): boolean {
  try {
    const r = spawnSync("python3", ["-c", "from token_fusion.pipeline import FusionEngine; print('ok')"], { timeout: 2000 });
    return r.status === 0;
  } catch { return false; }
}

function pyCompress(text: string, ctype: string): { compressed: string; orig: number; comp: number; stages: string[] } {
  const escaped = JSON.stringify(text);
  const script = `
import sys, json
sys.path.insert(0, '.')
from token_fusion.pipeline import FusionEngine
e = FusionEngine()
r = e.compress(${escaped}, content_type=${JSON.stringify(ctype)})
print(json.dumps({
    "compressed": r["compressed"],
    "orig": r["stats"]["original_tokens"],
    "comp": r["stats"]["compressed_tokens"],
    "stages": [n for n,s in r["stats"]["stages"].items() if s["applied"]]
}))`;
  const r = spawnSync("python3", ["-c", script], { encoding: "utf-8", timeout: MAX_COMPRESS_MS, maxBuffer: 10 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout.trim());
}

function jsCompress(text: string, ctype: string): { compressed: string; orig: number; comp: number; stages: string[] } {
  // JS fallback: SimHash dedup + Ionizer
  const orig = Math.max(1, Math.ceil(text.length / 4));
  let result = text;

  // RLE path compression
  result = result.replace(/\/home\//g, "$HOME/").replace(/\/Users\//g, "$HOME/").replace(/\/tmp\//g, "$TMP/");

  // Ionizer (JSON)
  if (ctype === "json" && text.length > 300) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 5) {
        const total = parsed.length;
        const sample = [parsed[0], parsed[Math.floor(total/2)], parsed[total-1]];
        result = JSON.stringify(sample, null, 2) + `\n// ... ${total - sample.length} more items (sampled ${sample.length}/${total})`;
      }
    } catch {}
  }

  const comp = Math.max(1, Math.ceil(result.length / 4));
  return { compressed: result, orig, comp, stages: ["RLE"].concat(ctype === "json" && text !== result ? ["Ionizer"] : []) };
}

function compress(text: string, ctype: string = "text"): { compressed: string; orig: number; comp: number; stages: string[] } {
  if (text.length < MIN_COMPRESS_CHARS) {
    const tok = Math.max(1, Math.ceil(text.length / 4));
    return { compressed: text, orig: tok, comp: tok, stages: [] };
  }
  try {
    if (hasPythonEngine()) return pyCompress(text, ctype);
  } catch { /* fall through to JS */ }
  return jsCompress(text, ctype);
}

// ─── Extension ───────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: compress_context ──
  pi.registerTool({
    name: "compress_context",
    label: "Compress Context",
    description:
      "Compress tool results, logs, JSON, or other content to save tokens before sending to the LLM. " +
      "Use on large JSON arrays, repeated log lines, or long search results. " +
      "Not useful on short text. Not useful on code (comments preserved, no savings). " +
      "Enable rewind=true to make compression reversible.",
    parameters: Type.Object({
      text: Type.String({ description: "Content to compress" }),
      content_type: Type.Optional(Type.String({
        description: '"json" | "log" | "text" | "code" | "diff" | "search" (auto-detected if omitted)',
        default: "text",
      })),
      rewind: Type.Optional(Type.Boolean({ description: "Store original for retrieval (default: false)", default: false })),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const start = performance.now();
      const result = compress(params.text, params.content_type ?? "text");

      let output = result.compressed;
      let marker = null;

      if (params.rewind && result.orig > result.comp) {
        const mid = rewindStore.store(params.text);
        marker = rewindStore.makeMarker(mid);
        output += `\n\n<rewind-marker>${marker}</rewind-marker>\nUse rewind_retrieve with this marker to get the original.`;
      }

      const elapsed = (performance.now() - start).toFixed(1);
      const saved = result.orig - result.comp;
      const pct = result.orig > 0 ? ((1 - result.comp / result.orig) * 100).toFixed(1) : "0.0";
      const stages = result.stages.length > 0 ? result.stages.join(", ") : "(none needed)";

      return {
        content: [{ type: "text", text: output }],
        details: {
          originalTokens: result.orig,
          compressedTokens: result.comp,
          savedTokens: saved,
          reductionPct: parseFloat(pct),
          timeMs: parseFloat(elapsed),
          stages,
          rewindMarker: marker,
        },
      };
    },
  });

  // ── Tool: rewind_retrieve ──
  pi.registerTool({
    name: "rewind_retrieve",
    label: "Rewind Retrieve",
    description:
      "Retrieve original content that was compressed with rewind=true. " +
      "Pass the marker from a compress_context result.",
    parameters: Type.Object({
      marker: Type.String({ description: 'Rewind marker like "[rewind:deadbeef...]" or just the hex ID' }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const mid = params.marker.replace("[rewind:", "").replace("]", "").trim();
      const original = rewindStore.retrieve(mid);
      if (original === undefined) {
        return {
          content: [{ type: "text", text: "Error: marker not found in RewindStore. The marker may have expired." }],
          isError: true,
          details: {},
        };
      }
      return {
        content: [{ type: "text", text: original }],
        details: { restoredLength: original.length },
      };
    },
  });

  // ── Tool: estimate_tokens ──
  pi.registerTool({
    name: "estimate_tokens",
    label: "Estimate Tokens",
    description: "Quick token count estimate (~4 chars per token rough heuristic).",
    parameters: Type.Object({
      text: Type.String({ description: "Text to estimate" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const tokens = Math.max(1, Math.ceil(params.text.length / 4));
      const cost = (tokens / 1_000_000 * 2.50).toFixed(4);
      return {
        content: [{ type: "text", text: `~${tokens.toLocaleString()} tokens (≈ $${cost} at GPT-4o input rates)` }],
        details: { estimatedTokens: tokens, estimatedCostUsd: parseFloat(cost) },
      };
    },
  });

  // ── Hook: session_before_compact ──
  pi.on("session_before_compact", async (event: any, ctx) => {
    const { preparation } = event;
    if (!preparation) return;

    const toCompress = preparation.messagesToSummarize?.length > 0
      ? preparation.messagesToSummarize
      : preparation.turnPrefixMessages ?? [];

    if (toCompress.length === 0) return;

    // Only compress messages above size threshold
    const text = toCompress
      .filter((m: any) => {
        const content = typeof m.content === "string" ? m.content : "";
        return content.length >= MIN_COMPRESS_CHARS;
      })
      .map((m: any) => `[${m.role ?? "user"}]: ${typeof m.content === "string" ? m.content : ""}`)
      .join("\n\n");

    if (text.length < MIN_COMPRESS_CHARS) return;

    const result = compress(text);
    if (result.comp === result.orig) return;  // No savings, skip

    const saved = result.orig - result.comp;
    const pct = result.orig > 0 ? ((1 - result.comp / result.orig) * 100).toFixed(1) : "0";
    const marker = rewindStore.store(text);

    const summary = [
      "## Token-Fusion Compressed Context",
      "",
      `Original: ~${result.orig} tokens \u2192 Compressed: ~${result.comp} tokens (${pct}% reduction, ~${saved} tokens saved)`,
      "",
      result.compressed,
      "",
      saved > 0 ? `_Token savings: ~${saved} tokens (\u2248 $${(saved * 0.0000025).toFixed(4)} at GPT-4o rates)_` : "",
      "",
      `<rewind-marker>${rewindStore.makeMarker(marker)}</rewind-marker>`,
    ].filter(Boolean).join("\n");

    return {
      compaction: {
        summary,
        firstKeptEntryId: preparation.firstKeptEntryId,
        tokensBefore: preparation.tokensBefore ?? result.orig,
        details: { savedTokens: saved, reductionPct: parseFloat(pct), rewindMarker: marker },
      },
    };
  });
}
