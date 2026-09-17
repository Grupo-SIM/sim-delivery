import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import type { OrderStatusEmailTemplate, OrderStatusWhatsAppTemplate } from "@/modules/branding/dtos";
import { orderEvents } from "@/shared/infra/OrderEvents";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppSender } from "@/shared/infra/whatsapp";
import {
	dispatchOrderStatusWhatsApp,
	sendOrderStatusEmail,
} from "../notifications/sendOrderStatusNotification";

const CANCELLATION_REASON = "Pagamento não confirmado em até 1 hora.";
const EXPIRATION_MS = 60 * 60 * 1_000;
const INTERVAL_MS = 60_000;

export class CancelExpiredUnpaidOrders {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly whatsApp: WhatsAppSender,
	) {}

	async execute(now = new Date()): Promise<number> {
		const expiresAt = new Date(now.getTime() - EXPIRATION_MS);
		const orders = await this.prisma.order.findMany({
			include: {
				company: { select: { orderStatusEmailTemplates: true, orderStatusWhatsAppTemplates: true } },
				customer: {
					select: {
						notificationEmail: true,
						notificationWhatsApp: true,
						phone: true,
						user: { select: { email: true, phoneNumber: true } },
					},
				},
				unit: { select: { whatsAppConnection: { select: { sessionName: true } } } },
			},
			where: { createdAt: { lt: expiresAt }, status: "awaiting_payment" },
		});

		let cancelled = 0;
		for (const order of orders) {
			try {
				const templates = order.company.orderStatusWhatsAppTemplates as Record<
					string,
					string | OrderStatusWhatsAppTemplate
				> | null;
				const emailTemplates = order.company.orderStatusEmailTemplates as Record<string, OrderStatusEmailTemplate> | null;
				const result = await this.prisma.$transaction(async tx => {
					const changed = await tx.order.updateMany({
						data: { cancelReason: CANCELLATION_REASON, status: "cancelado" },
						where: {
							createdAt: { lt: expiresAt },
							id: order.id,
							OR: [{ payment: { is: null } }, { payment: { is: { status: { not: "confirmed" } } } }],
							status: "awaiting_payment",
						},
					});
					if (changed.count > 0) {
						await InventoryLifecycle.release(tx, order.id);
						const statusEvent = await tx.orderStatusEvent?.create({
							data: { orderId: order.id, status: "cancelado" },
						});
						await dispatchOrderStatusWhatsApp({
							cancelReason: CANCELLATION_REASON,
							companyId: order.companyId,
							customer: order.customer,
							deduplicationKey: statusEvent?.id
								? `order-status:${statusEvent.id}`
								: `expired-cancellation:${order.id}`,
							deliveryMethod: order.deliveryMethod,
							orderId: order.id,
							orderNumber: order.displayNumber,
							prisma: tx,
							status: "cancelado",
							templates,
							unitId: order.unitId,
							unitWhatsAppSession: order.unit?.whatsAppConnection?.sessionName,
							whatsApp: this.whatsApp,
						});
					}
					return changed;
				});
				if (result.count === 0) continue;

				cancelled += 1;
				orderEvents.publish(order.companyId, order.unitId);

				await sendOrderStatusEmail({
					customer: order.customer,
					cancelReason: CANCELLATION_REASON,
					deliveryMethod: order.deliveryMethod,
					emailTemplates,
					orderId: order.id,
					orderNumber: order.displayNumber,
					status: "cancelado",
					templates,
				});
			} catch (error) {
				console.error(`Failed to cancel expired unpaid order ${order.id}`, error);
			}
		}

		return cancelled;
	}
}

export function startExpiredUnpaidOrderCancellation(
	prisma: PrismaInstance,
	whatsApp: WhatsAppSender,
): () => void {
	const cancellation = new CancelExpiredUnpaidOrders(prisma, whatsApp);
	const run = () =>
		void cancellation
			.execute()
			.catch(error => console.error("Failed to cancel expired unpaid orders", error));

	run();
	const timer = setInterval(run, INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
