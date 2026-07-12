/**
 * Token Fusion — LLM context compression.
 *
 * TypeScript API for the algorithmic 14-stage Fusion Pipeline.
 * Calls the Python `token_fusion` library via subprocess. For an
 * all-JS port, see the compression primitives in `compress.ts`.
 */

export type { CompressionResult, CompressionOptions, RewindStore } from "./types.js";
export { compress, compressMessages, estimateTokens } from "./compress.js";
export { RewindStore } from "./rewind.js";
