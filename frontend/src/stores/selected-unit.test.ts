import { beforeEach, describe, expect, it } from "bun:test";

import { installLocalStorageStub } from "./tests/local-storage-stub";

const storage = installLocalStorageStub();
const { useSelectedUnitStore } = await import("./selected-unit");
type SelectedUnit = import("./selected-unit").SelectedUnit;

const unit: SelectedUnit = { id: "unit_1", name: "Boa Viagem", slug: "boa-viagem" };

describe("selected unit store", () => {
	beforeEach(() => {
		storage.clear();
		useSelectedUnitStore.setState({ unit: null });
	});

	it("starts with no unit chosen", () => {
		expect(useSelectedUnitStore.getState().unit).toBeNull();
	});

	it("stores the chosen unit", () => {
		useSelectedUnitStore.getState().setUnit(unit);

		expect(useSelectedUnitStore.getState().unit).toEqual(unit);
	});

	it("replaces the previous unit when another is chosen", () => {
		const other: SelectedUnit = { id: "unit_2", name: "Casa Forte", slug: "casa-forte" };
		useSelectedUnitStore.getState().setUnit(unit);
		useSelectedUnitStore.getState().setUnit(other);

		expect(useSelectedUnitStore.getState().unit).toEqual(other);
	});

	it("clears the chosen unit", () => {
		useSelectedUnitStore.getState().setUnit(unit);
		useSelectedUnitStore.getState().clear();

		expect(useSelectedUnitStore.getState().unit).toBeNull();
	});

	it("clearing with no unit chosen is a no-op", () => {
		useSelectedUnitStore.getState().clear();

		expect(useSelectedUnitStore.getState().unit).toBeNull();
	});

	it("persists the chosen unit so it survives a reload", () => {
		useSelectedUnitStore.getState().setUnit(unit);

		expect(JSON.parse(storage.get("selected-unit")!).state.unit).toEqual(unit);
	});
});
