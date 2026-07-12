/**
 * Token Fusion — Pi Extension
 *
 * Registers compress_context, rewind_retrieve, estimate_tokens as pi tools.
 * Hooks session_before_compact with size threshold (skips messages < 500 chars).
 *
 * Fixes applied in v2:
 *  - RewindStore is file-backed (survives pi restart / reload)
 *  - JS fallback uses the full 6-stage JsCompressor from packages/token-fusion
 *  - hasPythonEngine() result is cached (no subprocess per call)
 *
 * Install:
 *   Place in ~/.pi/agent/extensions/ or .pi/extensions/ for auto-discovery.
 *   Or: pi -e .pi/extensions/token-fusion.ts
 *
 * Dependencies (optional): pip install token-fusion
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Config ──────────────────────────────────────────────────

const MIN_COMPRESS_CHARS = 500;      // Skip messages under this length
const MAX_COMPRESS_MS = 5_000;       // Timeout for Python subprocess
const REWIND_MAX = 10_000;           // Max RewindStore entries
const REWIND_DB_PATH = join(
  process.env.HOME || "/tmp",
  ".pi/agent/data/token-fusion-rewind.jsonl",
);

// ─── File-backed RewindStore ─────────────────────────────────
// Fix #1: Persists markers to JSONL so they survive /reload

class RewindStore {
  private _store = new Map<string, string>();
  private _accessOrder: string[] = [];
  private _max: number;
  private _path: string;
  private _dirty = false;
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(max: number, path: string) {
    this._max = max;
    this._path = path;
    this._load();
  }

  private _load(): void {
    try {
      if (!existsSync(this._path)) return;
      const data = readFileSync(this._path, "utf-8").trim();
      if (!data) return;
      for (const line of data.split("\n")) {
        try {
          const { id, content } = JSON.parse(line);
          if (this._store.size < this._max) {
            this._store.set(id, content);
            this._accessOrder.push(id);
          }
        } catch { /* skip corrupt lines */ }
      }
    } catch { /* silent on first run */ }
  }

  private _scheduleSave(): void {
    this._dirty = true;
    if (this._saveTimer) return;
    // Debounce writes: batch within 500ms
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      if (!this._dirty) return;
      this._dirty = false;
      try {
        const dir = dirname(this._path);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const lines: string[] = [];
        for (const id of this._accessOrder) {
          const content = this._store.get(id);
          if (content) lines.push(JSON.stringify({ id, content }));
        }
        writeFileSync(this._path, lines.join("\n") + "\n", "utf-8");
      } catch { /* best-effort persistence */ }
    }, 500).unref();
  }

  store(original: string, id?: string): string {
    const mid = id ?? createHash("sha256").update(original).digest("hex").slice(0, 16);
    if (!this._store.has(mid)) {
      if (this._store.size >= this._max) {
        const oldest = this._accessOrder.shift()!;
        this._store.delete(oldest);
      }
      this._store.set(mid, original);
      this._accessOrder.push(mid);
      this._scheduleSave();
    }
    return mid;
  }

  retrieve(mid: string): string | undefined {
    return this._store.get(mid);
  }

  makeMarker(mid: string): string {
    return `[rewind:${mid}]`;
  }

  stats(): { entries: number; max: number; path: string } {
    return { entries: this._store.size, max: this._max, path: this._path };
  }
}

const rewindStore = new RewindStore(REWIND_MAX, REWIND_DB_PATH);

// ─── Cached Python engine detection ──────────────────────────
// Fix #3: Only spawns Python once

let _hasPython: boolean | null = null;

function hasPythonEngine(): boolean {
  if (_hasPython !== null) return _hasPython;
  try {
    const r = spawnSync("python3", [
      "-c", "from token_fusion.pipeline import FusionEngine; print('ok')",
    ], { timeout: 3000 });
    _hasPython = r.status === 0;
  } catch {
    _hasPython = false;
  }
  return _hasPython;
}

// ─── Python subprocess bridge ────────────────────────────────

function pyCompress(
  text: string, ctype: string,
): { compressed: string; orig: number; comp: number; stages: string[] } {
  const script = `
import sys, json
sys.path.insert(0, '.')
from token_fusion.pipeline import FusionEngine
e = FusionEngine()
r = e.compress(${JSON.stringify(text)}, content_type=${JSON.stringify(ctype)})
print(json.dumps({
    "compressed": r["compressed"],
    "orig": r["stats"]["original_tokens"],
    "comp": r["stats"]["compressed_tokens"],
    "stages": [n for n,s in r["stats"]["stages"].items() if s["applied"]]
}))`;
  const r = spawnSync("python3", ["-c", script], {
    encoding: "utf-8", timeout: MAX_COMPRESS_MS, maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error(r.stderr?.slice(0, 500));
  return JSON.parse(r.stdout.trim());
}

// ─── Full JS fallback (6-stage compressor) ───────────────────
// Fix #2: Complete pipeline, not a stub

import { JsCompressor } from "../../packages/token-fusion/src/js-compress.ts";

const jsCompressor = new JsCompressor();

function jsCompress(
  text: string, ctype: string,
): { compressed: string; orig: number; comp: number; stages: string[] } {
  const result = jsCompressor.compress(text, {
    contentType: ctype as any,
    mode: "balanced",
  });
  return {
    compressed: result.compressed,
    orig: result.stats.originalTokens,
    comp: result.stats.compressedTokens,
    stages: Object.entries(result.stats.stages)
      .filter(([_, s]) => (s as any).applied)
      .map(([name]) => name),
  };
}

// ─── Dispatch ────────────────────────────────────────────────

function compress(
  text: string, ctype: string = "text",
): { compressed: string; orig: number; comp: number; stages: string[] } {
  if (text.length < MIN_COMPRESS_CHARS) {
    const tok = Math.max(1, Math.ceil(text.length / 4));
    return { compressed: text, orig: tok, comp: tok, stages: [] };
  }
  if (hasPythonEngine()) {
    try { return pyCompress(text, ctype); } catch { /* fall through */ }
  }
  return jsCompress(text, ctype);
}

// ─── Extension ───────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── Tool: compress_context ──
  pi.registerTool({
    name: "compress_context",
    label: "Compress Context",
    description:
      "Compress tool results, logs, JSON, or other content to save tokens " +
      "before sending to the LLM. Use on large JSON arrays, repeated log " +
      "lines, or long search results. Enable rewind=true for reversible compression.",
    parameters: Type.Object({
      text: Type.String({ description: "Content to compress" }),
      content_type: Type.Optional(Type.String({
        description: '"json" | "log" | "text" | "code" | "diff" | "search"',
        default: "text",
      })),
      rewind: Type.Optional(Type.Boolean({
        description: "Store original for retrieval (default: false)",
        default: false,
      })),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const start = performance.now();
      const ctype = params.content_type ?? "text";
      const result = compress(params.text, ctype);

      let output = result.compressed;
      let marker: string | null = null;

      if (params.rewind && result.orig > result.comp) {
        const mid = rewindStore.store(params.text);
        marker = rewindStore.makeMarker(mid);
        output += [
          "",
          `<rewind-marker>${marker}</rewind-marker>`,
          `Use \`rewind_retrieve\` with \`"${marker}"\` to restore the original.`,
        ].join("\n");
      }

      const elapsed = (performance.now() - start).toFixed(1);
      const saved = result.orig - result.comp;
      const pct = result.orig > 0
        ? ((1 - result.comp / result.orig) * 100).toFixed(1)
        : "0.0";

      return {
        content: [{ type: "text", text: output }],
        details: {
          engine: hasPythonEngine() ? "python" : "js",
          originalTokens: result.orig,
          compressedTokens: result.comp,
          reductionPct: parseFloat(pct),
          savedTokens: saved,
          timeMs: parseFloat(elapsed),
          stages: result.stages.join(", "),
          rewindMarker: marker,
          rewindDb: rewindStore.stats().path,
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
      marker: Type.String({
        description: 'Rewind marker like "[rewind:deadbeef...]" or hex ID',
      }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const mid = params.marker.replace("[rewind:", "").replace("]", "").trim();
      const original = rewindStore.retrieve(mid);
      if (original === undefined) {
        return {
          content: [{
            type: "text",
            text: "Error: marker not found in RewindStore.\n"
              + `Looked for: "${mid}"\n`
              + `Store: ${rewindStore.stats().entries} entries at ${rewindStore.stats().path}\n\n`
              + "Possible causes:\n"
              + "- The marker was from a previous session (pi /reload clears in-memory stores — "
              + "but this extension persists to disk, so it should survive restarts)\n"
              + "- The marker ID may be truncated or malformed\n"
              + "- The entry was evicted (store max: 10,000 entries, LRU)",
          }],
          isError: true,
          details: { rewindStats: rewindStore.stats() },
        };
      }
      return {
        content: [{ type: "text", text: original }],
        details: { restoredLength: original.length, rewindStats: rewindStore.stats() },
      };
    },
  });

  // ── Tool: estimate_tokens ──
  pi.registerTool({
    name: "estimate_tokens",
    label: "Estimate Tokens",
    description: "Quick token count estimate (~4 chars/token heuristic).",
    parameters: Type.Object({
      text: Type.String({ description: "Text to estimate" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const tokens = Math.max(1, Math.ceil(params.text.length / 4));
      const cost = (tokens / 1_000_000 * 2.50).toFixed(4);
      return {
        content: [{
          type: "text",
          text: `~${tokens.toLocaleString()} tokens ($${cost} at GPT-4o input rates)`
        }],
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
      .map((m: any) => `[${m.role ?? "user"}]: ${
        typeof m.content === "string" ? m.content : ""
      }`)
      .join("\n\n");

    if (text.length < MIN_COMPRESS_CHARS) return;

    const result = compress(text);
    if (result.comp >= result.orig) return;  // No savings, skip

    const saved = result.orig - result.comp;
    const pct = result.orig > 0
      ? ((1 - result.comp / result.orig) * 100).toFixed(1)
      : "0";
    const marker = rewindStore.store(text);

    return {
      compaction: {
        summary: [
          "## Token-Fusion Compressed Context",
          "",
          `Original: ~${result.orig} tokens \u2192 Compressed: ~${result.comp} tokens`
            + ` (${pct}%, ~${saved} tok saved)`,
          "",
          result.compressed,
          "",
          saved > 0
            ? `_Token savings: ~${saved} (\u2248 $${(saved * 0.0000025).toFixed(4)})_`
            : "",
          "",
          `<rewind-marker>${rewindStore.makeMarker(marker)}</rewind-marker>`,
        ].filter(Boolean).join("\n"),
        firstKeptEntryId: preparation.firstKeptEntryId,
        tokensBefore: preparation.tokensBefore ?? result.orig,
        details: {
          engine: hasPythonEngine() ? "python" : "js",
          savedTokens: saved,
          reductionPct: parseFloat(pct),
          rewindMarker: marker,
        },
      },
    };
  });
}
