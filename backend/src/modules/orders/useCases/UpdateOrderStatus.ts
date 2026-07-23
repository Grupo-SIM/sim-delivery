import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import { sendOrderStatusEmail } from "@/shared/infra/mail";
import { UserErrors } from "@/modules/users/errors";
import type { Role } from "@/shared/permissions";
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
	if (next === "problema") return current !== "cancelado";
	if (current === "problema") return next !== "awaiting_payment";
	if (next === "cancelado") return true;
	if (current === "cancelado") return REOPENABLE_FROM_CANCELLED.has(next);

	const flow = deliveryMethod === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
	const currentIndex = flow.indexOf(current);
	const nextIndex = flow.indexOf(next);
	return currentIndex >= 0 && nextIndex >= 0 && Math.abs(nextIndex - currentIndex) === 1;
}

function canRoleTransition(role: Role | undefined, current: string, next: string): boolean {
	if (role === "kitchen") {
		return (current === "recebido" && next === "em_preparo") || (current === "em_preparo" && next === "pronto");
	}
	if (role === "courier") {
		return (current === "pronto" && next === "saiu_para_entrega") || (current === "saiu_para_entrega" && next === "entregue");
	}
	return true;
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
		role?: Role,
	): Promise<OrderReturn> {
		const { status, cancelReason, preparedById, problemReason } = data;

		const order = await this.prisma.order.findFirst({
			include: {
				company: { select: { orderStatusWhatsAppTemplates: true } },
				customer: { include: { user: { select: { email: true, phoneNumber: true } } } },
			},
			where: { ...(companyId ? { companyId } : {}), id: orderId },
		});
		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);
		if (!canRoleTransition(role, order.status, status)) throw new DomainError(UserErrors.FORBIDDEN);
		if (preparedById !== undefined && (role === "kitchen" || role === "courier")) {
			throw new DomainError(UserErrors.FORBIDDEN);
		}

		if (!canTransition(order.status, status, order.deliveryMethod))
			throw new DomainError(OrderErrors.INVALID_TRANSITION);
		if (status === "cancelado" && !cancelReason) throw new DomainError(OrderErrors.CANCEL_REASON_REQUIRED);
		if (status === "problema" && !problemReason) throw new DomainError(OrderErrors.INVALID_TRANSITION);

		if (preparedById) {
			const kitchenMember = await this.prisma.user.findFirst({
				where: { companyId: order.companyId, id: preparedById, role: "kitchen" },
			});
			if (!kitchenMember) throw new DomainError(UserErrors.FORBIDDEN);
		}

		const updated = await this.prisma.order.update({
			data: {
				cancelReason: status === "cancelado" ? cancelReason : null,
				problemReason: status === "problema" ? problemReason : order.problemReason,
				...(preparedById !== undefined ? { preparedById } : {}),
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

		if (shouldNotify(order.status, status, order.deliveryMethod)) {
			const templates = order.company.orderStatusWhatsAppTemplates as Record<string, string> | null;
			const message = formatOrderStatusMessage(templates?.[status]?.trim() || undefined, status, orderId);
			const phone = order.customer.phone ?? order.customer.user.phoneNumber;
			if (order.customer.notificationWhatsApp !== false && phone) {
				await this.whatsApp.sendOrderStatus(phone, status, orderId, message).catch(() => {});
			}
			if (order.customer.notificationEmail !== false && order.customer.user.email) {
				await sendOrderStatusEmail(order.customer.user.email, status, orderId, message).catch(() => {});
			}
		}

		return { ...updated, items: updated.items.map(item => ({ ...item, options: item.optionSnapshots })) };
	}
}
