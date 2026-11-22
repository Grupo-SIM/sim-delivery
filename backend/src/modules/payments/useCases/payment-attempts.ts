import { createHash } from "node:crypto";
import { paymentProviderErrorDescription } from "@/shared/infra/paymentProviderError";
import { DomainError } from "@/shared/errors";
import { quoteOrderCharge } from "@/modules/platformFees/chargeQuote";
import { isApprovedSimpayStatus, isFailedSimpayStatus, type SimpayChargeAmounts, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";
import type { PayingCustomerContext } from "./resolvePayingCustomer";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";
const active = ["preparing", "submitting", "pending"];
/** Merchant base of an order (items after discounts + freight); SimIntPay prices the buyer total from it. */
export function orderChargeBase(order: PayingCustomerContext["order"]) {
	const deliveryAmountCents = order.deliveryFee ?? 0;
	const itemsAmountCents = order.total - order.feeTotalCents - deliveryAmountCents;
	if (itemsAmountCents < 0 || deliveryAmountCents < 0) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	return { amountCents: itemsAmountCents + deliveryAmountCents, deliveryAmountCents, itemsAmountCents };
}
/** SimIntPay charge body for an attempt: the frozen base, the order lines, and the quoted total it must still match. */
export function attemptCharge(attempt: { amountCents: number; baseAmountCents: number | null; deliveryAmountCents: number | null; itemsAmountCents: number | null }, items?: { id: string; quantity: number; unitPrice: number }[]) {
	if (attempt.baseAmountCents == null || attempt.itemsAmountCents == null || attempt.deliveryAmountCents == null) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	return {
		charge: {
			amountCents: attempt.baseAmountCents,
			deliveryAmountCents: attempt.deliveryAmountCents,
			...(items?.length ? { items: items.map(item => ({ key: item.id, quantity: item.quantity, unitPriceCents: item.unitPrice })) } : {}),
			itemsAmountCents: attempt.itemsAmountCents,
		},
		expectedTotalCents: attempt.amountCents,
	};
}
export async function startPaymentAttempt(db: PrismaInstance, context: PayingCustomerContext, method: string) {
	const base = orderChargeBase(context.order);
	const data = { orderId: context.order.id, companyId: context.companyId, method, amountCents: context.order.total, baseAmountCents: base.amountCents, itemsAmountCents: base.itemsAmountCents, deliveryAmountCents: base.deliveryAmountCents };
	const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
	const requestHash = hash(data);
	const saved = await db.paymentAttempt.findFirst({ where: { orderId: data.orderId, state: { in: active } } });
	if (saved) {
		if (saved.baseAmountCents == null ? !legacyHashes(hash, data).includes(saved.requestHash) : saved.requestHash !== requestHash) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
		return { attempt: saved, created: false };
	}
	try { return { attempt: await db.paymentAttempt.create({ data: { ...data, requestHash } }), created: true }; }
	catch (error) {
		if ((error as { code?: string }).code !== "P2002") throw error;
		throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	}
}
/** Hash of an attempt created under the retired allocation contract, so an in-flight one is still recovered, not duplicated. */
function legacyHashes(hash: (value: unknown) => string, data: { orderId: string; companyId: string; method: string; amountCents: number; itemsAmountCents: number; deliveryAmountCents: number }) {
	const legacy = { orderId: data.orderId, companyId: data.companyId, method: data.method, amountCents: data.amountCents, merchantAmountCents: data.itemsAmountCents + data.deliveryAmountCents, platformFeeCents: data.amountCents - data.itemsAmountCents - data.deliveryAmountCents };
	return [hash(legacy), hash({ ...legacy, itemsAmountCents: data.itemsAmountCents, deliveryAmountCents: data.deliveryAmountCents })];
}
export async function recoverPaymentAttempt(db: PrismaInstance, client: SimpayClient, context: PayingCustomerContext, attemptId: string) {
	if (!context.merchant) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const result = await client.getPaymentAttempt(context.merchant, attemptId).catch(error => {
		throw new DomainError(PaymentErrors.PAYMENT_PROCESSING, paymentProviderErrorDescription(error));
	});
	if (!result || !result.transactionId || !result.paymentId && !isApprovedSimpayStatus(result.status) && !isFailedSimpayStatus(result.status)) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const reference = result.paymentId ?? result.transactionId;
	const attempt = await db.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
	// SimIntPay's buyer total is the reference; `amountCents` was the total only under the retired allocation contract.
	const providerTotal = result.totalAmountCents ?? result.amountCents;
	if (attempt.companyId !== context.companyId || attempt.orderId !== context.order.id || attempt.amountCents !== providerTotal) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const method = attempt.method;
	const current = await db.payment.findUnique({ where: { orderId: context.order.id } });
	if (current?.status === "confirmed" && current.simpayPaymentId !== reference) throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);
	const payment = await db.payment.upsert({ where: { orderId: context.order.id },
		create: { orderId: context.order.id, method, amount: providerTotal, ...chargeAmounts(result), simpayPaymentId: reference, pixContent: result.pixContent, pixQrcode: result.qrCode },
		update: { method, amount: providerTotal, ...chargeAmounts(result), simpayPaymentId: reference, pixContent: result.pixContent, pixQrcode: result.qrCode },
	});
	await db.payment.updateMany({ where: { id: payment.id, status: "failed", simpayPaymentId: reference }, data: { status: "pending" } });
	await db.paymentAttempt.update({ where: { id: attemptId }, data: { state: "pending", providerTransactionId: result.transactionId, providerPaymentId: reference } });
	const applied = await new ApplySimpayPaymentStatus(db).execute(reference, result.status, context.companyId);
	if (applied.status !== "pending") await db.paymentAttempt.update({ where: { id: attemptId }, data: { state: applied.status === "confirmed" ? "confirmed" : "failed" } });
	return { payment, status: applied.status };
}
export async function recordAttemptResponse(db: PrismaInstance, id: string, response: { paymentId?: string; id?: string; transactionId?: string; status?: string }) {
	await db.paymentAttempt.update({ where: { id }, data: { state: isFailedSimpayStatus(response.status) ? "failed" : "pending", providerPaymentId: response.paymentId ?? response.id, providerTransactionId: response.transactionId } });
}

/** Amounts SimIntPay settled for a charge, persisted so reports read its net instead of re-deriving it. */
export function chargeAmounts(result: SimpayChargeAmounts) {
	return {
		...(result.netAmountCents != null ? { netAmountCents: result.netAmountCents } : {}),
		...(result.totalAmountCents != null ? { totalAmountCents: result.totalAmountCents } : {}),
	};
}

/**
 * SimIntPay refused the charge because its price moved since the order was quoted (409 QUOTE_CHANGED). Re-quotes the
 * same base, stores the new total on the order and asks the buyer to confirm it before paying again.
 */
export async function repriceOrderAfterQuoteChange(db: PrismaInstance, context: PayingCustomerContext, attemptId: string, method: "CREDIT_CARD" | "PIX"): Promise<never> {
	await db.paymentAttempt.update({ where: { id: attemptId }, data: { state: "failed" } });
	if (!context.merchant) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const base = orderChargeBase(context.order);
	const quote = await quoteOrderCharge({
		company: context.merchant,
		deliveryAmountCents: base.deliveryAmountCents,
		items: (context.order.items ?? []).map(item => ({ key: item.id, quantity: item.quantity, unitPrice: item.unitPrice })),
		itemsAmountCents: base.itemsAmountCents,
		paymentMethod: method,
	}).catch(error => {
		throw new DomainError(PaymentErrors.PAYMENT_PROCESSING, error instanceof Error ? error.message : undefined);
	});
	await db.order.update({ where: { id: context.order.id }, data: { additiveFeeRevision: quote.additiveRevision, feeTotalCents: quote.additiveFeeCents, total: quote.totalAmountCents } });
	throw new DomainError(PaymentErrors.PRICE_CHANGED, `O valor do pedido mudou para R$ ${(quote.totalAmountCents / 100).toFixed(2).replace(".", ",")}. Confirme para pagar.`);
}
