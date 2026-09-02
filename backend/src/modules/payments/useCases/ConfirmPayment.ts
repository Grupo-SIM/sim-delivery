import { DomainError } from "@/shared/errors";
import { orderEvents } from "@/shared/infra/OrderEvents";
import type { PrismaInstance } from "@/shared/infra/sql";
import { createWhatsAppProvider, type WhatsAppProvider } from "@/shared/infra/whatsapp";
import {
	type OrderStatusEmailSender,
	sendOrderStatusNotification,
} from "@/modules/orders/notifications/sendOrderStatusNotification";
import { PaymentErrors } from "../errors";

export class ConfirmPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly emailSender?: OrderStatusEmailSender,
		private readonly whatsApp: WhatsAppProvider = createWhatsAppProvider(),
	) {}

	async execute(token: string, expectedSimpayPaymentId?: string): Promise<boolean> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		const order = await this.prisma.order.findUniqueOrThrow({
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
				unit: true,
			},
			where: { id: payment.orderId },
		});

		const earnedCashbackCents = Math.floor((order.total * order.unit.cashbackPercent) / 100);
		const earnedLoyaltyPoints = Math.floor((order.total * order.unit.loyaltyPointsRate) / 100);

		const confirmed = await this.prisma.$transaction(async tx => {
			// Webhooks can be retried or delivered concurrently. Claiming the pending
			// row inside the transaction ensures rewards and order transition run once.
			const { count } = await tx.payment.updateMany({
				data: { confirmedAt: new Date(), status: "confirmed" },
				where: {
					id: payment.id,
					...(expectedSimpayPaymentId ? { simpayPaymentId: expectedSimpayPaymentId } : {}),
					status: "pending",
				},
			});
			if (count === 0) return false;

			await tx.order.update({
				data: { status: "recebido" },
				where: { id: order.id },
			});

			if (earnedCashbackCents > 0) {
				await tx.cashbackLedger.create({
					data: {
						amount: earnedCashbackCents,
						customerId: order.customerId,
						orderId: order.id,
						type: "accrual",
					},
				});
			}

			if (earnedLoyaltyPoints > 0) {
				await tx.loyaltyLedger.create({
					data: {
						amount: earnedLoyaltyPoints,
						customerId: order.customerId,
						orderId: order.id,
						type: "earn",
					},
				});
			}

			return true;
		});

		if (!confirmed) return false;
		orderEvents.publish(order.companyId, order.unitId);

		await sendOrderStatusNotification({
			customer: order.customer,
			deliveryMethod: order.deliveryMethod,
			emailSender: this.emailSender,
			orderId: order.id,
			orderNumber: order.displayNumber,
			status: "recebido",
			templates: order.company.orderStatusWhatsAppTemplates as Record<string, string> | null,
			whatsApp: this.whatsApp,
		});

		return true;
	}
}
