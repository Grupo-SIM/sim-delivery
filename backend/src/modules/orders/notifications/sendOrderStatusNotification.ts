import { OrderStatusEmail } from "@/shared/infra/emails";
import { getOrderStatusEmailTemplate } from "@/modules/branding/orderStatusEmailTemplates";
import { getOrderStatusWhatsAppTemplate } from "@/modules/branding/orderStatusWhatsAppTemplates";
import type { OrderStatusEmailTemplate, OrderStatusWhatsAppTemplate } from "@/modules/branding/dtos";
import type { PrismaInstance } from "@/shared/infra/sql";
import { dispatchWhatsApp } from "@/shared/infra/whatsapp";
import type { WhatsAppSender } from "@/shared/infra/whatsapp";
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
	cancelReason?: string | null;
	companyId: string;
	customer: OrderStatusNotificationCustomer;
	deliveryMethod: string;
	emailTemplates?: Record<string, OrderStatusEmailTemplate> | null;
	emailSender?: OrderStatusEmailSender;
	message?: string;
	orderId: string;
	orderNumber: number;
	reviewUrl?: string;
	status: string;
	unitId: string;
	unitWhatsAppSession?: string | null;
	templates?: Record<string, string | OrderStatusWhatsAppTemplate> | null;
	whatsApp: WhatsAppSender;
}

type SendOrderStatusEmailInput = Omit<
	SendOrderStatusNotificationInput,
	"companyId" | "unitId" | "unitWhatsAppSession" | "whatsApp"
>;

interface DispatchOrderStatusWhatsAppInput extends SendOrderStatusNotificationInput {
	deduplicationKey: string;
	prisma: Pick<PrismaInstance, "whatsAppNotification">;
}

const defaultEmailSender: OrderStatusEmailSender = {
	send: input => new OrderStatusEmail(input).send(),
};

export function getOrderStatusNotificationMessage({
	cancelReason,
	deliveryMethod,
	message: messageOverride,
	orderNumber,
	status,
	templates,
}: Pick<
	SendOrderStatusNotificationInput,
	"cancelReason" | "deliveryMethod" | "message" | "orderNumber" | "status" | "templates"
>): string {
	return (
		messageOverride ??
		formatOrderStatusMessage(
			getOrderStatusWhatsAppTemplate(templates, status).message?.trim() || undefined,
			status,
			orderNumber,
			deliveryMethod,
			cancelReason,
		)
	);
}

export function getOrderStatusEmailMessage({
	cancelReason,
	deliveryMethod,
	emailTemplates,
	message: messageOverride,
	orderNumber,
	status,
	templates,
}: Pick<
	SendOrderStatusNotificationInput,
	"cancelReason" | "deliveryMethod" | "emailTemplates" | "message" | "orderNumber" | "status" | "templates"
>): string {
	const emailTemplate = getOrderStatusEmailTemplate(emailTemplates, status).message?.trim();
	const whatsAppTemplate = getOrderStatusWhatsAppTemplate(templates, status).message?.trim();
	const template = messageOverride ?? (emailTemplate || whatsAppTemplate || undefined);
	return formatOrderStatusMessage(template, status, orderNumber, deliveryMethod, cancelReason);
}

export async function dispatchOrderStatusWhatsApp({
	cancelReason,
	customer,
	companyId,
	deduplicationKey,
	deliveryMethod,
	message: messageOverride,
	orderId,
	orderNumber,
	prisma,
	status,
	templates,
	whatsApp,
	unitId,
	unitWhatsAppSession,
}: DispatchOrderStatusWhatsAppInput): Promise<void> {
	const phone = customer.phone ?? customer.user?.phoneNumber;
	if (customer.notificationWhatsApp === false || !phone) return;
	const message = getOrderStatusNotificationMessage({
		cancelReason,
		deliveryMethod,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	const { attachments = [] } = getOrderStatusWhatsAppTemplate(templates, status);
	await dispatchWhatsApp({
		attachments,
		companyId,
		deduplicationKey,
		message,
		orderId,
		orderStatus: status,
		phone,
		prisma,
		provider: whatsApp,
		sessionName: unitWhatsAppSession,
		unitId,
	});
}

export async function sendOrderStatusEmail({
	cancelReason,
	customer,
	deliveryMethod,
	emailTemplates,
	emailSender = defaultEmailSender,
	message: messageOverride,
	orderNumber,
	reviewUrl,
	status,
	templates,
}: SendOrderStatusEmailInput): Promise<void> {
	if (customer.notificationEmail === false || !customer.user?.email) return;
	const message = getOrderStatusEmailMessage({
		cancelReason,
		deliveryMethod,
		emailTemplates,
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
	cancelReason,
	customer,
	deliveryMethod,
	emailTemplates,
	emailSender = defaultEmailSender,
	message: messageOverride,
	orderId,
	orderNumber,
	reviewUrl,
	status,
	templates,
	whatsApp,
}: SendOrderStatusNotificationInput): Promise<void> {
	const whatsAppMessage = getOrderStatusNotificationMessage({
		cancelReason,
		deliveryMethod,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	const emailMessage = getOrderStatusEmailMessage({
		cancelReason,
		deliveryMethod,
		emailTemplates,
		message: messageOverride,
		orderNumber,
		status,
		templates,
	});
	const phone = customer.phone ?? customer.user?.phoneNumber;
	const deliveries: Promise<void>[] = [];

	if (customer.notificationWhatsApp !== false && phone) {
		deliveries.push(
			whatsApp.sendMessage(phone, {
				attachments: getOrderStatusWhatsAppTemplate(templates, status).attachments,
				text: whatsAppMessage,
			}),
		);
	}
	if (customer.notificationEmail !== false && customer.user?.email) {
		deliveries.push(
			emailSender.send({
				message: emailMessage,
				orderNumber,
				...(reviewUrl ? { reviewUrl } : {}),
				status,
				to: customer.user.email,
			}),
		);
	}

	await Promise.allSettled(deliveries);
}
