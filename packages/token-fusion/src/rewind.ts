/**
 * RewindStore — hash-addressed reversible retrieval for compressed content.
 *
 * Stores original content by SHA-256 hash. Compressed output contains
 * markers like `[rewind:deadbeef...]` that can be used to retrieve the original.
 */

import { createHash } from "node:crypto";

const REWIND_PREFIX = "[rewind:";
const REWIND_SUFFIX = "]";

export class RewindStore {
  private _store = new Map<string, string>();
  private _accessOrder: string[] = [];
  private _maxEntries: number;

  constructor(maxEntries = 10_000) {
    this._maxEntries = maxEntries;
  }

  /** Store original content and return its marker ID (first 16 hex chars of SHA-256). */
  store(original: string, markerId?: string): string {
    const id = markerId ?? createHash("sha256").update(original).digest("hex").slice(0, 16);

    if (!this._store.has(id)) {
      // Evict LRU if at capacity
      if (this._store.size >= this._maxEntries) {
        const oldest = this._accessOrder.shift()!;
        this._store.delete(oldest);
      }
      this._store.set(id, original);
      this._accessOrder.push(id);
    } else {
      // Bump in access order
      const idx = this._accessOrder.indexOf(id);
      if (idx >= 0) this._accessOrder.splice(idx, 1);
      this._accessOrder.push(id);
    }

    return id;
  }

  /** Retrieve original content by marker ID. */
  retrieve(markerId: string): string | undefined {
    if (this._store.has(markerId)) {
      const idx = this._accessOrder.indexOf(markerId);
      if (idx >= 0) this._accessOrder.splice(idx, 1);
      this._accessOrder.push(markerId);
      return this._store.get(markerId);
    }
    return undefined;
  }

  /** Create a rewind marker string. */
  makeMarker(id: string): string {
    return `${REWIND_PREFIX}${id}${REWIND_SUFFIX}`;
  }

  /** Parse a marker string to get the ID. */
  parseMarker(text: string): string | undefined {
    if (text.startsWith(REWIND_PREFIX) && text.endsWith(REWIND_SUFFIX)) {
      return text.slice(REWIND_PREFIX.length, -REWIND_SUFFIX.length);
    }
    return undefined;
  }

  /** Extract the first rewind marker found in text. */
  extractMarker(text: string): string | undefined {
    const match = text.match(/\[rewind:([a-f0-9]+)\]/);
    return match?.[1];
  }

  get size(): number {
    return this._store.size;
  }

  clear(): void {
    this._store.clear();
    this._accessOrder = [];
  }
}
