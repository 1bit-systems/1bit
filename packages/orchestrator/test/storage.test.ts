import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InstanceRecord, MachineRecord } from "../src/types.ts";

// We need to mock the config module before importing storage
const testDir = join(tmpdir(), `orchestrator-test-${randomUUID()}`);

// Mock config to use a temp directory
vi.mock("../src/config.ts", () => ({
	getOrchestratorDir: () => testDir,
	getMachinePath: () => join(testDir, "machine.json"),
	getInstancesPath: () => join(testDir, "instances.json"),
	getAuthPath: () => join(testDir, "auth.json"),
	getSocketPath: () => join(testDir, "orchestrator.sock"),
	VERSION: "1.0.0-test",
	isBunBinary: false,
}));

import {
	deleteMachine,
	getInstance,
	loadInstances,
	loadMachine,
	removeInstance,
	saveInstances,
	saveMachine,
	upsertInstance,
} from "../src/storage.ts";

describe("storage", () => {
	beforeEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe("machine storage", () => {
		it("should return undefined when no machine exists", () => {
			const machine = loadMachine();
			expect(machine).toBeUndefined();
		});

		it("should save and load a machine record", () => {
			const machine: MachineRecord = {
				id: randomUUID(),
				createdAt: new Date().toISOString(),
				label: "test-machine",
			};
			saveMachine(machine);

			const loaded = loadMachine();
			expect(loaded).toBeDefined();
			expect(loaded!.id).toBe(machine.id);
			expect(loaded!.label).toBe("test-machine");
		});

		it("should overwrite existing machine", () => {
			const machine1: MachineRecord = {
				id: "id-1",
				createdAt: "2024-01-01T00:00:00.000Z",
			};
			saveMachine(machine1);

			const machine2: MachineRecord = {
				id: "id-2",
				createdAt: "2024-06-01T00:00:00.000Z",
				label: "updated",
			};
			saveMachine(machine2);

			const loaded = loadMachine();
			expect(loaded!.id).toBe("id-2");
			expect(loaded!.label).toBe("updated");
		});

		it("should delete a machine record", () => {
			const machine: MachineRecord = {
				id: randomUUID(),
				createdAt: new Date().toISOString(),
			};
			saveMachine(machine);
			expect(loadMachine()).toBeDefined();

			deleteMachine();
			expect(loadMachine()).toBeUndefined();
		});

		it("should not throw when deleting non-existent machine", () => {
			expect(() => deleteMachine()).not.toThrow();
		});

		it("should persist to disk as JSON", () => {
			const machine: MachineRecord = {
				id: "test-id",
				createdAt: "2024-01-01T00:00:00.000Z",
				lastSeenAt: "2024-06-01T00:00:00.000Z",
			};
			saveMachine(machine);

			const rawPath = join(testDir, "machine.json");
			expect(existsSync(rawPath)).toBe(true);
			const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
			expect(raw.id).toBe("test-id");
			expect(raw.lastSeenAt).toBe("2024-06-01T00:00:00.000Z");
		});
	});

	describe("instance storage", () => {
		it("should return empty array when no instances exist", () => {
			const instances = loadInstances();
			expect(instances).toEqual([]);
		});

		it("should save and load instances", () => {
			const instances: InstanceRecord[] = [
				{
					id: "inst-1",
					status: "online",
					cwd: "/project",
					createdAt: new Date().toISOString(),
					label: "agent-1",
				},
				{
					id: "inst-2",
					status: "stopped",
					cwd: "/other",
					createdAt: new Date().toISOString(),
				},
			];
			saveInstances(instances);

			const loaded = loadInstances();
			expect(loaded.length).toBe(2);
			expect(loaded[0].id).toBe("inst-1");
			expect(loaded[1].status).toBe("stopped");
		});

		it("should get instance by ID", () => {
			const instances: InstanceRecord[] = [
				{ id: "a", status: "online", cwd: "/a", createdAt: "2024-01-01T00:00:00.000Z" },
				{ id: "b", status: "stopped", cwd: "/b", createdAt: "2024-01-01T00:00:00.000Z" },
				{ id: "c", status: "starting", cwd: "/c", createdAt: "2024-01-01T00:00:00.000Z" },
			];
			saveInstances(instances);

			const found = getInstance("b");
			expect(found).toBeDefined();
			expect(found!.cwd).toBe("/b");
			expect(found!.status).toBe("stopped");
		});

		it("should return undefined for non-existent instance", () => {
			saveInstances([]);
			const found = getInstance("nonexistent");
			expect(found).toBeUndefined();
		});

		it("should upsert a new instance", () => {
			saveInstances([]);
			const instance: InstanceRecord = {
				id: "new-inst",
				status: "starting",
				cwd: "/tmp",
				createdAt: new Date().toISOString(),
			};
			upsertInstance(instance);

			const loaded = loadInstances();
			expect(loaded.length).toBe(1);
			expect(loaded[0].id).toBe("new-inst");
		});

		it("should upsert an existing instance (update)", () => {
			const instance: InstanceRecord = {
				id: "inst-1",
				status: "starting",
				cwd: "/tmp",
				createdAt: "2024-01-01T00:00:00.000Z",
			};
			saveInstances([instance]);

			const updated: InstanceRecord = {
				...instance,
				status: "online",
				sessionId: "sess-1",
			};
			upsertInstance(updated);

			const loaded = loadInstances();
			expect(loaded.length).toBe(1);
			expect(loaded[0].status).toBe("online");
			expect(loaded[0].sessionId).toBe("sess-1");
		});

		it("should remove an instance", () => {
			const instances: InstanceRecord[] = [
				{ id: "a", status: "online", cwd: "/a", createdAt: "2024-01-01T00:00:00.000Z" },
				{ id: "b", status: "stopped", cwd: "/b", createdAt: "2024-01-01T00:00:00.000Z" },
			];
			saveInstances(instances);

			removeInstance("a");

			const remaining = loadInstances();
			expect(remaining.length).toBe(1);
			expect(remaining[0].id).toBe("b");
		});

		it("should not throw when removing non-existent instance", () => {
			saveInstances([]);
			expect(() => removeInstance("nonexistent")).not.toThrow();
		});

		it("should persist instances as JSON array", () => {
			const instances: InstanceRecord[] = [
				{ id: "i1", status: "online", cwd: "/x", createdAt: "2024-01-01T00:00:00.000Z" },
			];
			saveInstances(instances);

			const rawPath = join(testDir, "instances.json");
			const raw = JSON.parse(readFileSync(rawPath, "utf-8"));
			expect(Array.isArray(raw)).toBe(true);
			expect(raw[0].id).toBe("i1");
		});
	});

	describe("integration: machine + instances coexist", () => {
		it("should allow both machine and instances to be stored independently", () => {
			const machine: MachineRecord = { id: "m1", createdAt: "2024-01-01T00:00:00.000Z" };
			const instances: InstanceRecord[] = [
				{ id: "i1", status: "online", cwd: "/p", createdAt: "2024-01-01T00:00:00.000Z" },
			];

			saveMachine(machine);
			saveInstances(instances);

			expect(loadMachine()!.id).toBe("m1");
			expect(loadInstances().length).toBe(1);

			deleteMachine();
			expect(loadMachine()).toBeUndefined();
			expect(loadInstances().length).toBe(1); // instances unaffected
		});
	});
});
