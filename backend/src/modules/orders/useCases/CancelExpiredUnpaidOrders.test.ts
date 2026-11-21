import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CancelExpiredUnpaidOrders } from "./CancelExpiredUnpaidOrders";

describe("CancelExpiredUnpaidOrders", () => {
	it("cancels expired unpaid orders without notifying their customers", async () => {
		process.env.COMPANY_SLUG = "zero-grau";
		const findManyCalls: unknown[] = [];
		const updateManyCalls: unknown[] = [];
		const statusEvents: unknown[] = [];
		const prisma = {
			$transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
			inventoryReservation: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
			order: {
				findMany: async (args: unknown) => {
					findManyCalls.push(args);
					return [
					{
						company: {
							orderStatusWhatsAppTemplates: null,
							whatsAppConnection: { connectedPhone: "+5511999999999", sessionName: "company-session" },
						},
					customer: { phone: "5511999999999" },
					displayNumber: 154,
					id: "ord_1",
					},
					];
				},
				updateMany: async (args: unknown) => {
					updateManyCalls.push(args);
					return { count: 1 };
				},
			},
			orderItem: { findMany: async () => [] },
			orderStatusEvent: { create: async (args: unknown) => statusEvents.push(args) },
		} as unknown as PrismaInstance;

		const cancelled = await new CancelExpiredUnpaidOrders(prisma).execute(
			new Date("2026-07-23T12:00:00.000Z"),
		);

		expect(cancelled).toBe(1);
		expect(findManyCalls).toEqual([
			expect.objectContaining({ where: expect.objectContaining({ company: { slug: "zero-grau" } }) }),
		]);
		expect(updateManyCalls).toEqual([
			expect.objectContaining({
				data: { cancelReason: "Pagamento não confirmado em até 1 hora.", status: "cancelado" },
				where: expect.objectContaining({
					id: "ord_1",
					status: "awaiting_payment",
				}),
			}),
		]);
		expect(statusEvents).toEqual([{ data: { orderId: "ord_1", status: "cancelado" } }]);
	});

	it("does not cancel when payment confirmation wins the update race", async () => {
		const prisma = {
			$transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
			inventoryReservation: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
			order: {
				findMany: async () => [
					{
						company: { orderStatusWhatsAppTemplates: null },
					customer: { phone: "5511999999999" },
					displayNumber: 154,
						id: "ord_1",
					},
				],
				updateMany: async () => ({ count: 0 }),
			},
			orderItem: { findMany: async () => [] },
			orderStatusEvent: { create: async () => undefined },
		} as unknown as PrismaInstance;

		expect(await new CancelExpiredUnpaidOrders(prisma).execute()).toBe(0);
	});
});
