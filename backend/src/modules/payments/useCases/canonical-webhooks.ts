import { createHmac, timingSafeEqual } from "node:crypto";
import { t } from "elysia";
import { Value } from "@sinclair/typebox/value";
import { DomainError } from "@/shared/errors";
import { decryptSimpaySecret } from "@/shared/infra/simpay-secrets";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SimpayClient } from "@/shared/infra/simpay";
import { WithdrawalService } from "@/modules/withdrawals/service";
import { WithdrawalErrors } from "@/modules/withdrawals/errors";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";
const Event = t.Object({ eventId: t.String({ minLength: 1 }), kind: t.Union([t.Literal("payment.updated"), t.Literal("withdrawal.updated")]), platformId: t.String(), externalMerchantId: t.String(), status: t.String(), updatedAt: t.String(), requestId: t.Optional(t.Nullable(t.String())), paymentId: t.Optional(t.Nullable(t.String())), transactionId: t.Optional(t.String()), withdrawalId: t.Optional(t.String()), rejectionReason: t.Optional(t.Nullable(t.String())) });
export async function receiveCanonicalWebhook(db: PrismaInstance, client: SimpayClient, companyId: string, raw: string, signature: string | null) {
	const integration = await db.companySimpayIntegration.findUnique({ where: { companyId } });
	if (!integration?.encryptedWebhookSecret || integration.status !== "READY") throw new DomainError(WithdrawalErrors.WITHDRAWAL_WEBHOOK_UNAUTHORIZED);
	const expected = createHmac("sha256", decryptSimpaySecret(integration.encryptedWebhookSecret)).update(raw).digest("hex");
	if (!signature || !/^[a-f0-9]{64}$/.test(signature) || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new DomainError(WithdrawalErrors.WITHDRAWAL_WEBHOOK_UNAUTHORIZED);
	let payload: unknown;
	try { payload = JSON.parse(raw); } catch { throw new DomainError(WithdrawalErrors.WITHDRAWAL_WEBHOOK_UNAUTHORIZED); }
	if (!Value.Check(Event, payload) || payload.externalMerchantId !== companyId || payload.platformId !== integration.platformId || Number.isNaN(Date.parse(payload.updatedAt))) throw new DomainError(WithdrawalErrors.WITHDRAWAL_WEBHOOK_UNAUTHORIZED);
	await db.simpayWebhookInbox.upsert({ where: { companyId_eventId: { companyId, eventId: payload.eventId } }, create: { companyId, eventId: payload.eventId, payload }, update: {} });
	await drainCanonicalWebhooks(db, client, companyId);
	return { ok: true };
}
export async function drainCanonicalWebhooks(db: PrismaInstance, client: SimpayClient, companyId?: string) {
	const rows = await db.simpayWebhookInbox.findMany({ where: { processedAt: null, ...(companyId ? { companyId } : {}) }, orderBy: { createdAt: "asc" }, take: 100 });
	for (const row of rows) {
		if (!Value.Check(Event, row.payload)) continue;
		const event = row.payload;
		if (event.kind === "payment.updated") {
			const attempt = event.requestId ? await db.paymentAttempt.findFirst({ where: { id: event.requestId, companyId: row.companyId } }) : null;
			if (!attempt || !event.transactionId) continue;
			const latest = await db.paymentAttempt.findFirst({ where: { orderId: attempt.orderId }, orderBy: { createdAt: "desc" } });
			if (latest?.id !== attempt.id) {
				await db.simpayWebhookInbox.update({ where: { id: row.id }, data: { processedAt: new Date() } });
				continue;
			}
			if (attempt.providerTransactionId && attempt.providerTransactionId !== event.transactionId || attempt.providerPaymentId && event.paymentId && attempt.providerPaymentId !== event.paymentId && attempt.providerPaymentId !== event.transactionId) continue;
			const reference = event.paymentId ?? event.transactionId;
			const payment = await db.payment.findFirst({ where: { orderId: attempt.orderId, order: { companyId: row.companyId } } });
			if (!payment) continue; // Early callbacks remain durable until the HTTP response is linked.
			if (payment.simpayPaymentId && payment.simpayPaymentId !== reference && payment.simpayPaymentId !== event.transactionId) continue;
			await db.payment.update({ where: { id: payment.id }, data: { simpayPaymentId: reference } });
			await db.paymentAttempt.update({ where: { id: attempt.id }, data: { providerTransactionId: event.transactionId, providerPaymentId: reference } });
			const result = await new ApplySimpayPaymentStatus(db).execute(reference, event.status, row.companyId);
			if (result.status !== "pending") await db.paymentAttempt.update({ where: { id: attempt.id }, data: { state: result.status === "confirmed" ? "confirmed" : "failed" } });
		} else {
			if (!event.withdrawalId) continue;
			await new WithdrawalService(db, client).webhook({ eventId: event.eventId, externalMerchantId: row.companyId, requestId: event.requestId ?? null, rejectionReason: event.rejectionReason ?? null, status: event.status, updatedAt: event.updatedAt, withdrawalId: event.withdrawalId });
		}
		await db.simpayWebhookInbox.update({ where: { id: row.id }, data: { processedAt: new Date() } });
	}
}
