import { describe, expect, it } from "bun:test";
import { isUnitOpen } from "./isUnitOpen";

// A Wednesday 10:00 local time.
const wed10 = new Date(2026, 6, 1, 10, 0);

const openWed = [{ closed: false, closesAt: "18:00", opensAt: "09:00", weekday: 3 }];

describe("isUnitOpen", () => {
	it("manual override wins over the schedule", () => {
		expect(isUnitOpen(openWed, false, wed10)).toBe(false);
		expect(isUnitOpen([], true, wed10)).toBe(true);
	});

	it("is open inside the weekday range", () => {
		expect(isUnitOpen(openWed, null, wed10)).toBe(true);
	});

	it("is closed outside the range or on a closed/missing weekday", () => {
		expect(isUnitOpen(openWed, null, new Date(2026, 6, 1, 20, 0))).toBe(false);
		expect(isUnitOpen([{ closed: true, closesAt: null, opensAt: null, weekday: 3 }], null, wed10)).toBe(false);
		expect(isUnitOpen([], null, wed10)).toBe(false);
	});

	it("handles a range crossing midnight", () => {
		const overnight = [{ closed: false, closesAt: "02:00", opensAt: "18:00", weekday: 3 }];
		expect(isUnitOpen(overnight, null, new Date(2026, 6, 1, 23, 0))).toBe(true);
		expect(isUnitOpen(overnight, null, new Date(2026, 6, 1, 1, 0))).toBe(true);
		expect(isUnitOpen(overnight, null, new Date(2026, 6, 1, 12, 0))).toBe(false);
	});
});
