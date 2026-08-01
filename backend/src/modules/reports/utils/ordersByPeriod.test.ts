import { describe, expect, it } from "bun:test";
import { getOrdersByPeriod } from "./ordersByPeriod";
import { getDefaultReportGroupBy, getReportPeriodStart } from "./reportPeriod";

const now = new Date(2026, 6, 20, 12);

describe("getReportPeriodStart", () => {
	it("starts the annual period on January 1", () => {
		expect(getReportPeriodStart("year", now)).toEqual(new Date(2026, 0, 1));
	});
});

describe("getDefaultReportGroupBy", () => {
	it.each([
		[new Date(2026, 6, 19), "hourOfDay"],
		[new Date(2026, 6, 18), "dayOfWeek"],
		[new Date(2026, 6, 6), "dayOfMonth"],
		[new Date(2026, 4, 20), "month"],
		[new Date(2026, 0, 20), "quarter"],
		[new Date(2024, 6, 20), "year"],
	] as const)("selects the expected group for %s", (since, expected) => {
		expect(getDefaultReportGroupBy(since, now)).toBe(expected);
	});
});

describe("getOrdersByPeriod", () => {
	const orders = [
		{ createdAt: new Date(2026, 0, 5, 3) },
		{ createdAt: new Date(2026, 3, 6, 3) },
		{ createdAt: new Date(2026, 6, 6, 22) },
	];

	it("groups hours without zero-padding", () => {
		const result = getOrdersByPeriod(orders, "hourOfDay", new Date(2026, 0, 1), now);
		expect(result).toHaveLength(24);
		expect(result[3]).toEqual({ key: "3", label: "3", orderCount: 2 });
		expect(result[4]).toEqual({ key: "4", label: "4", orderCount: 0 });
	});

	it("orders weekdays from Monday to Sunday", () => {
		const result = getOrdersByPeriod(orders, "dayOfWeek", new Date(2026, 0, 1), now);
		expect(result.map(item => item.label)).toEqual(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]);
		expect(result[0].orderCount).toBe(3);
	});

	it("creates all days of month", () => {
		const result = getOrdersByPeriod(orders, "dayOfMonth", new Date(2026, 0, 1), now);
		expect(result).toHaveLength(31);
		expect(result[4].orderCount).toBe(1);
		expect(result[5].orderCount).toBe(2);
	});

	it("creates all months and quarters", () => {
		const months = getOrdersByPeriod(orders, "month", new Date(2026, 0, 1), now);
		expect(months.map(item => item.label)).toEqual([
			"Jan",
			"Fev",
			"Mar",
			"Abr",
			"Mai",
			"Jun",
			"Jul",
			"Ago",
			"Set",
			"Out",
			"Nov",
			"Dez",
		]);
		expect(months[0].orderCount).toBe(1);
		expect(months[3].orderCount).toBe(1);

		const quarters = getOrdersByPeriod(orders, "quarter", new Date(2026, 0, 1), now);
		expect(quarters).toEqual([
			{ key: "0", label: "T1", orderCount: 1 },
			{ key: "1", label: "T2", orderCount: 1 },
			{ key: "2", label: "T3", orderCount: 1 },
			{ key: "3", label: "T4", orderCount: 0 },
		]);
	});

	it("limits monthly buckets to the requested quarter or semester", () => {
		const quarter = getOrdersByPeriod(orders, "month", new Date(2026, 3, 1), now, new Date(2026, 6, 1));
		expect(quarter.map(item => item.label)).toEqual(["Abr", "Mai", "Jun"]);

		const semester = getOrdersByPeriod(orders, "month", new Date(2026, 6, 1), now, new Date(2027, 0, 1));
		expect(semester.map(item => item.label)).toEqual(["Jul", "Ago", "Set", "Out", "Nov", "Dez"]);
	});

	it("creates chronological annual buckets", () => {
		const result = getOrdersByPeriod(orders, "year", new Date(2024, 0, 1), now);
		expect(result.map(item => item.label)).toEqual(["2024", "2025", "2026"]);
		expect(result[2].orderCount).toBe(3);
	});
});
