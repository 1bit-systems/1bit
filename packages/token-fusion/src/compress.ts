/**
 * Compression interface — calls the Python token-fusion CLI.
 *
 * Falls back to a built-in JS heuristic compressor when the Python
 * library is not installed.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { JsCompressor } from "./js-compress";
import type { CompressionOptions, CompressionResult, MessagesCompressionResult, StageStats } from "./types";

/**
 * Compress a single text block using the 14-stage Fusion Pipeline.
 *
 * @param text - Text to compress
 * @param options - Compression options
 * @returns Compression result with stats
 */
export function compress(text: string, options: CompressionOptions = {}): CompressionResult {
	if (usePythonEngine()) {
		return compressViaPython(text, options);
	}
	return new JsCompressor().compress(text, options);
}

/**
 * Compress an array of chat messages.
 *
 * @param messages - Array of { role, content } objects
 * @param options - Compression options
 * @returns Per-message results + aggregate stats
 */
export function compressMessages(
	messages: Array<{ role: string; content: string }>,
	options: CompressionOptions = {},
): MessagesCompressionResult {
	const results: MessagesCompressionResult["perMessage"] = [];
	let totalOrig = 0;
	let totalComp = 0;
	const start = performance.now();

	for (const msg of messages) {
		const r = compress(msg.content, { ...options, role: msg.role as any });
		results.push({
			role: msg.role,
			original: msg.content,
			compressed: r.compressed,
			stats: r.stats,
		});
		totalOrig += r.stats.originalTokens;
		totalComp += r.stats.compressedTokens;
	}

	const elapsed = performance.now() - start;
	return {
		perMessage: results,
		stats: {
			totalOriginalTokens: totalOrig,
			totalCompressedTokens: totalComp,
			totalReductionPct: totalOrig > 0 ? (1 - totalComp / totalOrig) * 100 : 0,
			totalTimeMs: elapsed,
		},
	};
}

/**
 * Estimate token count (heuristic — ~4 chars per token).
 */
export function estimateTokens(text: string, model?: string): number {
	return Math.max(1, Math.ceil(text.length / 4));
}

// ─── Python bridge ───────────────────────────────────────────

function usePythonEngine(): boolean {
	try {
		const r = spawnSync("python3", ["-c", "from token_fusion.pipeline import FusionEngine; print('ok')"]);
		return r.status === 0;
	} catch {
		return false;
	}
}

function compressViaPython(text: string, options: CompressionOptions): CompressionResult {
	const args: string[] = ["-c", buildPythonScript(text, options)];
	const result = spawnSync("python3", args, {
		encoding: "utf-8",
		timeout: 30_000,
		maxBuffer: 10 * 1024 * 1024,
	});

	if (result.error || result.status !== 0) {
		throw new Error(`token-fusion Python error: ${result.stderr || result.error?.message}`);
	}

	try {
		return JSON.parse(result.stdout.trim());
	} catch {
		return new JsCompressor().compress(text, options);
	}
}

function buildPythonScript(text: string, options: CompressionOptions): string {
	const escaped = JSON.stringify(text);
	const opts = JSON.stringify({
		content_type: options.contentType || null,
		language: options.language || null,
		role: options.role || null,
		enable_rewind: options.rewind || false,
	});

	return `
import json, sys
sys.path.insert(0, '.')
from token_fusion.pipeline import FusionEngine

engine = FusionEngine(enable_rewind=${opts.rewind === undefined ? "False" : opts.rewind ? "True" : "False"})
result = engine.compress(
    ${escaped},
    content_type=${JSON.stringify(options.contentType)},
    language=${JSON.stringify(options.language)},
    role=${JSON.stringify(options.role)},
)

output = {
    "compressed": result["compressed"],
    "stats": {
        "originalTokens": result["stats"]["original_tokens"],
        "compressedTokens": result["stats"]["compressed_tokens"],
        "reductionPct": round(result["stats"]["reduction_pct"], 1),
        "savedTokens": result["stats"]["saved_tokens"],
        "timeMs": round(result["stats"]["time_ms"], 1),
        "stages": {
            name: {
                "applied": s.get("applied", True),
                "reductionPct": round(s.get("reduction_pct", 0), 1),
                "timeMs": round(s.get("time_ms", 0), 1),
            }
            for name, s in result["stats"].get("stages", {}).items()
        },
    },
}

if "markers" in result:
    output["markers"] = result["markers"]

print(json.dumps(output))
`;
}
