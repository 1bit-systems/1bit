import { describe, it, expect } from "vitest";
import { JsCompressor } from "../src/js-compress.js";
import { RewindStore } from "../src/rewind.js";
import { compressMessages, compress } from "../src/compress.js";

describe("JsCompressor", () => {
  const c = new JsCompressor();

  it("compresses JSON arrays", () => {
    const json = JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ id: i, name: `item_${i}` })));
    const r = c.compress(json, { contentType: "json" });
    expect(r.stats.reductionPct).toBeGreaterThan(50);
    expect(r.compressed).toContain("more items");
  });

  it("compresses logs with repetition", () => {
    const log = "2024-01-01 10:00:00 INFO starting\n".repeat(50);
    const r = c.compress(log, { contentType: "log" });
    // SimHash dedup catches repeated blocks first — either way, high compression
    expect(r.stats.reductionPct).toBeGreaterThan(70);
  });

  it("skips abbrev on code", () => {
    const code = 'def calculate_configuration():\n    return "config"';
    const r = c.compress(code, { contentType: "code" });
    expect(r.compressed).toContain("calculate_configuration");
  });

  it("returns stats", () => {
    const r = c.compress("hello world");
    expect(r.stats.originalTokens).toBeGreaterThan(0);
    expect(r.stats.compressedTokens).toBeGreaterThan(0);
    expect(typeof r.stats.reductionPct).toBe("number");
    expect(typeof r.stats.timeMs).toBe("number");
    expect(r.stats.stages).toBeDefined();
  });

  it("applies abbrev on text", () => {
    const r = c.compress("The configuration file with the application", { contentType: "text" });
    expect(r.stats.reductionPct).toBeGreaterThanOrEqual(0);
  });

  it("aggressive mode compresses more", () => {
    const json = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i })));
    const balanced = c.compress(json, { contentType: "json", mode: "balanced" });
    const aggressive = c.compress(json, { contentType: "json", mode: "aggressive" });
    expect(aggressive.stats.reductionPct).toBeGreaterThanOrEqual(balanced.stats.reductionPct);
  });
});

describe("RewindStore", () => {
  it("stores and retrieves content", () => {
    const store = new RewindStore();
    const id = store.store("secret content");
    expect(store.retrieve(id)).toBe("secret content");
  });

  it("creates and parses markers", () => {
    const store = new RewindStore();
    const id = store.store("test");
    const marker = store.makeMarker(id);
    expect(marker).toMatch(/^\[rewind:/);
    expect(store.parseMarker(marker)).toBe(id);
  });

  it("extracts markers from text", () => {
    const store = new RewindStore();
    const id = store.store("test");
    const marker = store.makeMarker(id);
    const text = `Some text ${marker} more text`;
    expect(store.extractMarker(text)).toBe(id);
  });

  it("enforces max entries", () => {
    const store = new RewindStore(2);
    store.store("a");
    store.store("b");
    store.store("c");
    expect(store.size).toBe(2);
  });
});

describe("compressMessages", () => {
  it("compresses multiple messages", () => {
    const msgs = [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Write code for fibonacci." },
    ];
    const r = compressMessages(msgs);
    expect(r.perMessage).toHaveLength(2);
    expect(r.stats.totalOriginalTokens).toBeGreaterThan(0);
    expect(r.stats.totalTimeMs).toBeGreaterThanOrEqual(0);
  });
});
