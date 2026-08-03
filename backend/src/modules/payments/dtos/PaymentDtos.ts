import { t } from "elysia";

export const CreatePixPaymentBody = t.Object({
	/** CPF digits; normally saved with the delivery address. */
	cpf: t.Optional(t.String({ maxLength: 14, minLength: 11 })),
	orderId: t.String({ minLength: 1 }),
	slug: t.String({ minLength: 1 }),
});
export type CreatePixPaymentBody = typeof CreatePixPaymentBody.static;

export const PixPaymentReturn = t.Object({
	amount: t.Number(),
	pixContent: t.String(),
	pixQrcode: t.String(),
	token: t.String(),
});
export type PixPaymentReturn = typeof PixPaymentReturn.static;

export const NewCardInput = t.Object({
	cvv: t.String({ maxLength: 4, minLength: 3 }),
	expMonth: t.Number({ maximum: 12, minimum: 1 }),
	expYear: t.Number({ minimum: 2024 }),
	holderName: t.String({ minLength: 2 }),
	number: t.String({ maxLength: 19, minLength: 13 }),
});
export type NewCardInput = typeof NewCardInput.static;

export const CreateCardPaymentBody = t.Object({
	card: t.Optional(NewCardInput),
	cardNickname: t.Optional(t.String({ maxLength: 60, minLength: 1 })),
	/** CPF digits; required when the customer profile has none yet. */
	cpf: t.Optional(t.String({ maxLength: 14, minLength: 11 })),
	orderId: t.String({ minLength: 1 }),
	saveCard: t.Optional(t.Boolean()),
	savedCardId: t.Optional(t.String()),
	slug: t.String({ minLength: 1 }),
});
export type CreateCardPaymentBody = typeof CreateCardPaymentBody.static;

export const CardPaymentReturn = t.Object({
	status: t.String(),
	token: t.String(),
});
export type CardPaymentReturn = typeof CardPaymentReturn.static;

export const PaymentStatusReturn = t.Object({
	/** "pending" | "confirmed" | "failed" */
	status: t.String(),
});
export type PaymentStatusReturn = typeof PaymentStatusReturn.static;

export const SavedCardReturn = t.Object({
	brand: t.String(),
	expiryMonth: t.String(),
	expiryYear: t.String(),
	holderName: t.String(),
	id: t.String(),
	isDefault: t.Boolean(),
	last4: t.String(),
	nickname: t.Nullable(t.String()),
});
export type SavedCardReturn = typeof SavedCardReturn.static;

export const SavedCardsReturn = t.Array(SavedCardReturn);
export type SavedCardsReturn = typeof SavedCardsReturn.static;

export const ListSavedCardsQuery = t.Object({
	slug: t.String({ minLength: 1 }),
});
export type ListSavedCardsQuery = typeof ListSavedCardsQuery.static;

export const WebhookBody = t.Object({
	token: t.String({ minLength: 1 }),
});
export type WebhookBody = typeof WebhookBody.static;

export const RefundMethod = t.Union([t.Literal("gateway"), t.Literal("manual"), t.Literal("cashback")]);
export type RefundMethod = typeof RefundMethod.static;

export const RefundPaymentBody = t.Object({
	/** Cents to refund; omit for a full refund of whatever hasn't been refunded yet. */
	amount: t.Optional(t.Integer({ minimum: 1 })),
	method: RefundMethod,
	reason: t.Optional(t.String({ maxLength: 240 })),
});
export type RefundPaymentBody = typeof RefundPaymentBody.static;

export const RefundReturn = t.Object({
	amount: t.Integer(),
	createdAt: t.String(),
	externalId: t.Nullable(t.String()),
	id: t.String(),
	method: RefundMethod,
	reason: t.Nullable(t.String()),
	/** "pending" | "completed" | "failed" */
	status: t.String(),
});
export type RefundReturn = typeof RefundReturn.static;

export const ListRefundsReturn = t.Array(RefundReturn);
export type ListRefundsReturn = typeof ListRefundsReturn.static;
