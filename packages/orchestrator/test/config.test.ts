import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("config", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Reset env to clean state between tests
		process.env = { ...originalEnv };
		delete process.env.PI_ORCHESTRATOR_DIR;
		delete process.env.PI_CONFIG_DIR;
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("getOrchestratorDir", () => {
		it("should use PI_ORCHESTRATOR_DIR env var when set", async () => {
			process.env.PI_ORCHESTRATOR_DIR = "/custom/orchestrator";
			// Re-import to pick up env change
			const { getOrchestratorDir } = await import("../src/config.ts");
			expect(getOrchestratorDir()).toBe("/custom/orchestrator");
		});

		it("should use PI_CONFIG_DIR as base when set", async () => {
			delete process.env.PI_ORCHESTRATOR_DIR;
			process.env.PI_CONFIG_DIR = "/custom/config";
			const { getOrchestratorDir } = await import("../src/config.ts");
			expect(getOrchestratorDir()).toBe(join("/custom/config", "orchestrator"));
		});

		it("should default to ~/.1bit/orchestrator", async () => {
			delete process.env.PI_ORCHESTRATOR_DIR;
			delete process.env.PI_CONFIG_DIR;
			const { getOrchestratorDir } = await import("../src/config.ts");
			expect(getOrchestratorDir()).toBe(join(homedir(), ".1bit", "orchestrator"));
		});
	});

	describe("getAuthPath", () => {
		it("should return path under orchestrator dir", async () => {
			process.env.PI_ORCHESTRATOR_DIR = "/test/dir";
			const { getAuthPath } = await import("../src/config.ts");
			expect(getAuthPath()).toBe("/test/dir/auth.json");
		});
	});

	describe("getMachinePath", () => {
		it("should return machine.json under orchestrator dir", async () => {
			process.env.PI_ORCHESTRATOR_DIR = "/test/dir";
			const { getMachinePath } = await import("../src/config.ts");
			expect(getMachinePath()).toBe("/test/dir/machine.json");
		});
	});

	describe("getInstancesPath", () => {
		it("should return instances.json under orchestrator dir", async () => {
			process.env.PI_ORCHESTRATOR_DIR = "/test/dir";
			const { getInstancesPath } = await import("../src/config.ts");
			expect(getInstancesPath()).toBe("/test/dir/instances.json");
		});
	});

	describe("getSocketPath", () => {
		it("should return orchestrator.sock under orchestrator dir", async () => {
			process.env.PI_ORCHESTRATOR_DIR = "/test/dir";
			const { getSocketPath } = await import("../src/config.ts");
			expect(getSocketPath()).toBe("/test/dir/orchestrator.sock");
		});
	});

	describe("VERSION", () => {
		it("should be a non-empty string", async () => {
			const { VERSION } = await import("../src/config.ts");
			expect(typeof VERSION).toBe("string");
			expect(VERSION.length).toBeGreaterThan(0);
		});

		it("should match semver format or fallback", async () => {
			const { VERSION } = await import("../src/config.ts");
			expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
		});
	});

	describe("isBunBinary", () => {
		it("should be a boolean", async () => {
			const { isBunBinary } = await import("../src/config.ts");
			expect(typeof isBunBinary).toBe("boolean");
		});
	});
});
