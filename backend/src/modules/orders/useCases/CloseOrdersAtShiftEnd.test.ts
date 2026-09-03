import { describe, expect, it } from "bun:test";
import { getLatestCompletedShift } from "./CloseOrdersAtShiftEnd";

describe("getLatestCompletedShift", () => {
	it("returns the shift that ended today", () => {
		const shift = getLatestCompletedShift(
			[{ closed: false, closesAt: "18:00", opensAt: "09:00", weekday: 4 }],
			new Date(2026, 6, 23, 18, 0),
		);

		expect(shift).toEqual({ end: new Date(2026, 6, 23, 18, 0), start: new Date(2026, 6, 23, 9, 0) });
	});

	it("keeps overnight shifts open until their next-day closing time", () => {
		const hours = [{ closed: false, closesAt: "02:00", opensAt: "18:00", weekday: 3 }];

		expect(getLatestCompletedShift(hours, new Date(2026, 6, 23, 1, 59))).toBeNull();
		expect(getLatestCompletedShift(hours, new Date(2026, 6, 23, 2, 0))).toEqual({
			end: new Date(2026, 6, 23, 2, 0),
			start: new Date(2026, 6, 22, 18, 0),
		});
	});
});
