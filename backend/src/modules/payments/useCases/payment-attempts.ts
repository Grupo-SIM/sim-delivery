import { createHash } from "node:crypto";
import { DomainError } from "@/shared/errors";
import { isApprovedSimpayStatus, isFailedSimpayStatus, type SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { PaymentErrors } from "../errors";
import type { PayingCustomerContext } from "./resolvePayingCustomer";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";
const active = ["preparing", "submitting", "pending"];
export async function startPaymentAttempt(db: PrismaInstance, context: PayingCustomerContext, method: string) {
	const data = { orderId: context.order.id, companyId: context.companyId, method, amountCents: context.order.total, merchantAmountCents: context.order.total - context.order.feeTotalCents, platformFeeCents: context.order.feeTotalCents };
	const requestHash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
	const saved = await db.paymentAttempt.findFirst({ where: { orderId: data.orderId, state: { in: active } } });
	if (saved) {
		if (saved.requestHash !== requestHash) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
		return { attempt: saved, created: false };
	}
	try { return { attempt: await db.paymentAttempt.create({ data: { ...data, requestHash } }), created: true }; }
	catch (error) {
		if ((error as { code?: string }).code !== "P2002") throw error;
		throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	}
}
export async function recoverPaymentAttempt(db: PrismaInstance, client: SimpayClient, context: PayingCustomerContext, attemptId: string) {
	if (!context.merchant) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const result = await client.getPaymentAttempt(context.merchant, attemptId).catch(() => null);
	if (!result || !result.transactionId || !result.paymentId && !isApprovedSimpayStatus(result.status) && !isFailedSimpayStatus(result.status)) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const reference = result.paymentId ?? result.transactionId;
	const attempt = await db.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
	if (attempt.companyId !== context.companyId || attempt.orderId !== context.order.id || attempt.amountCents !== result.amountCents || context.order.total !== attempt.amountCents) throw new DomainError(PaymentErrors.PAYMENT_PROCESSING);
	const method = attempt.method;
	const current = await db.payment.findUnique({ where: { orderId: context.order.id } });
	if (current?.status === "confirmed" && current.simpayPaymentId !== reference) throw new DomainError(PaymentErrors.PAYMENT_ALREADY_CONFIRMED);
	const payment = await db.payment.upsert({ where: { orderId: context.order.id },
		create: { orderId: context.order.id, method, amount: context.order.total, simpayPaymentId: reference, pixContent: result.pixContent, pixQrcode: result.qrCode },
		update: { method, amount: attempt.amountCents, simpayPaymentId: reference, pixContent: result.pixContent, pixQrcode: result.qrCode },
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
