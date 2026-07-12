import { describe, expect, it } from "vitest";
import type {
	ErrorResponse,
	ListRequest,
	ListResponse,
	OrchestratorRequest,
	OrchestratorResponse,
	RpcBridgeResponse,
	RpcClientMessage,
	RpcRequest,
	RpcServerMessage,
	SpawnRequest,
	SpawnResponse,
	StatusRequest,
	StatusResponse,
	StopRequest,
	StopResponse,
} from "../src/ipc/protocol.ts";
import { encodeMessage, parseRequestLine, parseResponseLine } from "../src/ipc/protocol.ts";

describe("encodeMessage", () => {
	it("should encode a message as JSON followed by newline", () => {
		const msg: SpawnRequest = { type: "spawn", cwd: "/home/user/project" };
		const result = encodeMessage(msg);
		expect(result).toBe('{"type":"spawn","cwd":"/home/user/project"}\n');
	});

	it("should encode a message with optional fields", () => {
		const msg: SpawnRequest = {
			type: "spawn",
			cwd: "/tmp",
			label: "test-agent",
			provider: "anthropic",
			model: "claude-sonnet-4-20250514",
		};
		const result = encodeMessage(msg);
		const parsed = JSON.parse(result.trim());
		expect(parsed.type).toBe("spawn");
		expect(parsed.cwd).toBe("/tmp");
		expect(parsed.label).toBe("test-agent");
		expect(parsed.provider).toBe("anthropic");
		expect(parsed.model).toBe("claude-sonnet-4-20250514");
	});

	it("should encode list request", () => {
		const msg: ListRequest = { type: "list" };
		const result = encodeMessage(msg);
		expect(result).toBe('{"type":"list"}\n');
	});

	it("should encode stop request", () => {
		const msg: StopRequest = { type: "stop", instanceId: "abc-123" };
		const result = encodeMessage(msg);
		const parsed = JSON.parse(result.trim());
		expect(parsed.type).toBe("stop");
		expect(parsed.instanceId).toBe("abc-123");
	});

	it("should encode status request", () => {
		const msg: StatusRequest = { type: "status", instanceId: "def-456" };
		const result = encodeMessage(msg);
		const parsed = JSON.parse(result.trim());
		expect(parsed.instanceId).toBe("def-456");
	});

	it("should encode RPC request with command", () => {
		const msg: RpcRequest = {
			type: "rpc",
			instanceId: "inst-1",
			command: { type: "send_message", message: "hello" } as any,
		};
		const result = encodeMessage(msg);
		const parsed = JSON.parse(result.trim());
		expect(parsed.instanceId).toBe("inst-1");
		expect(parsed.command.type).toBe("send_message");
	});

	it("should always terminate with newline", () => {
		const msg: ListRequest = { type: "list" };
		const result = encodeMessage(msg);
		expect(result.endsWith("\n")).toBe(true);
	});

	it("should not contain extra newlines in JSON", () => {
		const msg: SpawnRequest = { type: "spawn", cwd: "/a\nb" }; // pathological cwd
		const result = encodeMessage(msg);
		// JSON.stringify escapes newlines in strings
		const lines = result.split("\n");
		expect(lines.length).toBe(2); // JSON line + trailing empty string
	});

	it("should encode response messages", () => {
		const response: SpawnResponse = {
			type: "spawn_result",
			ok: true,
			instance: { id: "i1", status: "online", cwd: "/tmp" },
		};
		const result = encodeMessage(response);
		const parsed = JSON.parse(result.trim());
		expect(parsed.ok).toBe(true);
		expect(parsed.instance?.id).toBe("i1");
	});

	it("should encode error responses", () => {
		const response: ErrorResponse = {
			type: "error",
			ok: false,
			error: "instance not found",
		};
		const result = encodeMessage(response);
		const parsed = JSON.parse(result.trim());
		expect(parsed.ok).toBe(false);
		expect(parsed.error).toBe("instance not found");
	});
});

describe("parseRequestLine", () => {
	it("should parse a spawn request", () => {
		const line = '{"type":"spawn","cwd":"/home/user/project"}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("spawn");
		expect((result as SpawnRequest).cwd).toBe("/home/user/project");
	});

	it("should parse a list request", () => {
		const line = '{"type":"list"}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("list");
	});

	it("should parse a stop request", () => {
		const line = '{"type":"stop","instanceId":"abc"}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("stop");
	});

	it("should parse a status request", () => {
		const line = '{"type":"status","instanceId":"xyz"}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("status");
	});

	it("should parse an RPC request", () => {
		const line = '{"type":"rpc","instanceId":"i1","command":{"type":"send_message","message":"hi"}}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("rpc");
	});

	it("should parse input without trailing newline", () => {
		const line = '{"type":"list"}';
		const result = parseRequestLine(line);
		expect(result.type).toBe("list");
	});

	it("should parse input with leading whitespace", () => {
		const line = '  {"type":"list"}\n';
		const result = parseRequestLine(line);
		expect(result.type).toBe("list");
	});

	it("should throw on invalid JSON", () => {
		expect(() => parseRequestLine("not-json")).toThrow();
	});

	it("should throw on empty string", () => {
		expect(() => parseRequestLine("")).toThrow();
	});
});

describe("parseResponseLine", () => {
	it("should parse a spawn response", () => {
		const line = '{"type":"spawn_result","ok":true,"instance":{"id":"i1","status":"online","cwd":"/tmp"}}\n';
		const result = parseResponseLine(line);
		expect(result.type).toBe("spawn_result");
		expect(result.ok).toBe(true);
	});

	it("should parse a list response with instances", () => {
		const line =
			'{"type":"list_result","ok":true,"instances":[{"id":"i1","status":"online","cwd":"/tmp"},{"id":"i2","status":"stopped","cwd":"/home"}]}\n';
		const result = parseResponseLine(line) as ListResponse;
		expect(result.type).toBe("list_result");
		expect(result.instances?.length).toBe(2);
		expect(result.instances?.[0].id).toBe("i1");
		expect(result.instances?.[1].status).toBe("stopped");
	});

	it("should parse an error response", () => {
		const line = '{"type":"error","ok":false,"error":"something went wrong"}\n';
		const result = parseResponseLine(line) as ErrorResponse;
		expect(result.ok).toBe(false);
		expect(result.error).toBe("something went wrong");
	});

	it("should parse a stop response", () => {
		const line = '{"type":"stop_result","ok":true,"instanceId":"i1"}\n';
		const result = parseResponseLine(line) as StopResponse;
		expect(result.type).toBe("stop_result");
		expect(result.instanceId).toBe("i1");
	});

	it("should parse a status response", () => {
		const line =
			'{"type":"status_result","ok":true,"instance":{"id":"i1","status":"online","cwd":"/tmp","label":"my agent"}}\n';
		const result = parseResponseLine(line) as StatusResponse;
		expect(result.instance?.label).toBe("my agent");
		expect(result.instance?.status).toBe("online");
	});

	it("should parse RPC bridge response", () => {
		const line = '{"type":"rpc_result","ok":true,"response":{"id":"req-1","result":{"type":"ok","data":"done"}}}\n';
		const result = parseResponseLine(line) as RpcBridgeResponse;
		expect(result.type).toBe("rpc_result");
		expect(result.response.id).toBe("req-1");
	});

	it("should throw on invalid JSON", () => {
		expect(() => parseResponseLine("{invalid")).toThrow();
	});
});

describe("protocol round-trip", () => {
	it("should encode then parse a request", () => {
		const msg: SpawnRequest = { type: "spawn", cwd: "/project", label: "test" };
		const encoded = encodeMessage(msg);
		const decoded = parseRequestLine(encoded);
		expect(decoded.type).toBe("spawn");
	});

	it("should encode then parse a response", () => {
		const msg: ListResponse = {
			type: "list_result",
			ok: true,
			instances: [],
		};
		const encoded = encodeMessage(msg);
		const decoded = parseResponseLine(encoded) as ListResponse;
		expect(decoded.ok).toBe(true);
		expect(decoded.instances).toEqual([]);
	});
});
