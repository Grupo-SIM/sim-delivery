import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import { orderEvents } from "@/shared/infra/OrderEvents";
import type { PrismaInstance } from "@/shared/infra/sql";

const CANCELLATION_REASON = "Pagamento não confirmado em até 1 hora.";
const EXPIRATION_MS = 60 * 60 * 1_000;
const INTERVAL_MS = 60_000;

export class CancelExpiredUnpaidOrders {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(now = new Date()): Promise<number> {
		const slug = process.env.COMPANY_SLUG?.trim();
		if (!slug) return 0;

		const expiresAt = new Date(now.getTime() - EXPIRATION_MS);
		const orders = await this.prisma.order.findMany({
			where: { company: { slug }, createdAt: { lt: expiresAt }, status: "awaiting_payment" },
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
						await tx.orderStatusEvent?.create({
							data: { orderId: order.id, status: "cancelado" },
						});
					}
					return changed;
				});
				if (result.count === 0) continue;

				cancelled += 1;
				orderEvents.publish(order.companyId, order.unitId);
			} catch (error) {
				console.error(`Failed to cancel expired unpaid order ${order.id}`, error);
			}
		}

		return cancelled;
	}
}

export function startExpiredUnpaidOrderCancellation(prisma: PrismaInstance): () => void {
	const cancellation = new CancelExpiredUnpaidOrders(prisma);
	const run = () =>
		void cancellation
			.execute()
			.catch(error => console.error("Failed to cancel expired unpaid orders", error));

	run();
	const timer = setInterval(run, INTERVAL_MS);
	timer.unref();
	return () => clearInterval(timer);
}
