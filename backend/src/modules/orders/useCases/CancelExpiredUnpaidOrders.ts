import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import { OrderStatusEmail } from "@/shared/infra/emails";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";

const CANCELLATION_REASON = "Pagamento não confirmado em até 1 hora.";
const EXPIRATION_MS = 60 * 60 * 1_000;
const INTERVAL_MS = 60_000;

export class CancelExpiredUnpaidOrders {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly whatsApp: WhatsAppProvider,
	) {}

	async execute(now = new Date()): Promise<number> {
		const expiresAt = new Date(now.getTime() - EXPIRATION_MS);
		const orders = await this.prisma.order.findMany({
			include: {
				company: { select: { orderStatusWhatsAppTemplates: true } },
				customer: {
					select: {
						notificationEmail: true,
						notificationWhatsApp: true,
						phone: true,
						user: { select: { email: true, phoneNumber: true } },
					},
				},
			},
			where: { createdAt: { lt: expiresAt }, status: "awaiting_payment" },
		});

		let cancelled = 0;
		for (const order of orders) {
			try {
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
						await tx.orderStatusEvent?.create({ data: { orderId: order.id, status: "cancelado" } });
					}
					return changed;
				});
				if (result.count === 0) continue;

				cancelled += 1;

				const templates = order.company.orderStatusWhatsAppTemplates as Record<string, string> | null;
				const message = (
					templates?.cancelado?.trim() ||
					"Seu pedido {{orderId}} foi cancelado porque o pagamento não foi confirmado em até 1 hora."
				).replaceAll("{{orderId}}", `#${order.displayNumber}`);
				const phone = order.customer.phone ?? order.customer.user?.phoneNumber;
				if (order.customer.notificationWhatsApp !== false && phone) {
					await this.whatsApp.sendOrderStatus(phone, "cancelado", order.id, message).catch(() => {});
				}
				if (order.customer.notificationEmail !== false && order.customer.user?.email) {
					await new OrderStatusEmail({
						message,
						orderNumber: order.displayNumber,
						to: order.customer.user.email,
					})
						.send()
						.catch(() => {});
				}
			} catch (error) {
				console.error(`Failed to cancel expired unpaid order ${order.id}`, error);
			}
		}

		return cancelled;
	}
}

export function startExpiredUnpaidOrderCancellation(
	prisma: PrismaInstance,
	whatsApp: WhatsAppProvider,
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
