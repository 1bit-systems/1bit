import { describe, expect, it } from "vitest";
import { sanitizeBinaryOutput } from "../../src/harness/utils/shell-output.ts";

describe("sanitizeBinaryOutput", () => {
	it("should pass through plain text unchanged", () => {
		expect(sanitizeBinaryOutput("hello world")).toBe("hello world");
	});

	it("should pass through newlines and tabs", () => {
		expect(sanitizeBinaryOutput("line1\nline2\tindented")).toBe("line1\nline2\tindented");
	});

	it("should pass through carriage returns", () => {
		expect(sanitizeBinaryOutput("progress\r")).toBe("progress\r");
	});

	it("should remove null bytes", () => {
		expect(sanitizeBinaryOutput("before\x00after")).toBe("beforeafter");
	});

	it("should remove control characters (0x00-0x1f except tab, lf, cr)", () => {
		// 0x01 (SOH), 0x02 (STX), 0x1b (ESC), 0x1f (US)
		const input = "a\x01b\x02c\x1bd\x1fe";
		expect(sanitizeBinaryOutput(input)).toBe("abcde");
	});

	it("should remove interlinear annotation characters (U+FFF9-U+FFFB)", () => {
		expect(sanitizeBinaryOutput("text\uFFF9annotation\uFFFAoriginal\uFFFBmore")).toBe("textannotationoriginalmore");
	});

	it("should handle emoji and unicode", () => {
		expect(sanitizeBinaryOutput("hello 🌍 world 🎉")).toBe("hello 🌍 world 🎉");
	});

	it("should handle CJK characters", () => {
		expect(sanitizeBinaryOutput("日本語テスト")).toBe("日本語テスト");
	});

	it("should handle empty string", () => {
		expect(sanitizeBinaryOutput("")).toBe("");
	});

	it("should handle string of only control chars", () => {
		expect(sanitizeBinaryOutput("\x00\x01\x02")).toBe("");
	});

	it("should handle mixed binary and text", () => {
		const input = "OK\x00FAIL\x01\x02DONE";
		expect(sanitizeBinaryOutput(input)).toBe("OKFAILDONE");
	});

	it("should preserve printable ASCII range", () => {
		const printable =
			" !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
		expect(sanitizeBinaryOutput(printable)).toBe(printable);
	});

	it("should keep DEL character (0x7f) since it's above 0x1f", () => {
		expect(sanitizeBinaryOutput("hello\x7fworld")).toBe("hello\x7fworld");
	});
});
