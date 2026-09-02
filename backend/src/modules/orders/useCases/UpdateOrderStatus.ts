import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import type { RefundPayment } from "@/modules/payments/useCases";
import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import { OrderStatusEmail } from "@/shared/infra/emails";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import type { Role } from "@/shared/permissions";
import type { OrderReturn, UpdateOrderStatusBody } from "../dtos";
import { OrderErrors } from "../errors";
import { formatOrderStatusMessage } from "../order-status-message";

const DELIVERY_FLOW = ["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue"];
const PICKUP_FLOW = ["recebido", "em_preparo", "pronto", "retirado"];
const REOPENABLE_FROM_CANCELLED = new Set(["recebido", "em_preparo", "pronto"]);

const NOTIFIABLE = new Set(["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue", "retirado"]);
const ESTIMABLE_STATUSES = new Set(["em_preparo", "saiu_para_entrega"]);

interface OrderStatusEmailSender {
	send(input: { message: string; orderNumber: number; reviewUrl?: string; to: string }): Promise<void>;
}

const orderStatusEmailSender: OrderStatusEmailSender = {
	send: input => new OrderStatusEmail(input).send(),
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
	if (current === next) return true;
	if (role === "kitchen") {
		return (
			(current === "recebido" && next === "em_preparo") ||
			(current === "em_preparo" && next === "pronto") ||
			(current === "pronto" && next === "em_preparo")
		);
	}
	if (role === "courier") {
		return (
			(current === "pronto" && next === "saiu_para_entrega") ||
			(current === "saiu_para_entrega" && next === "entregue")
		);
	}
	return true;
}

function shouldNotify(current: string, next: string, deliveryMethod: string): boolean {
	const flow = deliveryMethod === "pickup" ? PICKUP_FLOW : DELIVERY_FLOW;
	return NOTIFIABLE.has(next) && flow.indexOf(next) > flow.indexOf(current);
}

function getReviewUrl(unitSlug: string, orderId: string): string {
	const url = new URL(`/${unitSlug}/rate`, process.env.APP_URL);
	url.searchParams.set("orderId", orderId);
	return url.toString();
}

export class UpdateOrderStatus {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly whatsApp: WhatsAppProvider,
		private readonly refundPayment?: RefundPayment,
		private readonly emailSender: OrderStatusEmailSender = orderStatusEmailSender,
	) {}

	async execute(
		companyId: string | null,
		orderId: string,
		data: UpdateOrderStatusBody,
		role?: Role,
		userId?: string,
	): Promise<OrderReturn> {
		const { status, cancelReason, estimatedMinutes, preparedById, problemReason, refund } = data;

		const order = await this.prisma.order.findFirst({
			include: {
				company: { select: { orderStatusWhatsAppTemplates: true } },
				customer: { include: { user: { select: { email: true, phoneNumber: true } } } },
				payment: { select: { status: true } },
				unit: { select: { slug: true } },
			},
			where: { ...(companyId ? { companyId } : {}), id: orderId },
		});
		if (!order) throw new DomainError(OrderErrors.ORDER_NOT_FOUND);
		if (!canRoleTransition(role, order.status, status)) throw new DomainError(UserErrors.FORBIDDEN);
		if (preparedById !== undefined && role === "courier") {
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

		const updated = await this.prisma.$transaction(async tx => {
			if (order.status !== status && status === "cancelado") {
				const releasedCost = await InventoryLifecycle.release(tx, orderId);
				for (const [orderItemId, costCents] of releasedCost) {
					const item = await tx.orderItem.findUniqueOrThrow({ where: { id: orderItemId } });
					await tx.orderItem.update({
						data: {
							costCents: Math.max(0, (item.costCents ?? 0) - costCents),
							costRecalculatedAt: new Date(),
						},
						where: { id: orderItemId },
					});
				}
			}
			if (order.status === "cancelado" && status !== "cancelado") {
				const restoredCost = await InventoryLifecycle.restore(tx, orderId, order.unitId);
				for (const [orderItemId, costCents] of restoredCost) {
					const item = await tx.orderItem.findUniqueOrThrow({ where: { id: orderItemId } });
					await tx.orderItem.update({
						data: { costCents: (item.costCents ?? 0) + costCents, costRecalculatedAt: new Date() },
						where: { id: orderItemId },
					});
				}
			}
			if (order.status !== status && status === "em_preparo")
				await InventoryLifecycle.consume(tx, orderId, preparedById ?? undefined);
			const result = await tx.order.update({
				data: {
					cancelReason: status === "cancelado" ? cancelReason : null,
					estimatedStatusCompletionAt:
						estimatedMinutes !== undefined && ESTIMABLE_STATUSES.has(status)
							? new Date(Date.now() + estimatedMinutes * 60_000)
							: null,
					problemReason: status === "problema" ? problemReason : order.problemReason,
					...(preparedById !== undefined ? { preparedById } : {}),
					status,
				},
				include: { items: { include: { optionSnapshots: true } } },
				where: { id: orderId },
			});
			if (order.status !== status)
				await tx.orderStatusEvent?.create({
					data: { orderId, status },
				});
			return result;
		});

		if (
			refund &&
			this.refundPayment &&
			order.status !== "cancelado" &&
			status === "cancelado" &&
			order.payment?.status === "confirmed"
		) {
			await this.refundPayment.execute(order.companyId, orderId, refund, userId);
		}

		const notifiesStatusChange = shouldNotify(order.status, status, order.deliveryMethod);
		const notifiesEstimateUpdate =
			order.status === "em_preparo" && status === "em_preparo" && estimatedMinutes !== undefined;
		if (notifiesStatusChange) {
			const templates = order.company.orderStatusWhatsAppTemplates as Record<string, string> | null;
			const message = formatOrderStatusMessage(
				templates?.[status]?.trim() || undefined,
				status,
				order.displayNumber,
				order.deliveryMethod,
			);
			const phone = order.customer.phone ?? order.customer.user.phoneNumber;
			if (order.customer.notificationWhatsApp !== false && phone) {
				await this.whatsApp.sendOrderStatus(phone, status, orderId, message).catch(() => {});
			}
		}
		if ((notifiesStatusChange || notifiesEstimateUpdate) && order.customer.notificationEmail !== false && order.customer.user.email) {
			const templates = order.company.orderStatusWhatsAppTemplates as Record<string, string> | null;
			const message = formatOrderStatusMessage(
				templates?.[status]?.trim() || undefined,
				status,
				order.displayNumber,
				order.deliveryMethod,
			);
			const reviewUrl = status === "entregue" || status === "retirado" ? getReviewUrl(order.unit.slug, orderId) : undefined;
			await this.emailSender
				.send({
					message,
					orderNumber: order.displayNumber,
					reviewUrl,
					to: order.customer.user.email,
				})
				.catch(() => {});
		}

		return { ...updated, items: updated.items.map(item => ({ ...item, options: item.optionSnapshots })) };
	}
}
