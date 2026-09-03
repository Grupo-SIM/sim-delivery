import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CloseOrdersDay } from "./CloseOrdersDay";

describe("CloseOrdersDay", () => {
	it("cancels pending orders, records their status event, and preserves terminal orders", async () => {
		const updateManyCalls: unknown[] = [];
		const statusEvents: unknown[] = [];
		const prisma = {
			$transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
			inventoryReservation: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
			order: {
				findMany: async () => [{ id: "ord_pending" }],
				updateMany: async (input: unknown) => {
					updateManyCalls.push(input);
					return { count: 1 };
				},
			},
			orderItem: { findMany: async () => [] },
			orderStatusEvent: { create: async (input: unknown) => statusEvents.push(input) },
			unitProduct: { updateMany: async () => ({ count: 0 }) },
		} as unknown as PrismaInstance;

		const cancelled = await new CloseOrdersDay(prisma).closePendingOrders("cmp_1", { unitId: "unit_1" });

		expect(cancelled).toBe(1);
		expect(updateManyCalls).toEqual([
			expect.objectContaining({
				data: { cancelReason: "Pedido não finalizado até o encerramento do expediente.", status: "cancelado" },
				where: expect.objectContaining({ id: "ord_pending", status: { in: expect.any(Array) } }),
			}),
		]);
		expect(statusEvents).toEqual([{ data: { orderId: "ord_pending", status: "cancelado" } }]);
	});
});
