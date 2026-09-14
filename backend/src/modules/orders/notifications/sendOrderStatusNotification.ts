import { OrderStatusEmail } from "@/shared/infra/emails";
import type { PrismaInstance } from "@/shared/infra/sql";
import { dispatchWhatsApp } from "@/shared/infra/whatsapp";
import type { WhatsAppProvider } from "@/shared/infra/whatsapp";
import { formatOrderStatusMessage } from "../order-status-message";

export interface OrderStatusEmailSender {
	send(input: { message: string; orderNumber: number; reviewUrl?: string; status: string; to: string }): Promise<void>;
}

export interface OrderStatusNotificationCustomer {
	notificationEmail?: boolean;
	notificationWhatsApp?: boolean;
	phone?: string | null;
	user?: { email?: string | null; phoneNumber?: string | null } | null;
}

interface SendOrderStatusNotificationInput {
	customer: OrderStatusNotificationCustomer;
	deliveryMethod: string;
	emailSender?: OrderStatusEmailSender;
	message?: string;
	orderId: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
	templates?: Record<string, string> | null;
	whatsApp: WhatsAppProvider;
}

type SendOrderStatusEmailInput = Omit<SendOrderStatusNotificationInput, "whatsApp">;

interface DispatchOrderStatusWhatsAppInput extends SendOrderStatusNotificationInput {
	deduplicationKey: string;
	prisma: Pick<PrismaInstance, "whatsAppNotification">;
}

const defaultEmailSender: OrderStatusEmailSender = {
	send: input => new OrderStatusEmail(input).send(),
};

export function getOrderStatusNotificationMessage({
	deliveryMethod,
	message: messageOverride,
	orderNumber,
	status,
	templates,
}: Pick<
	SendOrderStatusNotificationInput,
	"deliveryMethod" | "message" | "orderNumber" | "status" | "templates"
>): string {
	return (
		messageOverride ??
		formatOrderStatusMessage(templates?.[status]?.trim() || undefined, status, orderNumber, deliveryMethod)
	);
}

export async function dispatchOrderStatusWhatsApp({
	customer,
	deduplicationKey,
	deliveryMethod,
	message: messageOverride,
	orderId,
	orderNumber,
	prisma,
	status,
	templates,
	whatsApp,
}: DispatchOrderStatusWhatsAppInput): Promise<void> {
	const phone = customer.phone ?? customer.user?.phoneNumber;
	if (customer.notificationWhatsApp === false || !phone) return;
	const message = getOrderStatusNotificationMessage({
		deliveryMethod,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	await dispatchWhatsApp({ deduplicationKey, message, orderId, orderStatus: status, phone, prisma, provider: whatsApp });
}

export async function sendOrderStatusEmail({
	customer,
	deliveryMethod,
	emailSender = defaultEmailSender,
	message: messageOverride,
	orderNumber,
	reviewUrl,
	status,
	templates,
}: SendOrderStatusEmailInput): Promise<void> {
	if (customer.notificationEmail === false || !customer.user?.email) return;
	const message = getOrderStatusNotificationMessage({
		deliveryMethod,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	try {
		await emailSender.send({
			message,
			orderNumber,
			...(reviewUrl ? { reviewUrl } : {}),
			status,
			to: customer.user.email,
		});
	} catch (error) {
		console.error("Failed to send order status email", error);
	}
}

/** Sends one order update through every notification channel enabled by the customer. */
export async function sendOrderStatusNotification({
	customer,
	deliveryMethod,
	emailSender = defaultEmailSender,
	message: messageOverride,
	orderId,
	orderNumber,
	reviewUrl,
	status,
	templates,
	whatsApp,
}: SendOrderStatusNotificationInput): Promise<void> {
	const message = getOrderStatusNotificationMessage({
		deliveryMethod,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	const phone = customer.phone ?? customer.user?.phoneNumber;
	const deliveries: Promise<void>[] = [];

	if (customer.notificationWhatsApp !== false && phone) {
		deliveries.push(whatsApp.sendText(phone, message));
	}
	if (customer.notificationEmail !== false && customer.user?.email) {
		deliveries.push(
			emailSender.send({
				message,
				orderNumber,
				...(reviewUrl ? { reviewUrl } : {}),
				status,
				to: customer.user.email,
			}),
		);
	}

	await Promise.allSettled(deliveries);
}
