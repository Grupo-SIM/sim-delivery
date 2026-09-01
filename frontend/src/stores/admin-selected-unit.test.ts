import { beforeEach, describe, expect, it } from "bun:test";

import { installLocalStorageStub } from "./tests/local-storage-stub";

const storage = installLocalStorageStub();
const { useAdminSelectedUnitStore } = await import("./admin-selected-unit");

describe("admin selected unit store", () => {
	beforeEach(() => {
		storage.clear();
		useAdminSelectedUnitStore.setState({ unitId: null });
	});

	it("stores the working unit", () => {
		useAdminSelectedUnitStore.getState().setUnitId("unit_1");

		expect(useAdminSelectedUnitStore.getState().unitId).toBe("unit_1");
	});

	it("replaces the previous working unit", () => {
		useAdminSelectedUnitStore.getState().setUnitId("unit_1");
		useAdminSelectedUnitStore.getState().setUnitId("unit_2");

		expect(useAdminSelectedUnitStore.getState().unitId).toBe("unit_2");
	});

	it("clears the working unit", () => {
		useAdminSelectedUnitStore.getState().setUnitId("unit_1");
		useAdminSelectedUnitStore.getState().clear();

		expect(useAdminSelectedUnitStore.getState().unitId).toBeNull();
	});

	it("persists the working unit", () => {
		useAdminSelectedUnitStore.getState().setUnitId("unit_1");

		expect(JSON.parse(storage.get("admin-selected-unit")!).state.unitId).toBe("unit_1");
	});
});
