import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import { createHash } from "node:crypto";
import { expect, mock, test } from "bun:test";
import { setChargeQuoteSource } from "@/modules/platformFees/chargeQuote";
import { attemptCharge, repriceOrderAfterQuoteChange, startPaymentAttempt, recoverPaymentAttempt } from "./payment-attempts";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PayingCustomerContext } from "./resolvePayingCustomer";
const context = { companyId: "company", order: { id: "order", total: 10537, feeTotalCents: 537 }, merchant: { externalMerchantId: "company", integrationKey: "sim-delivery_shop" } } as PayingCustomerContext;
function fixture() {
 let saved: any = null;
 let payment: any = null;
 const db = {
  paymentAttempt: { findFirst: async () => saved, create: mock(async ({ data }: any) => { saved = { id: "attempt", state: "preparing", ...data }; return saved; }), findUniqueOrThrow: async () => saved, update: async ({ data }: any) => Object.assign(saved, data) },
  order: { update: mock(async () => ({})) },
  payment: { findUnique: async () => payment, upsert: mock(async ({ create }: any) => { payment = { id: "payment", status: "pending", token: "public", ...create }; return payment; }), findFirst: async () => payment, updateMany: async ({ where, data }: any) => { if (payment.status !== where.status) return { count: 0 }; Object.assign(payment, data); return { count: 1 }; } },
 };
 return { db: db as unknown as PrismaInstance, saved: () => saved };
}
test("same order retains stable attempt and frozen base before network submission", async () => {
 const f = fixture(); const first = await startPaymentAttempt(f.db, context, "pix");
 expect(first.created).toBe(true); expect(first.attempt).toMatchObject({ amountCents: 10537, baseAmountCents: 10000, state: "preparing" });
 expect(first.attempt).not.toHaveProperty("merchantAmountCents");
 expect(attemptCharge(first.attempt, [{ id: "item", quantity: 2, unitPrice: 5000 }])).toEqual({ charge: { amountCents: 10000, deliveryAmountCents: 0, items: [{ key: "item", quantity: 2, unitPriceCents: 5000 }], itemsAmountCents: 10000 }, expectedTotalCents: 10537 });
 expect((await startPaymentAttempt(f.db, context, "pix")).created).toBe(false);
 expect(f.db.paymentAttempt.create).toHaveBeenCalledTimes(1);
 await expect(startPaymentAttempt(f.db, { ...context, order: { ...context.order, total: 10538 } }, "pix")).rejects.toThrow("PAYMENT_PROCESSING");
 await expect(startPaymentAttempt(f.db, context, "credit_card")).rejects.toThrow("PAYMENT_PROCESSING");
});
test("unknown network outcome only queries existing key and never starts another charge", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "pix");
 const client = { getPaymentAttempt: mock(async () => { throw new Error("timeout"); }), createPixPayment: mock(async () => ({})) };
 await expect(recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).rejects.toThrow("PAYMENT_PROCESSING");
 expect(client.getPaymentAttempt).toHaveBeenCalledWith(context.merchant, "attempt"); expect(client.createPixPayment).not.toHaveBeenCalled(); expect(f.saved().state).toBe("preparing");
});
test("recovery rejects changed amount before linking a payment and applies terminal failure", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "pix");
 const client = { getPaymentAttempt: mock(async () => ({ transactionId: "transaction", paymentId: "gateway", amountCents: 1, status: "FAILED" })) };
 await expect(recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).rejects.toThrow("PAYMENT_PROCESSING");
 expect(f.db.payment.upsert).not.toHaveBeenCalled();
 client.getPaymentAttempt.mockResolvedValue({ transactionId: "transaction", paymentId: "gateway", amountCents: 10537, status: "FAILED" });
 expect((await recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).status).toBe("failed");
 expect(f.saved().state).toBe("failed");
});
test("terminal rejection without acquirer ID recovers by transaction; pending without ID remains uncertain", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "credit_card");
 const client = { getPaymentAttempt: mock(async () => ({ transactionId: "transaction", paymentId: null, amountCents: 10537, status: "PENDING" })) };
 await expect(recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).rejects.toThrow("PAYMENT_PROCESSING");
 expect(f.db.payment.upsert).not.toHaveBeenCalled();
 client.getPaymentAttempt.mockResolvedValue({ transactionId: "transaction", paymentId: null, amountCents: 10537, status: "FAILED" });
 expect((await recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).status).toBe("failed");
 expect(f.saved().providerTransactionId).toBe("transaction");
 expect(f.saved().providerPaymentId).toBe("transaction");
});

test("old active allocation attempt retains original hash/contract while new attempts freeze item and freight cents", async () => {
 const f = fixture(); const first = await startPaymentAttempt(f.db, context, "pix");
 expect(first.attempt).toMatchObject({ itemsAmountCents: 10000, deliveryAmountCents: 0 });
 const old = f.saved(); delete old.itemsAmountCents; delete old.deliveryAmountCents; delete old.baseAmountCents;
 const data = { orderId: "order", companyId: "company", method: "pix", amountCents: 10537, merchantAmountCents: 10000, platformFeeCents: 537 };
 old.requestHash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
 expect((await startPaymentAttempt(f.db, context, "pix")).created).toBe(false);
 expect(f.db.paymentAttempt.create).toHaveBeenCalledTimes(1);
});

test("recovery preserves provider failure details without unlocking the attempt", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "pix");
 const client = { getPaymentAttempt: mock(async () => { throw new PaymentProviderError("Simpay", "Credencial empresarial inválida", 401); }) };
 await expect(recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).rejects.toMatchObject({ message: "PAYMENT_PROCESSING", description: "Credencial empresarial inválida" });
 expect(f.db.payment.upsert).not.toHaveBeenCalled();
 expect(f.saved().state).toBe("preparing");
});


test("recovery compares SimIntPay's buyer total, not the base it echoes as amountCents", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "pix");
 const client = { getPaymentAttempt: mock(async () => ({ transactionId: "transaction", paymentId: "gateway", amountCents: 10000, totalAmountCents: 10537, netAmountCents: 10000, status: "FAILED" })) };
 expect((await recoverPaymentAttempt(f.db, client as unknown as SimpayClient, context, "attempt")).status).toBe("failed");
 expect(f.db.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ amount: 10537, netAmountCents: 10000, totalAmountCents: 10537 }) }));
});

test("QUOTE_CHANGED re-quotes the same base, stores the new total and asks the buyer to confirm", async () => {
 const f = fixture(); await startPaymentAttempt(f.db, context, "pix");
 setChargeQuoteSource({ quotePayment: async (_scope, input) => ({ additiveFeeCents: 600, additiveRevision: "rev_2", baseAmountCents: input.amountCents, buyerInterestCents: 0, feeMode: "ADDITIVE_ONLY", netAmountCents: input.amountCents, sellerFeeCents: 0, totalAmountCents: input.amountCents + 600 }) });
 try {
  await expect(repriceOrderAfterQuoteChange(f.db, context, "attempt", "PIX")).rejects.toMatchObject({ message: "PRICE_CHANGED", description: "O valor do pedido mudou para R$ 106,00. Confirme para pagar." });
  expect(f.saved().state).toBe("failed");
  expect((f.db as any).order.update).toHaveBeenCalledWith({ where: { id: "order" }, data: { additiveFeeRevision: "rev_2", feeTotalCents: 600, total: 10600 } });
 } finally { setChargeQuoteSource(null); }
});
