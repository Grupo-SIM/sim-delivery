import { describe, expect, it } from "bun:test";
import { getCurrentBusinessShiftStart } from "./getCurrentBusinessShiftStart";

const hours = (weekday: number, opensAt: string, closesAt: string) => ({
	closed: false,
	closesAt,
	opensAt,
	weekday,
});

describe("getCurrentBusinessShiftStart", () => {
	it("starts the current shift at today's opening time", () => {
		const now = new Date(2026, 7, 28, 14, 30);
		expect(getCurrentBusinessShiftStart([hours(5, "09:00", "18:00")], now)).toEqual(
			new Date(2026, 7, 28, 9),
		);
	});

	it("keeps an overnight shift attached to the day it opened", () => {
		const now = new Date(2026, 7, 29, 1, 30);
		expect(getCurrentBusinessShiftStart([hours(5, "18:00", "03:00")], now)).toEqual(
			new Date(2026, 7, 28, 18),
		);
	});

	it("uses the latest configured shift before the next opening", () => {
		const now = new Date(2026, 7, 29, 8, 30);
		expect(getCurrentBusinessShiftStart([hours(5, "09:00", "18:00")], now)).toEqual(
			new Date(2026, 7, 28, 9),
		);
	});
});
