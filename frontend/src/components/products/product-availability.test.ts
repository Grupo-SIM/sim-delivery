import { describe, expect, it } from "bun:test";
import { areProductsAvailable } from "./product-availability";

describe("areProductsAvailable", () => {
	it("returns true only when every product is available", () => {
		expect(
			areProductsAvailable(
				[
					{ unitAvailability: [{ available: true, unitId: "unit_1" }] },
					{ unitAvailability: [{ available: true, unitId: "unit_1" }] },
				],
				"unit_1",
			),
		).toBe(true);

		expect(
			areProductsAvailable(
				[
					{ unitAvailability: [{ available: true, unitId: "unit_1" }] },
					{ unitAvailability: [{ available: false, unitId: "unit_1" }] },
				],
				"unit_1",
			),
		).toBe(false);
	});

	it("requires availability in every unit when no unit is selected", () => {
		expect(
			areProductsAvailable(
				[
					{
						unitAvailability: [
							{ available: true, unitId: "unit_1" },
							{ available: false, unitId: "unit_2" },
						],
					},
				],
				null,
			),
		).toBe(false);
	});
});
