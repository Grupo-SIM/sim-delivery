import { afterEach, expect, mock, test } from "bun:test";
import { createHmac } from "node:crypto";
import { encryptSimpaySecret } from "@/shared/infra/simpay-secrets";
import { drainCanonicalWebhooks, receiveCanonicalWebhook } from "./canonical-webhooks";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { SimpayClient } from "@/shared/infra/simpay";
const previous = process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
afterEach(() => { if (previous === undefined) delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY; else process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = previous; });
function fixture() {
 process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "ab".repeat(32);
 const inbox: any[] = [];
 const attempt = { id: "attempt", companyId: "company", orderId: "order", state: "pending", providerTransactionId: "transaction", providerPaymentId: "gateway" };
 let payment: any = null;
 const db = {
  companySimpayIntegration: { findUnique: async () => ({ status: "READY", platformId: "platform", encryptedWebhookSecret: encryptSimpaySecret("secret") }) },
  simpayWebhookInbox: { upsert: mock(async ({ create }: any) => { const existing = inbox.find(r => r.eventId === create.eventId); if (existing) return existing; const row = { id: `inbox-${inbox.length}`, processedAt: null, ...create }; inbox.push(row); return row; }), findMany: async () => inbox.filter(r => !r.processedAt), update: async ({ where, data }: any) => Object.assign(inbox.find(r => r.id === where.id), data) },
  paymentAttempt: { findFirst: async ({ where }: any) => where.id && where.id !== attempt.id ? null : attempt, update: async ({ data }: any) => Object.assign(attempt, data) },
  payment: {
   findFirst: async () => payment,
   findUnique: async () => payment,
   update: async ({ data }: any) => Object.assign(payment, data),
   updateMany: mock(async ({ where, data }: any) => { if (payment.status !== where.status) return { count: 0 }; Object.assign(payment, data); return { count: 1 }; }),
  },
 };
 const event = { eventId: "event", kind: "payment.updated", platformId: "platform", externalMerchantId: "company", requestId: "attempt", transactionId: "transaction", paymentId: "gateway", status: "FAILED", updatedAt: new Date().toISOString() };
 return { db: db as unknown as PrismaInstance, inbox, attempt, event, link: () => { payment = { id: "payment", orderId: "order", status: "pending", simpayPaymentId: "gateway", token: "public-token" }; return payment; } };
}
const client = {} as SimpayClient;
const sign = (raw: string) => createHmac("sha256", "secret").update(raw).digest("hex");
test("HMAC uses exact raw bytes and rejects wrong tenant or platform before persistence", async () => {
 const f = fixture();
 for (const payload of [{ ...f.event, platformId: "other" }, { ...f.event, externalMerchantId: "other" }]) {
  const raw = JSON.stringify(payload);
  await expect(receiveCanonicalWebhook(f.db, client, "company", raw, sign(raw))).rejects.toThrow("WITHDRAWAL_WEBHOOK_UNAUTHORIZED");
 }
 const raw = JSON.stringify(f.event);
 await expect(receiveCanonicalWebhook(f.db, client, "company", `${raw} `, sign(raw))).rejects.toThrow("WITHDRAWAL_WEBHOOK_UNAUTHORIZED");
 expect(f.inbox).toHaveLength(0);
});
test("callback before HTTP response stays durable and replay applies terminal result once", async () => {
 const f = fixture(); const raw = JSON.stringify(f.event);
 await receiveCanonicalWebhook(f.db, client, "company", raw, sign(raw));
 expect(f.inbox[0].processedAt).toBeNull();
 const payment = f.link();
 await drainCanonicalWebhooks(f.db, client);
 expect(payment.status).toBe("failed"); expect(f.attempt.state).toBe("failed");
 await receiveCanonicalWebhook(f.db, client, "company", raw, sign(raw));
 expect(f.inbox).toHaveLength(1);
 expect(f.db.payment.updateMany).toHaveBeenCalledTimes(1);
});
test("callback cannot overwrite a different provider reference", async () => {
 const f = fixture(); const payment = f.link(); payment.simpayPaymentId = "different";
 const raw = JSON.stringify(f.event);
 await receiveCanonicalWebhook(f.db, client, "company", raw, sign(raw));
 expect(payment.status).toBe("pending"); expect(f.inbox[0].processedAt).toBeNull();
});
