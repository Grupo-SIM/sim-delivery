import { OrderStatusEmail } from "@/shared/infra/emails";
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

const defaultEmailSender: OrderStatusEmailSender = {
	send: input => new OrderStatusEmail(input).send(),
};

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
	const message =
		messageOverride ??
		formatOrderStatusMessage(templates?.[status]?.trim() || undefined, status, orderNumber, deliveryMethod);
	const phone = customer.phone ?? customer.user?.phoneNumber;
	const deliveries: Promise<void>[] = [];

	if (customer.notificationWhatsApp !== false && phone) {
		deliveries.push(whatsApp.sendOrderStatus(phone, status, orderId, message));
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
