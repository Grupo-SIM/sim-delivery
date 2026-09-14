import { describe, expect, it, mock } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import { dispatchOrderStatusWhatsApp } from "./sendOrderStatusNotification";

describe("dispatchOrderStatusWhatsApp", () => {
	it("stores a frozen message in the WAHA outbox", async () => {
		const upsert = mock(() => Promise.resolve());
		await dispatchOrderStatusWhatsApp({
			customer: { notificationWhatsApp: true, phone: "5581999999999" },
			deduplicationKey: "order-status:event_1",
			deliveryMethod: "delivery",
			orderId: "order_1",
			orderNumber: 154,
			prisma: { whatsAppNotification: { upsert } } as unknown as PrismaInstance,
			status: "pronto",
			templates: { pronto: "Pedido {{orderId}} pronto." },
			whatsApp: { deliveryMode: "outbox", sendText: async () => {} } as WhatsAppProvider,
		});

		expect(upsert).toHaveBeenCalledWith({
			create: {
				deduplicationKey: "order-status:event_1",
				message: "Pedido #154 pronto.",
				orderId: "order_1",
				orderStatus: "pronto",
				recipient: "5581999999999",
			},
			update: {},
			where: { deduplicationKey: "order-status:event_1" },
		});
	});

	it("does not enqueue after customer opt-out", async () => {
		const upsert = mock(() => Promise.resolve());
		await dispatchOrderStatusWhatsApp({
			customer: { notificationWhatsApp: false, phone: "5581999999999" },
			deduplicationKey: "order-status:event_1",
			deliveryMethod: "delivery",
			orderId: "order_1",
			orderNumber: 154,
			prisma: { whatsAppNotification: { upsert } } as unknown as PrismaInstance,
			status: "pronto",
			whatsApp: { deliveryMode: "outbox", sendText: async () => {} } as WhatsAppProvider,
		});

		expect(upsert).not.toHaveBeenCalled();
	});
});
