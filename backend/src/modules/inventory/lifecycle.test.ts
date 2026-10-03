import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { InventoryLifecycle } from "./lifecycle";

type Transaction = Parameters<Parameters<PrismaInstance["$transaction"]>[0]>[0];

function makeTransaction(stock: number | null) {
	const updateMany = mock(async () => ({ count: stock !== null && stock >= 2 ? 1 : 0 }));
	const findMany = mock(async () => stock === null ? [] : [{ id: "product-1" }]);
	const tx = {
		inventoryReservation: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
		orderItem: { findMany: async () => [{ quantity: 2, unitProductId: "product-1" }] },
		unitProduct: { findMany, updateMany },
	} as unknown as Transaction;
	return { findMany, tx, updateMany };
}

describe("InventoryLifecycle.restore", () => {
	it("reopens orders without stock control without decrementing stock", async () => {
		const { findMany, tx, updateMany } = makeTransaction(null);
		expect(await InventoryLifecycle.restore(tx, "order-1", "unit-1")).toEqual(new Map());
		expect(findMany).toHaveBeenCalledWith({
			select: { id: true },
			where: { id: { in: ["product-1"] }, stock: { not: null }, unitId: "unit-1" },
		});
		expect(updateMany).not.toHaveBeenCalled();
	});
	it("decrements controlled stock when reopening", async () => {
		const { tx, updateMany } = makeTransaction(2);
		await InventoryLifecycle.restore(tx, "order-1", "unit-1");
		expect(updateMany).toHaveBeenCalledWith({
			data: { stock: { decrement: 2 } },
			where: { id: "product-1", stock: { gte: 2 }, unitId: "unit-1" },
		});
	});
	it("rejects reopening when controlled stock is insufficient", async () => {
		const { tx } = makeTransaction(0);
		await expect(InventoryLifecycle.restore(tx, "order-1", "unit-1")).rejects.toThrow("INSUFFICIENT_STOCK");
	});
});
