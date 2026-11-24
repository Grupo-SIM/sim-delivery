import { t } from "elysia";

export const ProviderWithdrawalStatus = t.Union([
	t.Literal("PENDING"),
	t.Literal("APPROVED"),
	t.Literal("COMPLETED"),
	t.Literal("REJECTED"),
]);

export const LocalWithdrawalStatus = t.Union([t.Literal("submitting"), ProviderWithdrawalStatus]);
export type LocalWithdrawalStatus = typeof LocalWithdrawalStatus.static;

export const WithdrawalReturn = t.Object({
	cnpj: t.Nullable(t.String()),
	createdAt: t.Date(),
	externalWithdrawalId: t.Nullable(t.String()),
	feeCents: t.Integer(),
	grossAmountCents: t.Integer(),
	id: t.String(),
	netAmountCents: t.Integer(),
	pixKey: t.String(),
	rejectionReason: t.Nullable(t.String()),
	status: LocalWithdrawalStatus,
	unitId: t.Nullable(t.String()),
	updatedAt: t.Date(),
});

export const WithdrawalDocumentOption = t.Object({
	cnpj: t.String(),
	label: t.String(),
	unitId: t.Nullable(t.String()),
});

export const WithdrawalSummaryReturn = t.Object({
	availableBalanceCents: t.Integer(),
	blockReason: t.Nullable(t.String()),
	canRequest: t.Boolean(),
	configured: t.Boolean(),
	/** Documents the requester may use as the Pix key, already ordered by the company preference (first = default). */
	documents: t.Array(WithdrawalDocumentOption),
	feePolicy: t.Object({ fixedCents: t.Integer(), percentBasisPoints: t.Integer() }),
	minimumCents: t.Nullable(t.Integer()),
	pixKey: t.Nullable(t.String()),
	processingCount: t.Integer(),
	processingGrossCents: t.Integer(),
});

export const WithdrawalQuoteBody = t.Object({ grossAmountCents: t.Integer({ minimum: 1 }) });
export const WithdrawalQuoteReturn = t.Object({
	feeCents: t.Integer(),
	grossAmountCents: t.Integer(),
	netAmountCents: t.Integer(),
});
export const RequestWithdrawalBody = t.Object({
	grossAmountCents: t.Integer({ minimum: 1 }),
	pixKey: t.String({ minLength: 1 }),
	/** Unit whose CNPJ the Pix key refers to; omitted/null = company CNPJ. */
	unitId: t.Optional(t.Nullable(t.String())),
});
export const WithdrawalListQuery = t.Object({
	page: t.Optional(t.Numeric({ default: 1, minimum: 1 })),
	pageSize: t.Optional(t.Numeric({ default: 10, maximum: 100, minimum: 1 })),
});
export const WithdrawalListReturn = t.Object({
	items: t.Array(WithdrawalReturn),
	meta: t.Object({ page: t.Integer(), pageSize: t.Integer(), totalItems: t.Integer(), totalPages: t.Integer() }),
});
export const WithdrawalWebhookBody = t.Object({
	eventId: t.String(),
	externalMerchantId: t.String(),
	rejectionReason: t.Nullable(t.String()),
	requestId: t.Nullable(t.String()),
	status: ProviderWithdrawalStatus,
	updatedAt: t.String(),
	withdrawalId: t.String(),
});
