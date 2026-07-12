import type { Message } from "@earendil-works/pi-ai";
import { describe, expect, it } from "vitest";
import {
	computeFileLists,
	createFileOps,
	extractFileOpsFromMessage,
	formatFileOperations,
	serializeConversation,
} from "../../src/harness/compaction/utils.ts";
import type { AgentMessage } from "../../src/types.ts";

describe("createFileOps", () => {
	it("should create empty file operations", () => {
		const ops = createFileOps();
		expect(ops.read.size).toBe(0);
		expect(ops.written.size).toBe(0);
		expect(ops.edited.size).toBe(0);
	});

	it("should return independent instances", () => {
		const a = createFileOps();
		const b = createFileOps();
		a.read.add("/test");
		expect(b.read.size).toBe(0);
	});
});

describe("extractFileOpsFromMessage", () => {
	it("should extract read file paths", () => {
		const msg = {
			role: "assistant",
			content: [
				{
					type: "toolCall",
					name: "read",
					id: "tc1",
					arguments: { path: "/home/user/file.ts" },
				},
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.has("/home/user/file.ts")).toBe(true);
	});

	it("should extract write file paths", () => {
		const msg = {
			role: "assistant",
			content: [
				{
					type: "toolCall",
					name: "write",
					id: "tc1",
					arguments: { path: "/home/user/output.ts", content: "..." },
				},
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.written.has("/home/user/output.ts")).toBe(true);
	});

	it("should extract edit file paths", () => {
		const msg = {
			role: "assistant",
			content: [
				{
					type: "toolCall",
					name: "edit",
					id: "tc1",
					arguments: { path: "/home/user/config.ts", oldText: "a", newText: "b" },
				},
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.edited.has("/home/user/config.ts")).toBe(true);
	});

	it("should handle multiple tool calls in one message", () => {
		const msg = {
			role: "assistant",
			content: [
				{ type: "toolCall", name: "read", id: "tc1", arguments: { path: "/a.txt" } },
				{ type: "toolCall", name: "write", id: "tc2", arguments: { path: "/b.txt", content: "x" } },
				{ type: "toolCall", name: "edit", id: "tc3", arguments: { path: "/c.txt", oldText: "a", newText: "b" } },
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.has("/a.txt")).toBe(true);
		expect(ops.written.has("/b.txt")).toBe(true);
		expect(ops.edited.has("/c.txt")).toBe(true);
	});

	it("should skip non-assistant messages", () => {
		const msg = { role: "user", content: "hello" } as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.size).toBe(0);
		expect(ops.written.size).toBe(0);
		expect(ops.edited.size).toBe(0);
	});

	it("should skip messages without content array", () => {
		const msg = { role: "assistant", content: "plain text" } as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.size).toBe(0);
	});

	it("should skip tool calls without path", () => {
		const msg = {
			role: "assistant",
			content: [
				{
					type: "toolCall",
					name: "bash",
					id: "tc1",
					arguments: { command: "ls" },
				},
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.size).toBe(0);
	});

	it("should skip text blocks (not tool calls)", () => {
		const msg = {
			role: "assistant",
			content: [
				{ type: "text", text: "I'll read that file" },
				{ type: "toolCall", name: "read", id: "tc1", arguments: { path: "/test.ts" } },
			],
		} as AgentMessage;
		const ops = createFileOps();
		extractFileOpsFromMessage(msg, ops);
		expect(ops.read.size).toBe(1);
	});
});

describe("computeFileLists", () => {
	it("should separate read-only from modified files", () => {
		const ops = createFileOps();
		ops.read.add("/read.ts");
		ops.written.add("/write.ts");
		ops.edited.add("/edit.ts");
		ops.read.add("/also-read.ts");

		const { readFiles, modifiedFiles } = computeFileLists(ops);
		expect(readFiles).toEqual(["/also-read.ts", "/read.ts"]);
		expect(modifiedFiles).toEqual(["/edit.ts", "/write.ts"]);
	});

	it("should treat files that were read AND modified as modified only", () => {
		const ops = createFileOps();
		ops.read.add("/shared.ts");
		ops.written.add("/shared.ts");

		const { readFiles, modifiedFiles } = computeFileLists(ops);
		expect(readFiles).toEqual([]);
		expect(modifiedFiles).toEqual(["/shared.ts"]);
	});

	it("should handle read+edited as modified only", () => {
		const ops = createFileOps();
		ops.read.add("/shared.ts");
		ops.edited.add("/shared.ts");

		const { readFiles, modifiedFiles } = computeFileLists(ops);
		expect(readFiles).toEqual([]);
		expect(modifiedFiles).toEqual(["/shared.ts"]);
	});

	it("should return sorted lists", () => {
		const ops = createFileOps();
		ops.read.add("/z.ts");
		ops.read.add("/a.ts");
		ops.written.add("/m.ts");
		ops.written.add("/b.ts");

		const { readFiles, modifiedFiles } = computeFileLists(ops);
		expect(readFiles).toEqual(["/a.ts", "/z.ts"]);
		expect(modifiedFiles).toEqual(["/b.ts", "/m.ts"]);
	});

	it("should return empty arrays for clean ops", () => {
		const ops = createFileOps();
		const { readFiles, modifiedFiles } = computeFileLists(ops);
		expect(readFiles).toEqual([]);
		expect(modifiedFiles).toEqual([]);
	});
});

describe("formatFileOperations", () => {
	it("should format read files", () => {
		const result = formatFileOperations(["/a.ts", "/b.ts"], []);
		expect(result).toContain("<read-files>");
		expect(result).toContain("/a.ts");
		expect(result).toContain("/b.ts");
		expect(result).toContain("</read-files>");
	});

	it("should format modified files", () => {
		const result = formatFileOperations([], ["/c.ts", "/d.ts"]);
		expect(result).toContain("<modified-files>");
		expect(result).toContain("/c.ts");
		expect(result).toContain("/d.ts");
		expect(result).toContain("</modified-files>");
	});

	it("should format both read and modified", () => {
		const result = formatFileOperations(["/r.ts"], ["/m.ts"]);
		expect(result).toContain("<read-files>");
		expect(result).toContain("<modified-files>");
	});

	it("should return empty string when no files", () => {
		expect(formatFileOperations([], [])).toBe("");
	});
});

describe("serializeConversation", () => {
	it("should serialize user messages", () => {
		const messages: Message[] = [{ role: "user", content: "Hello world" }];
		const result = serializeConversation(messages);
		expect(result).toBe("[User]: Hello world");
	});

	it("should serialize assistant text", () => {
		const messages: Message[] = [
			{
				role: "assistant",
				content: [{ type: "text", text: "I can help with that" }],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[Assistant]: I can help with that");
	});

	it("should serialize thinking blocks", () => {
		const messages: Message[] = [
			{
				role: "assistant",
				content: [
					{ type: "thinking", thinking: "Let me think about this..." },
					{ type: "text", text: "Here is my answer" },
				],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[Assistant thinking]: Let me think about this...");
		expect(result).toContain("[Assistant]: Here is my answer");
	});

	it("should serialize tool calls", () => {
		const messages: Message[] = [
			{
				role: "assistant",
				content: [
					{
						type: "toolCall",
						name: "read",
						id: "tc1",
						arguments: { path: "/test.ts" },
					},
				],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[Assistant tool calls]");
		expect(result).toContain("read(");
		expect(result).toContain("path=");
	});

	it("should serialize tool results", () => {
		const messages: Message[] = [
			{
				role: "toolResult",
				toolCallId: "tc1",
				content: [{ type: "text", text: "File contents here" }],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[Tool result]: File contents here");
	});

	it("should truncate long tool results", () => {
		const longText = "x".repeat(3000);
		const messages: Message[] = [
			{
				role: "toolResult",
				toolCallId: "tc1",
				content: [{ type: "text", text: longText }],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("truncated");
		expect(result.length).toBeLessThan(longText.length + 100);
	});

	it("should join multiple messages", () => {
		const messages: Message[] = [
			{ role: "user", content: "Question 1" },
			{
				role: "assistant",
				content: [{ type: "text", text: "Answer 1" }],
			},
			{ role: "user", content: "Question 2" },
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[User]: Question 1");
		expect(result).toContain("[Assistant]: Answer 1");
		expect(result).toContain("[User]: Question 2");
	});

	it("should handle empty messages", () => {
		const result = serializeConversation([]);
		expect(result).toBe("");
	});

	it("should handle user messages with content parts", () => {
		const messages: Message[] = [
			{
				role: "user",
				content: [
					{ type: "text", text: "Part 1" },
					{ type: "text", text: "Part 2" },
				],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toBe("[User]: Part 1Part 2");
	});

	it("should handle complex tool call arguments", () => {
		const messages: Message[] = [
			{
				role: "assistant",
				content: [
					{
						type: "toolCall",
						name: "edit",
						id: "tc1",
						arguments: {
							path: "/test.ts",
							oldText: "const x = 1;",
							newText: "const x = 2;",
						},
					},
				],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("edit(");
		expect(result).toContain("oldText=");
		expect(result).toContain("newText=");
	});

	it("should handle unserializable arguments gracefully", () => {
		const circular: Record<string, unknown> = { path: "/test.ts" };
		circular.self = circular;
		const messages: Message[] = [
			{
				role: "assistant",
				content: [
					{
						type: "toolCall",
						name: "read",
						id: "tc1",
						arguments: circular,
					},
				],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toContain("[unserializable]");
	});

	it("should skip tool results without text content", () => {
		const messages: Message[] = [
			{
				role: "toolResult",
				toolCallId: "tc1",
				content: [],
			},
		];
		const result = serializeConversation(messages);
		expect(result).toBe("");
	});
});
