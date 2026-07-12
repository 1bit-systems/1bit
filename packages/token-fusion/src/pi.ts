/**
 * Pi integration — hooks into session_before_compact to replace
 * LLM-based compaction with algorithmic token-fusion compression.
 *
 * Usage in your pi extension:
 *
 * ```typescript
 * import { createTokenFusionExtension } from "@1bit-systems/token-fusion/pi";
 *
 * export default createTokenFusionExtension();
 * ```
 */

import type {
  Extension,
  SessionBeforeCompactEvent,
} from "@earendil-works/pi-coding-agent";
import { compress } from "./compress.js";
import { RewindStore } from "./rewind.js";

export interface TokenFusionExtensionOptions {
  /** Enable RewindStore for reversible compression. Default: true. */
  rewind?: boolean;
  /** Compression mode. Default: "balanced". */
  mode?: "light" | "balanced" | "aggressive";
  /** Token threshold to trigger compression (fraction of context window). Default: 0.7. */
  threshold?: number;
}

/**
 * Creates a pi extension that hooks into `session_before_compact`
 * to provide algorithmic compression instead of LLM summarization.
 */
export function createTokenFusionExtension(
  options: TokenFusionExtensionOptions = {},
): Extension {
  const rewind = options.rewind ?? true;
  const mode = options.mode ?? "balanced";
  const threshold = options.threshold ?? 0.7;
  const rewindStore = new RewindStore();

  return {
    name: "token-fusion",

    onSessionBeforeCompact: async (
      event: SessionBeforeCompactEvent,
    ) => {
      const { preparation } = event;
      if (!preparation) return;

      const { messagesToSummarize, turnPrefixMessages, tokensBefore } = preparation;

      // Decide which messages to compress
      const toCompress = messagesToSummarize.length > 0
        ? messagesToSummarize
        : turnPrefixMessages;

      if (toCompress.length === 0) return;

      // Serialize messages to text
      const text = toCompress
        .map((m: any) => {
          const role = m.role ?? "user";
          const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
          return `[${role}]: ${content}`;
        })
        .join("\n\n");

      // Compress
      const result = compress(text, {
        mode,
        rewind,
        contentType: "text",
      });

      // Build summary from compressed output
      const summary = [
        "## Token-Fusion Compressed Context",
        "",
        `Original: ${result.stats.originalTokens} tokens → Compressed: ${result.stats.compressedTokens} tokens (${result.stats.reductionPct}% reduction)`,
        "",
        "### Compressed Content",
        "",
        result.compressed,
        "",
        result.stats.savedTokens > 0
          ? `_Token savings: ${result.stats.savedTokens} tokens (≈ $${(result.stats.savedTokens * 0.000015).toFixed(4)} at GPT-4 rates)_`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Store originals in RewindStore
      const details: Record<string, unknown> = {
        compressionStats: result.stats,
        appliedStages: Object.entries(result.stats.stages)
          .filter(([_, s]) => s.applied)
          .map(([name]) => name),
      };

      if (rewind) {
        const markerId = rewindStore.store(text);
        details.rewindMarker = rewindStore.makeMarker(markerId);
      }

      return {
        compaction: {
          summary,
          firstKeptEntryId: preparation.firstKeptEntryId,
          tokensBefore: tokensBefore ?? result.stats.originalTokens,
          details,
        },
      };
    },
  };
}
