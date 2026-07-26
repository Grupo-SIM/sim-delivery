import { describe, expect, it } from "bun:test";
import { buildReportSheets, type ExportableOrder, type ReportSheetsInput } from "./reportSheets";

const now = new Date(2026, 6, 20, 12);
const since = new Date(2026, 6, 1);
const until = new Date(2026, 7, 1);

function order(overrides: Partial<ExportableOrder> = {}): ExportableOrder {
	return {
		coupon: null,
		createdAt: new Date(2026, 6, 10, 14),
		customer: { phone: "5511999999999", user: { name: "Ana" } },
		deliveryFee: 500,
		deliveryMethod: "delivery",
		discountCents: 0,
		id: "ord_1",
		items: [{ optionSnapshots: [], productName: "Pizza", quantity: 1 }],
		status: "entregue",
		subtotal: 4000,
		total: 4500,
		unit: { name: "Centro" },
		...overrides,
	};
}

function input(overrides: Partial<ReportSheetsInput> = {}): ReportSheetsInput {
	return {
		analytics: { deliveryRadiusPerformance: [] },
		bestSellers: [],
		now,
		orders: [],
		since,
		summary: { averageOrderValue: 4500, orderCount: 1, totalRevenue: 4500 },
		until,
		...overrides,
	};
}

function sheetByName(sheets: ReturnType<typeof buildReportSheets>, name: string) {
	const sheet = sheets.find(candidate => candidate.sheet === name);
	if (!sheet) throw new Error(`Sheet "${name}" not found`);
	return sheet.data;
}

describe("buildReportSheets", () => {
	it("creates one sheet per dataset, including all six period groupings", () => {
		expect(buildReportSheets(input()).map(sheet => sheet.sheet)).toEqual([
			"Resumo",
			"Mais vendidos",
			"Por hora do dia",
			"Por dia da semana",
			"Por dia do mês",
			"Por mês",
			"Por trimestre",
			"Por ano",
			"Raio de entrega",
			"Pedidos",
		]);
	});

	it("lists cancelled orders in the orders sheet", () => {
		const orders = [order(), order({ id: "ord_2", status: "cancelado" })];
		const rows = sheetByName(buildReportSheets(input({ orders })), "Pedidos");

		// One header row plus both orders.
		expect(rows).toHaveLength(3);
		expect(rows.slice(1).map(row => row[1])).toEqual(["ord_1", "ord_2"]);
	});

	it("excludes cancelled orders from the period sheets, matching the dashboard chart", () => {
		const orders = [order(), order({ id: "ord_2", status: "cancelado" })];
		const rows = sheetByName(buildReportSheets(input({ orders })), "Por hora do dia");
		const totalOrders = rows.slice(1).reduce((sum, row) => sum + Number(row[1]), 0);

		expect(totalOrders).toBe(1);
	});

	it("keeps every best seller instead of the dashboard's top 10", () => {
		const bestSellers = Array.from({ length: 14 }, (_, index) => ({
			productName: `Produto ${index}`,
			totalQuantity: 14 - index,
			totalRevenue: 1000,
		}));
		const rows = sheetByName(buildReportSheets(input({ bestSellers })), "Mais vendidos");

		expect(rows).toHaveLength(15);
	});

	it("writes money as a summable number in reais, not cents or text", () => {
		const rows = sheetByName(buildReportSheets(input({ orders: [order()] })), "Pedidos");

		expect(rows[1]?.at(-1)).toMatchObject({ type: Number, value: 45 });
	});

	it("shows the last included day rather than the exclusive end of the range", () => {
		const rows = sheetByName(buildReportSheets(input()), "Resumo");

		expect(rows[2]?.[1]).toMatchObject({ value: new Date(2026, 6, 31) });
	});

	it("summarizes each order's items with their options", () => {
		const orders = [
			order({
				items: [
					{ optionSnapshots: [{ optionName: "Borda recheada" }], productName: "Pizza", quantity: 2 },
					{ optionSnapshots: [], productName: "Refrigerante", quantity: 1 },
				],
			}),
		];
		const rows = sheetByName(buildReportSheets(input({ orders })), "Pedidos");

		expect(rows[1]?.[8]).toBe("2x Pizza (Borda recheada) | 1x Refrigerante");
	});
});
