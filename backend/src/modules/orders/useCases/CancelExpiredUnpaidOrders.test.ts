import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CancelExpiredUnpaidOrders } from "./CancelExpiredUnpaidOrders";

describe("CancelExpiredUnpaidOrders", () => {
	it("cancels expired unpaid orders and notifies their customers", async () => {
		const updateManyCalls: unknown[] = [];
		const statusEvents: unknown[] = [];
		const notifications: unknown[] = [];
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
				updateMany: async (args: unknown) => {
					updateManyCalls.push(args);
					return { count: 1 };
				},
			},
			orderItem: { findMany: async () => [] },
			orderStatusEvent: { create: async (args: unknown) => statusEvents.push(args) },
		} as unknown as PrismaInstance;
		const whatsApp = {
			sendText: async (...args: unknown[]): Promise<void> => {
				notifications.push(args);
			},
		};

		const cancelled = await new CancelExpiredUnpaidOrders(prisma, whatsApp).execute(
			new Date("2026-07-23T12:00:00.000Z"),
		);

		expect(cancelled).toBe(1);
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
		expect(notifications).toEqual([
			[
				"5511999999999",
				"Seu pedido #154 foi cancelado porque o pagamento não foi confirmado em até 1 hora.",
			],
		]);
	});

	it("does not notify when payment confirmation wins the update race", async () => {
		const notifications: unknown[] = [];
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
		const whatsApp = {
			sendText: async (...args: unknown[]): Promise<void> => {
				notifications.push(args);
			},
		};

		expect(await new CancelExpiredUnpaidOrders(prisma, whatsApp).execute()).toBe(0);
		expect(notifications).toEqual([]);
	});
});
