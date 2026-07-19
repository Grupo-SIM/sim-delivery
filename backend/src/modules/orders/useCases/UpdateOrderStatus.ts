import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import type { OrderReturn, UpdateOrderStatusBody } from "../dtos";
import { OrderErrors } from "../errors";

const DELIVERY_FLOW = ["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue"];
const PICKUP_FLOW = ["recebido", "em_preparo", "pronto", "retirado"];
const REOPENABLE_FROM_CANCELLED = new Set(["recebido", "em_preparo", "pronto"]);

const NOTIFIABLE = new Set(["em_preparo", "saiu_para_entrega", "entregue", "retirado"]);

const DEFAULT_ORDER_STATUS_MESSAGES: Record<string, string> = {
	em_preparo: "Seu pedido {{orderId}} está em preparo.",
	entregue: "Seu pedido {{orderId}} foi entregue. Bom apetite!",
	retirado: "Seu pedido {{orderId}} está pronto para retirada.",
	saiu_para_entrega: "Seu pedido {{orderId}} saiu para entrega.",
};

function canTransition(current: string, next: string, deliveryMethod: string): boolean {
	if (current === next) return true;
	if (next === "cancelado") return true;
	if (current === "cancelado") return REOPENABLE_FROM_CANCELLED.has(next);

	const flow = deliveryMethod === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
	const currentIndex = flow.indexOf(current);
	const nextIndex = flow.indexOf(next);
	return currentIndex >= 0 && nextIndex >= 0 && Math.abs(nextIndex - currentIndex) === 1;
}

function shouldNotify(current: string, next: string, deliveryMethod: string): boolean {
	const flow = deliveryMethod === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
	return NOTIFIABLE.has(next) && flow.indexOf(next) > flow.indexOf(current);
}

function formatOrderStatusMessage(template: string | undefined, status: string, orderId: string): string {
	return (
		template ??
		DEFAULT_ORDER_STATUS_MESSAGES[status] ??
		`Order ${orderId} status updated to "${status}"`
	).replaceAll("{{orderId}}", orderId);
}

export class UpdateOrderStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly whatsApp: WhatsAppProvider,
	) {}

	async execute(
		companyId: string | null,
		orderId: string,
		data: UpdateOrderStatusBody,
	): Promise<OrderReturn> {
		const { status, cancelReason } = data;

		const order = await this.prisma.order.findFirst({
			include: { company: { select: { orderStatusWhatsAppTemplates: true } }, customer: true },
			where: { ...(companyId ? { companyId } : {}), id: orderId },
		});
		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);

		if (!canTransition(order.status, status, order.deliveryMethod))
			throw new DomainError(OrderErrors.INVALID_TRANSITION);
		if (status === "cancelado" && !cancelReason) throw new DomainError(OrderErrors.CANCEL_REASON_REQUIRED);

		const updated = await this.prisma.order.update({
			data: {
				cancelReason: status === "cancelado" ? cancelReason : null,
				status,
			},
			include: { items: { include: { optionSnapshots: true } } },
			where: { id: orderId },
		});

		if (order.status !== status) {
			await this.prisma.orderStatusEvent?.create({
				data: { orderId, status },
			});
		}

		if (shouldNotify(order.status, status, order.deliveryMethod) && order.customer.phone) {
			const templates = order.company.orderStatusWhatsAppTemplates as Record<string, string> | null;
			await this.whatsApp
				.sendOrderStatus(
					order.customer.phone,
					status,
					orderId,
					formatOrderStatusMessage(templates?.[status]?.trim() || undefined, status, orderId),
				)
				.catch(() => {});
		}

		return { ...updated, items: updated.items.map(item => ({ ...item, options: item.optionSnapshots })) };
	}
}
