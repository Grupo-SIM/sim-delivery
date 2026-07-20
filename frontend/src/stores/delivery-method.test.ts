import { beforeEach, describe, expect, it } from "bun:test";

import { installLocalStorageStub } from "./tests/local-storage-stub";

const storage = installLocalStorageStub();
const { useDeliveryMethodStore } = await import("./delivery-method");

const both = ["delivery", "pickup"];

describe("delivery method store", () => {
	beforeEach(() => {
		storage.clear();
		useDeliveryMethodStore.setState({ methods: {} });
	});

	it("defaults to delivery when the unit offers it", () => {
		expect(useDeliveryMethodStore.getState().getMethod("unit_1", both)).toBe("delivery");
	});

	it("falls back to pickup when delivery is not offered", () => {
		expect(useDeliveryMethodStore.getState().getMethod("unit_1", ["pickup"])).toBe("pickup");
	});

	it("falls back to pickup when the unit offers nothing", () => {
		expect(useDeliveryMethodStore.getState().getMethod("unit_1", [])).toBe("pickup");
	});

	it("remembers the customer's choice per unit", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "pickup");

		expect(useDeliveryMethodStore.getState().getMethod("unit_1", both)).toBe("pickup");
	});

	it("keeps each unit's choice independent", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "pickup");
		useDeliveryMethodStore.getState().setMethod("unit_2", "delivery");

		expect(useDeliveryMethodStore.getState().getMethod("unit_1", both)).toBe("pickup");
		expect(useDeliveryMethodStore.getState().getMethod("unit_2", both)).toBe("delivery");
	});

	it("does not leak one unit's choice into another", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "pickup");

		expect(useDeliveryMethodStore.getState().getMethod("unit_2", both)).toBe("delivery");
	});

	it("ignores a saved choice the unit no longer offers", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "delivery");

		expect(useDeliveryMethodStore.getState().getMethod("unit_1", ["pickup"])).toBe("pickup");
	});

	it("overwrites a previous choice for the same unit", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "pickup");
		useDeliveryMethodStore.getState().setMethod("unit_1", "delivery");

		expect(useDeliveryMethodStore.getState().getMethod("unit_1", both)).toBe("delivery");
	});

	it("persists the choice so it survives a reload", () => {
		useDeliveryMethodStore.getState().setMethod("unit_1", "pickup");

		expect(JSON.parse(storage.get("delivery-method")!).state.methods).toEqual({ unit_1: "pickup" });
	});
});
