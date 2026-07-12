import { t } from "elysia";

export const CreatePaymentIntentBody = t.Object({
	orderId: t.String({ minLength: 1 }),
	slug: t.String({ minLength: 1 }),
});
export type CreatePaymentIntentBody = typeof CreatePaymentIntentBody.static;

export const PaymentIntentReturn = t.Object({
	paymentUrl: t.String(),
	token: t.String(),
});
export type PaymentIntentReturn = typeof PaymentIntentReturn.static;

export const WebhookBody = t.Object({
	token: t.String({ minLength: 1 }),
});
export type WebhookBody = typeof WebhookBody.static;
