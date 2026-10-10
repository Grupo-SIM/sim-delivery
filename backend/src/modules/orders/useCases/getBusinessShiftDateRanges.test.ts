import { describe, expect, it } from "bun:test";
import { getBusinessShiftDateRanges } from "./getBusinessShiftDateRanges";

const hours = [4, 5, 6].map(weekday => ({ closed: false, closesAt: "03:00", opensAt: "18:00", weekday }));

describe("getBusinessShiftDateRanges", () => {
	it("includes the following morning in the opening date, without overlap", () => {
		const [range] = getBusinessShiftDateRanges(hours, "2026-10-22", "2026-10-22");
		expect(new Date(2026, 9, 23, 2, 59, 59).getTime()).toBeLessThan(range.lt!.getTime());
		expect(new Date(2026, 9, 23, 3).getTime()).toBe(range.lt!.getTime());
		expect(range).toEqual({ gte: new Date(2026, 9, 22, 18), lt: new Date(2026, 9, 23, 3) });
		expect(getBusinessShiftDateRanges(hours, "2026-10-23", "2026-10-23")[0]).toEqual({
			gte: new Date(2026, 9, 23, 18), lt: new Date(2026, 9, 24, 3),
		});
	});

	it("includes each selected shift and its overnight tail", () => {
		expect(getBusinessShiftDateRanges(hours, "2026-10-22", "2026-10-24")).toHaveLength(3);
	});

	it("excludes yesterday's overnight tail on a closed day", () => {
		expect(getBusinessShiftDateRanges([hours[0]], "2026-10-23", "2026-10-23")).toEqual([
			{ gte: new Date(2026, 9, 23, 3), lt: new Date(2026, 9, 24) },
		]);
	});

	it("uses calendar days when schedules are missing or closed", () => {
		const expected = [{ gte: new Date(2026, 9, 22), lt: new Date(2026, 9, 23) }];
		expect(getBusinessShiftDateRanges([], "2026-10-22", "2026-10-22")).toEqual(expected);
		expect(getBusinessShiftDateRanges([{ ...hours[0], closed: true }], "2026-10-22", "2026-10-22")).toEqual(expected);
	});

	it("handles daytime, full-day shifts and open bounds", () => {
		const daytime = [{ ...hours[0], closesAt: "23:00" }];
		expect(getBusinessShiftDateRanges(daytime, "2026-10-22", "2026-10-22")[0]).toEqual({ gte: new Date(2026, 9, 22, 18), lt: new Date(2026, 9, 22, 23) });
		expect(getBusinessShiftDateRanges([{ ...hours[0], closesAt: "18:00" }], "2026-10-22", "2026-10-22")[0]).toEqual({ gte: new Date(2026, 9, 22, 18), lt: new Date(2026, 9, 23, 18) });
		expect(getBusinessShiftDateRanges(hours, "2026-10-22")).toEqual([{ gte: new Date(2026, 9, 22, 18) }]);
		expect(getBusinessShiftDateRanges(hours, undefined, "2026-10-22")).toEqual([{ lt: new Date(2026, 9, 23, 3) }]);
		expect(getBusinessShiftDateRanges(hours)).toEqual([]);
	});
});
