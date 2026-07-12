/** Content type hints for the compression pipeline. */
export type ContentType = "text" | "code" | "json" | "log" | "diff" | "search";

/** Compression mode — controls how aggressively stages apply. */
export type CompressionMode = "light" | "balanced" | "aggressive";

/** Options for compress(). */
export interface CompressionOptions {
  /** Content type hint (auto-detected if omitted). */
  contentType?: ContentType;
  /** Programming language hint. */
  language?: string;
  /** Message role for context-sensitive compression. */
  role?: "system" | "user" | "assistant" | "tool";
  /** Compression aggressiveness. Default: "balanced". */
  mode?: CompressionMode;
  /** Enable reversible compression with RewindStore. Default: false. */
  rewind?: boolean;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
}

/** Result from compress(). */
export interface CompressionResult {
  /** The compressed text. */
  compressed: string;
  /** Compression stats. */
  stats: {
    originalTokens: number;
    compressedTokens: number;
    reductionPct: number;
    savedTokens: number;
    timeMs: number;
    stages: Record<string, StageStats>;
  };
  /** Rewind markers, if rewind was enabled. */
  markers?: Array<{ id: string; marker: string }>;
}

/** Per-stage statistics. */
export interface StageStats {
  applied: boolean;
  reductionPct: number;
  timeMs: number;
  metadata?: Record<string, unknown>;
}

/** Multi-message compression result. */
export interface MessagesCompressionResult {
  perMessage: Array<{
    role: string;
    original: string;
    compressed: string;
    stats: CompressionResult["stats"];
  }>;
  stats: {
    totalOriginalTokens: number;
    totalCompressedTokens: number;
    totalReductionPct: number;
    totalTimeMs: number;
  };
}
