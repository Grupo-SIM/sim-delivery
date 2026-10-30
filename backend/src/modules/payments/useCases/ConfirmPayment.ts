import { createHash } from "node:crypto";
import { DomainError } from "@/shared/errors";
import type { OrderStatusEmailTemplate, OrderStatusWhatsAppTemplate } from "@/modules/branding/dtos";
import { orderEvents } from "@/shared/infra/OrderEvents";
import type { PrismaInstance } from "@/shared/infra/sql";
import { createWhatsAppProvider, type WhatsAppSender } from "@/shared/infra/whatsapp";
import {
	dispatchOrderStatusWhatsApp,
	type OrderStatusEmailSender,
	sendOrderStatusEmail,
} from "@/modules/orders/notifications/sendOrderStatusNotification";
import { PaymentErrors } from "../errors";

export class ConfirmPayment {
	constructor(
		private readonly prisma: PrismaInstance,
		private readonly emailSender?: OrderStatusEmailSender,
		private readonly whatsApp: WhatsAppSender = createWhatsAppProvider(),
	) {}

	async execute(token: string, expectedSimpayPaymentId?: string): Promise<boolean> {
		const payment = await this.prisma.payment.findUnique({ where: { token } });
		if (!payment) throw new DomainError(PaymentErrors.PAYMENT_NOT_FOUND);

		const order = await this.prisma.order.findUniqueOrThrow({
			include: {
				company: { select: { metaPixelId: true, metaCapiToken: true, orderStatusEmailTemplates: true, orderStatusWhatsAppTemplates: true, whatsAppConnection: { select: { connectedPhone: true, sessionName: true } } } },
				customer: {
					select: {
						notificationEmail: true,
						notificationWhatsApp: true,
						phone: true,
						user: { select: { email: true, name: true, emailVerified: true, phoneNumber: true } },
					},
				},
				items: true,
                unit: { include: { whatsAppConnection: { select: { connectedPhone: true, sessionName: true } } } },
			},
			where: { id: payment.orderId },
		});

		const commercialTotal = Math.max(0, order.total - (order.feeTotalCents ?? 0));
		const earnedCashbackCents = Math.floor((commercialTotal * order.unit.cashbackPercent) / 100);
		const earnedLoyaltyPoints = Math.floor((commercialTotal * order.unit.loyaltyPointsRate) / 100);
		const templates = order.company.orderStatusWhatsAppTemplates as Record<
			string,
			string | OrderStatusWhatsAppTemplate
		> | null;
		const emailTemplates = order.company.orderStatusEmailTemplates as Record<string, OrderStatusEmailTemplate> | null;

		const confirmed = await this.prisma.$transaction(async tx => {
			// Webhooks can be retried or delivered concurrently. Claiming the pending
			// row inside the transaction ensures rewards and order transition run once.
			const confirmedAt = new Date();
            const { count } = await tx.payment.updateMany({
				data: { confirmedAt, status: "confirmed" },
				where: {
					id: payment.id,
					...(expectedSimpayPaymentId ? { simpayPaymentId: expectedSimpayPaymentId } : {}),
					status: "pending",
				},
			});
			if (count === 0) return false;

			const attribution = order.marketingAttribution as { consent?: boolean; consentVersion?: string; consentedAt?: string; deviceId?: string; fbp?: string; fbc?: string; sourceUrl?: string; ip?: string; userAgent?: string } | null;
            if ((payment.method === "pix" || payment.method === "credit_card") && order.total > 0 && attribution?.consent === true && attribution.consentVersion && attribution.consentedAt && order.company.metaPixelId && order.company.metaCapiToken) {
                const hash = (value: string) => createHash("sha256").update(value).digest("hex");
                const phone = (order.customer.phone ?? order.customer.user.phoneNumber ?? "").replace(/\D/g, "");
                const normalizedPhone = phone.length === 10 || phone.length === 11 ? `55${phone}` : phone;
                const email = order.customer.user.email.trim().toLowerCase();
                const names = order.customer.user.name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").trim().split(/\s+/);
                const eventId = `purchase_${order.id}`;
                await tx.marketingEvent.upsert({ where: { orderId_eventName: { orderId: order.id, eventName: "Purchase" } }, update: {}, create: {
                    companyId: order.companyId, orderId: order.id, eventName: "Purchase", eventId,
                    paymentMethod: payment.method === "credit_card" ? "card" : "pix", eventTime: confirmedAt,
                    payload: {
                        event_name: "Purchase", event_id: eventId, event_time: Math.floor(confirmedAt.getTime() / 1000), action_source: "website",
                        event_source_url: attribution.sourceUrl,
                        user_data: {
                            em: order.customer.user.emailVerified && !email.endsWith("@phone.local") ? [hash(email)] : undefined,
                            ph: normalizedPhone ? [hash(normalizedPhone)] : undefined,
                            fn: names[0] ? [hash(names[0])] : undefined,
                            ln: names.length > 1 ? [hash(names.slice(1).join(" "))] : undefined,
                            external_id: [hash(order.customerId), ...(attribution.deviceId ? [hash(attribution.deviceId)] : [])], country: [hash("br")],
                            fbp: attribution.fbp, fbc: attribution.fbc, client_ip_address: attribution.ip, client_user_agent: attribution.userAgent,
                        },
                        custom_data: { currency: "BRL", value: order.total / 100, order_id: order.id, payment_method: payment.method === "credit_card" ? "card" : "pix",
                            content_type: "product", content_ids: order.items.map(item => item.productId), num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
                            contents: order.items.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.unitPrice / 100 })),
                        },
                    },
                } });
            }
            await tx.order.update({
				data: { status: "recebido" },
				where: { id: order.id },
			});
			const statusEvent = await tx.orderStatusEvent?.create({
				data: { orderId: order.id, status: "recebido" },
			});
			await dispatchOrderStatusWhatsApp({
				companyId: order.companyId,
				customer: order.customer,
				deduplicationKey: statusEvent?.id
					? `order-status:${statusEvent.id}`
					: `payment-confirmed:${payment.id}`,
				deliveryMethod: order.deliveryMethod,
				orderId: order.id,
				orderNumber: order.displayNumber,
				prisma: tx,
				status: "recebido",
				templates,
					unitId: order.unitId,
					companyWhatsAppSession: order.company.whatsAppConnection?.connectedPhone
						? order.company.whatsAppConnection.sessionName
						: null,
					unitWhatsAppSession: order.unit.whatsAppConnection?.connectedPhone
						? order.unit.whatsAppConnection.sessionName
						: null,
				whatsApp: this.whatsApp,
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

		await sendOrderStatusEmail({
			customer: order.customer,
			deliveryMethod: order.deliveryMethod,
			emailSender: this.emailSender,
			emailTemplates,
			orderId: order.id,
			orderNumber: order.displayNumber,
			status: "recebido",
			templates,
		});

		return true;
	}
}
