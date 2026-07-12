/**
 * Built-in JS fallback compressor — implements the core Fusion Pipeline stages
 * in pure TypeScript. Used when the Python token-fusion library is not installed.
 *
 * Implements: SemanticDedup (SimHash), LogCrunch, Ionizer, TokenOpt, Abbrev, RLE
 */

import type { CompressionMode, CompressionOptions, CompressionResult, StageStats } from "./types";

// ─── Token estimation ────────────────────────────────────────

function estimateTokens(text: string): number {
	return Math.max(1, Math.ceil(text.length / 4));
}

// ─── SimHash ─────────────────────────────────────────────────

function simhash(text: string): number {
	const v = new Int32Array(64);
	const words = text.split(/\s+/);
	for (const word of words) {
		let h = 0;
		for (let i = 0; i < word.length; i++) {
			h = (h << 5) - h + word.charCodeAt(i);
			h |= 0;
		}
		for (let i = 0; i < 64; i++) {
			v[i] += h & (1 << i) ? 1 : -1;
		}
	}
	let fp = 0;
	for (let i = 0; i < 64; i++) {
		if (v[i] > 0) fp |= 1 << i;
	}
	return fp >>> 0;
}

function simhashSimilarity(a: number, b: number): number {
	const xor = a ^ b;
	let dist = 0;
	for (let i = 0; i < 32; i++) {
		if (xor & (1 << i)) dist++;
	}
	return 1 - dist / 32;
}

// ─── Content type detection ──────────────────────────────────

const CODE_PATTERNS = [
	/^(import |from |def |class |fn |func |package |use |pub )\s/m,
	/^#include|^using namespace|^require |^public /m,
];
const JSON_PATTERN = /^\s*[{[].*[}\]]\s*$/s;
const LOG_PATTERN = /^\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}/m;
const DIFF_PATTERN = /^diff --git|^@@ -\d+,\d+ \+\d+,\d+ @@/m;

function detectContentType(text: string, hint?: string): string {
	if (hint) return hint;
	if (JSON_PATTERN.test(text)) return "json";
	if (LOG_PATTERN.test(text)) return "log";
	if (DIFF_PATTERN.test(text)) return "diff";
	if (CODE_PATTERNS.some((p) => p.test(text))) return "code";
	return "text";
}

// ─── Stage implementations ───────────────────────────────────

interface StageResult {
	content: string;
	reduction: number;
	timeMs: number;
}

type StageFn = (text: string, ctype: string, mode: CompressionMode) => StageResult;

function semanticDedup(text: string, ctype: string, mode: CompressionMode): StageResult {
	const start = performance.now();
	const lines = text.split("\n");
	const blockSize = Math.max(1, Math.ceil(lines.length / 30));
	const blocks: string[] = [];
	for (let i = 0; i < lines.length; i += blockSize) {
		blocks.push(lines.slice(i, i + blockSize).join("\n"));
	}

	const kept: string[] = [];
	const fps: number[] = [];
	let dupes = 0;
	const threshold = mode === "aggressive" ? 0.7 : 0.85;

	for (const block of blocks) {
		if (!block.trim()) {
			kept.push(block);
			continue;
		}
		const fp = simhash(block);
		const isDup = fps.some((efp) => simhashSimilarity(fp, efp) >= threshold);
		if (isDup) {
			dupes++;
			continue;
		}
		kept.push(block);
		fps.push(fp);
	}

	return {
		content: kept.join("\n"),
		reduction: text.length > 0 ? (1 - kept.join("\n").length / text.length) * 100 : 0,
		timeMs: performance.now() - start,
	};
}

function ionizer(text: string, ctype: string, mode: CompressionMode): StageResult {
	if (ctype !== "json") return { content: text, reduction: 0, timeMs: 0 };
	const start = performance.now();

	try {
		const parsed = JSON.parse(text);
		if (!Array.isArray(parsed) || parsed.length <= 5) {
			return { content: text, reduction: 0, timeMs: performance.now() - start };
		}

		const total = parsed.length;
		const keep = mode === "aggressive" ? 3 : 5;
		const sample = [parsed[0], ...parsed.slice(1, keep - 1), parsed[total - 1]];
		const deduped = [...new Set(sample.map((s) => JSON.stringify(s)))].map((s) => JSON.parse(s));
		const result =
			JSON.stringify(deduped, null, 2) +
			`\n// ... ${total - deduped.length} more items (Ionizer sampled ${deduped.length}/${total})`;

		return {
			content: result,
			reduction: text.length > 0 ? (1 - result.length / text.length) * 100 : 0,
			timeMs: performance.now() - start,
		};
	} catch {
		return { content: text, reduction: 0, timeMs: performance.now() - start };
	}
}

function logCrunch(text: string, ctype: string, mode: CompressionMode): StageResult {
	if (ctype !== "log") return { content: text, reduction: 0, timeMs: 0 };
	const start = performance.now();
	const lines = text.split("\n");
	const result: string[] = [];
	let i = 0;
	let folded = 0;

	while (i < lines.length) {
		let count = 1;
		while (i + count < lines.length && lines[i + count] === lines[i]) count++;
		if (count > 2) {
			result.push(`[x${count}] ${lines[i]}`);
			folded += count - 1;
		} else {
			for (let j = 0; j < count; j++) result.push(lines[i]);
		}
		i += count;
	}

	const output = result.join("\n");
	return {
		content: output,
		reduction: text.length > 0 ? (1 - output.length / text.length) * 100 : 0,
		timeMs: performance.now() - start,
	};
}

const ABBREVIATIONS: Record<string, string> = {
	because: "b/c",
	with: "w/",
	without: "w/o",
	about: "approx",
	approximately: "approx",
	configuration: "config",
	configure: "config",
	documentation: "docs",
	document: "doc",
	implementation: "impl",
	implement: "impl",
	reference: "ref",
	references: "refs",
	repository: "repo",
	repositories: "repos",
	specification: "spec",
	specifications: "specs",
	temporary: "temp",
	version: "v",
};

function abbrev(text: string, ctype: string, mode: CompressionMode): StageResult {
	if (ctype === "code" || ctype === "json") return { content: text, reduction: 0, timeMs: 0 };
	const start = performance.now();
	let result = text;
	let count = 0;

	for (const [word, abbr] of Object.entries(ABBREVIATIONS)) {
		const regex = new RegExp(`\\b${word}\\b`, "gi");
		result = result.replace(regex, () => {
			count++;
			return abbr;
		});
	}

	return {
		content: result,
		reduction: text.length > 0 ? (1 - result.length / text.length) * 100 : 0,
		timeMs: performance.now() - start,
	};
}

function tokenOpt(text: string, ctype: string, mode: CompressionMode): StageResult {
	const start = performance.now();
	const result = text
		.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // Strip bold/italic
		.replace(/ {2,}/g, " ") // Collapse spaces
		.replace(/[ \t]+$/gm, "") // Trailing whitespace
		.replace(/\n{3,}/g, "\n\n") // Collapse blank lines
		.trim();
	return {
		content: result,
		reduction: text.length > 0 ? (1 - result.length / text.length) * 100 : 0,
		timeMs: performance.now() - start,
	};
}

function rleCompress(text: string, ctype: string, mode: CompressionMode): StageResult {
	const start = performance.now();
	const pathPrefixes: [RegExp, string][] = [
		[/\/home\//g, "$HOME/"],
		[/\/Users\//g, "$HOME/"],
		[/\/tmp\//g, "$TMP/"],
		[/\/var\/log\//g, "$LOG/"],
	];
	let result = text;
	for (const [re, sub] of pathPrefixes) {
		result = result.replace(re, sub);
	}
	// Compress IPs
	const ips = new Map<string, number>();
	let ipIdx = 0;
	result = result.replace(/\b(\d{1,3}\.){3}\d{1,3}\b/g, (ip) => {
		if (!ips.has(ip)) ips.set(ip, ipIdx++);
		return `[IP:${ips.get(ip)}]`;
	});

	return {
		content: result,
		reduction: text.length > 0 ? (1 - result.length / text.length) * 100 : 0,
		timeMs: performance.now() - start,
	};
}

// ─── Stage pipeline order ────────────────────────────────────

// Default stages: only those that provide meaningful token reduction.
// Abbrev and TokenOpt excluded — they save <5 tokens on typical content.
const STAGES: Array<{ name: string; order: number; fn: StageFn }> = [
	{ name: "RLE", order: 10, fn: rleCompress },
	{ name: "SemanticDedup", order: 12, fn: semanticDedup },
	{ name: "Ionizer", order: 15, fn: ionizer },
	{ name: "LogCrunch", order: 16, fn: logCrunch },
].sort((a, b) => a.order - b.order);

// ─── Public API ──────────────────────────────────────────────

export class JsCompressor {
	compress(text: string, options: CompressionOptions = {}): CompressionResult {
		const start = performance.now();
		const ctype = detectContentType(text, options.contentType);
		const mode = options.mode ?? "balanced";

		let current = text;
		const stageStats: Record<string, StageStats> = {};

		for (const stage of STAGES) {
			const result = stage.fn(current, ctype, mode);
			if (result.reduction > 0) {
				current = result.content;
			}
			stageStats[stage.name] = {
				applied: result.reduction > 0,
				reductionPct: Math.round(result.reduction * 10) / 10,
				timeMs: Math.round(result.timeMs * 100) / 100,
			};
		}

		const origTokens = estimateTokens(text);
		const compTokens = estimateTokens(current);
		const reduction = origTokens > 0 ? (1 - compTokens / origTokens) * 100 : 0;

		return {
			compressed: current,
			stats: {
				originalTokens: origTokens,
				compressedTokens: compTokens,
				reductionPct: Math.round(reduction * 10) / 10,
				savedTokens: origTokens - compTokens,
				timeMs: Math.round((performance.now() - start) * 100) / 100,
				stages: stageStats,
			},
		};
	}
}
