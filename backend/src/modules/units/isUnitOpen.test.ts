import { describe, expect, it } from "bun:test";
import { isUnitOpen } from "./isUnitOpen";

const day = (weekday: number, opensAt: string, closesAt: string) => ({
	closed: false,
	closesAt,
	opensAt,
	weekday,
});

describe("isUnitOpen", () => {
	it("uses the manual availability when configured", () => {
		const now = new Date(2026, 6, 13, 12);
		expect(isUnitOpen([], true, now)).toBe(true);
		expect(isUnitOpen([day(1, "09:00", "18:00")], false, now)).toBe(false);
	});

	it("identifies regular hours on the current weekday", () => {
		const monday = day(1, "09:00", "18:00");
		expect(isUnitOpen([monday], null, new Date(2026, 6, 13, 12))).toBe(true);
		expect(isUnitOpen([monday], null, new Date(2026, 6, 13, 18))).toBe(false);
		expect(isUnitOpen([], null, new Date(2026, 6, 13, 12))).toBe(false);
	});

	it("keeps an overnight schedule open after midnight on the following weekday", () => {
		const monday = day(1, "18:00", "02:00");
		const tuesday = day(2, "09:00", "18:00");

		expect(isUnitOpen([monday, tuesday], null, new Date(2026, 6, 14, 1))).toBe(true);
		expect(isUnitOpen([monday, tuesday], null, new Date(2026, 6, 14, 2))).toBe(false);
	});

	it("opens an overnight schedule only after its opening time", () => {
		const tuesday = day(2, "18:00", "02:00");
		expect(isUnitOpen([tuesday], null, new Date(2026, 6, 14, 23))).toBe(true);
		expect(isUnitOpen([tuesday], null, new Date(2026, 6, 14, 1))).toBe(false);
	});

	it("uses the requesting client's time zone instead of the server time zone", () => {
		const monday = day(1, "15:00", "23:00");
		const instant = new Date("2026-07-14T03:26:00.000Z");

		expect(isUnitOpen([monday], null, instant, "America/Rio_Branco")).toBe(true);
		expect(isUnitOpen([monday], null, instant, "UTC")).toBe(false);
	});
});
