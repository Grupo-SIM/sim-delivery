import { InventoryLifecycle } from "@/modules/inventory/lifecycle";
import type { RefundPayment } from "@/modules/payments/useCases";
import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import type { Role } from "@/shared/permissions";
import type { OrderReturn, UpdateOrderStatusBody } from "../dtos";
import { OrderErrors } from "../errors";
import { type OrderStatusEmailSender, sendOrderStatusNotification } from "../notifications/sendOrderStatusNotification";

const NOTIFIABLE = new Set(["recebido", "em_preparo", "pronto", "saiu_para_entrega", "entregue", "retirado"]);
const ESTIMABLE_STATUSES = new Set(["em_preparo"]);
const STATUS_SEQUENCE = [
	"recebido",
	"em_preparo",
	"pronto",
	"saiu_para_entrega",
	"problema",
	"entregue",
	"retirado",
	"cancelado",
];

function shouldNotify(current: string, next: string): boolean {
	return NOTIFIABLE.has(next) && STATUS_SEQUENCE.indexOf(next) > STATUS_SEQUENCE.indexOf(current);
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
		private readonly emailSender?: OrderStatusEmailSender,
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
		if (preparedById !== undefined && role === "courier") {
			throw new DomainError(UserErrors.FORBIDDEN);
		}

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

		const notifiesStatusChange = shouldNotify(order.status, status);
		const notifiesEstimateUpdate =
			order.status === "em_preparo" && status === "em_preparo" && estimatedMinutes !== undefined;
		if (notifiesStatusChange || notifiesEstimateUpdate) {
			const reviewUrl = status === "entregue" || status === "retirado" ? getReviewUrl(order.unit.slug, orderId) : undefined;
			await sendOrderStatusNotification({
				customer: order.customer,
				deliveryMethod: order.deliveryMethod,
				emailSender: this.emailSender,
				orderId,
				orderNumber: order.displayNumber,
				reviewUrl,
				status,
				templates: order.company.orderStatusWhatsAppTemplates as Record<string, string> | null,
				whatsApp: this.whatsApp,
			});
		}

		return { ...updated, items: updated.items.map(item => ({ ...item, options: item.optionSnapshots })) };
	}
}
