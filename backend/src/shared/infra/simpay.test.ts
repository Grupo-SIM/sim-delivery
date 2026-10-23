import { afterEach, expect, it, mock, spyOn } from "bun:test";
import { SimpayClient, isApprovedSimpayStatus, isFailedSimpayStatus } from "./simpay";
import { decryptSimpaySecret, encryptSimpaySecret } from "./simpay-secrets";
import type { PrismaInstance } from "./sql";
const previous = { ...process.env };
afterEach(() => { mock.restore(); for (const key of ["SIMPAY_PROVISIONING_TOKEN", "SIMPAY_CREDENTIALS_ENCRYPTION_KEY", "BETTER_AUTH_SECRETS"]) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } });
const scope = { externalMerchantId: "company", integrationKey: "sim-delivery_shop" };
const ready = { id: "platform", status: "READY", platform: { id: "platform", tag: "SHOP" }, merchant: { id: "merchant" }, credentials: { accessToken: "scoped-token", webhookSecret: "webhook-secret" } };
function fixture(active = true) {
 process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "ab".repeat(32);
 process.env.SIMPAY_PROVISIONING_TOKEN = "provision-token";
 let saved: any = active ? { status: "READY", platformId: "platform", platformTag: "SHOP", encryptedAccessToken: encryptSimpaySecret("scoped-token") } : null;
 const db = { payment: { findMany: mock(async () => [] as { simpayPaymentId: string }[]) }, company: { findUnique: async () => ({ id: "company", slug: "shop", name: "Shop" }) }, companySimpayIntegration: { findUnique: async () => saved, upsert: mock(async ({ create, update }: any) => { saved = saved ? { ...saved, ...update } : create; return saved; }) } };
 return { client: new SimpayClient(db as unknown as PrismaInstance), db, saved: () => saved };
}
it("normalizes canonical and historical provider statuses", () => { expect(isApprovedSimpayStatus(" completed ")).toBe(true); expect(isApprovedSimpayStatus("PENDING")).toBe(false); expect(isFailedSimpayStatus("not_authorized")).toBe(true); });
it("reserves pending platform before owner and persists only registration metadata", async () => {
 const { client, saved } = fixture(false);
 const fetch = spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: "reservation", status: "PENDING_OWNER" }));
 expect(await client.provisionPlatform(scope, "Shop")).toEqual({ id: "reservation", status: "PENDING_OWNER" });
 expect(String(fetch.mock.calls[0][0])).toEndWith("/platform-registrations/company");
 expect(fetch.mock.calls[0][1]?.headers).toHaveProperty("x-provisioning-token", "provision-token");
 expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ slug: "shop", legalName: "Shop" });
 expect(saved()).toMatchObject({ companyId: "company", status: "PENDING_OWNER" });
});
it("completes owner with encrypted per-company credentials and no stored password", async () => {
 const { client, saved } = fixture(false);
 const fetch = spyOn(globalThis, "fetch").mockResolvedValue(Response.json(ready));
 expect(await client.provisionOwner(scope, { email: "owner@example.com", legalName: "Shop", password: "secret123", cnpj: null })).toEqual({ id: "merchant" });
 expect(String(fetch.mock.calls[0][0])).toEndWith("/platform-registrations/company/owner");
 expect(decryptSimpaySecret(saved().encryptedAccessToken)).toBe("scoped-token");
 expect(JSON.stringify(saved())).not.toContain("scoped-token"); expect(JSON.stringify(saved())).not.toContain("secret123");
});
it("rejects incomplete active registration responses", async () => {
 const { client, db } = fixture(false); spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ id: "platform", status: "READY" }));
 await expect(client.provisionPlatform(scope, "Shop")).rejects.toThrow("credenciais"); expect(db.companySimpayIntegration.upsert).not.toHaveBeenCalled();
});
it("sends cents, allocation and idempotency only through canonical merchant scope", async () => {
 const { client } = fixture(); const fetch = spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ id: "merchant" })).mockResolvedValueOnce(Response.json({ transactionId: "transaction", paymentId: "gateway", status: "PENDING", amountCents: 10537, pixContent: "copy", qrCode: "qr" }));
 const params = { idempotencyKey: "attempt", allocation: { merchantAmountCents: 10000, platformFeeCents: 537 }, price: 105.37, document: "52998224725", document_type: "CPF", name: "Maria Silva", email: "buyer@example.com", description: "Pedido" };
 expect(await client.createPixPayment(params, { ...scope, cnpj: "10802530000107", legalName: "Shop" })).toMatchObject({ paymentId: "gateway", pix_qrcode: "qr", pix_content: "copy" });
 expect(String(fetch.mock.calls[1][0])).toEndWith("/platforms/SHOP/merchants/company/payments");
 expect(fetch.mock.calls[1][1]?.headers).toHaveProperty("x-access-token", "scoped-token"); expect(fetch.mock.calls[1][1]?.headers).not.toHaveProperty("x-internal-token");
 expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toMatchObject({ amountCents: 10537, allocation: params.allocation, idempotencyKey: "attempt", paymentMethod: "PIX", customer: { documentType: "CPF" } });
});
it("adapts canonical withdrawal amounts, pagination and decimal rates", async () => {
 const { client } = fixture(); const row = { id: "withdrawal", amountCents: 800, grossAmountCents: 1000, feeCents: 200, pixKey: "key", requestId: "local", status: "PENDING", rejectionReason: null, createdAt: "2026-10-22T00:00:00Z", updatedAt: "2026-10-22T00:00:00Z" };
 const fetch = spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json(row)).mockResolvedValueOnce(Response.json({ data: [row], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } })).mockResolvedValueOnce(Response.json({ availableBalanceCents: 5000, feePolicy: { fixedCents: 200, rate: 0.025 } }));
 expect(await client.requestWithdrawal(scope, { grossAmountCents: 1000, pixKey: "key", requestId: "local" })).toMatchObject({ netAmountCents: 800, requestId: "local" });
 expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ amountCents: 1000, pixKey: "key", idempotencyKey: "local" });
 expect(await client.listWithdrawals(scope, 1, 10)).toMatchObject({ items: [{ netAmountCents: 800 }], meta: { totalItems: 1, pageSize: 10 } });
 expect((await client.getWithdrawalSummary(scope)).feePolicy).toEqual({ fixedCents: 200, percentBasisPoints: 250 });
});
it("refuses anonymous historical status and charges without company scope", async () => {
 const { client } = fixture(); const fetch = spyOn(globalThis, "fetch");
 await expect(client.getPaymentStatus("historic")).rejects.toThrow("associação"); await expect(client.createPixPayment({} as never)).rejects.toThrow("carteira"); expect(fetch).not.toHaveBeenCalled();
});
it("preserves provider errors, including non-JSON errors", async () => {
 const { client } = fixture(); spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ message: "Conflito" }, { status: 409 })).mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }));
 await expect(client.getPaymentStatus("payment", scope)).rejects.toThrow("Conflito"); await expect(client.getPaymentStatus("payment", scope)).rejects.toThrow("HTTP 502");
});
it("detects wrong encryption key and preserves dedicated-key requirements for legacy ciphertext", () => {
 fixture(); const encoded = encryptSimpaySecret("test-secret"); expect(decryptSimpaySecret(encoded)).toBe("test-secret"); process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "cd".repeat(32); expect(() => decryptSimpaySecret(encoded)).toThrow(); delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY; expect(() => decryptSimpaySecret(encoded)).toThrow("SIMPAY_CREDENTIALS_ENCRYPTION_KEY");
});

it("blocks credential activation when pending historical payments cannot be proven", async () => {
 const { client, db } = fixture(false);
 db.payment.findMany.mockResolvedValue([{ simpayPaymentId: "historic-payment" }]);
 const fetch = spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json(ready)).mockResolvedValueOnce(Response.json({ compatible: false, conflicts: ["historic-payment"] }));
 await expect(client.provisionPlatform(scope, "Shop")).rejects.toThrow("Histórico financeiro");
 expect(db.companySimpayIntegration.upsert).not.toHaveBeenCalled();
 expect(String(fetch.mock.calls[1][0])).toEndWith("/platform-registrations/company/compatibility");
});

it("preserves canonical error codes when Nest returns a generic exception message", async () => {
 const { client } = fixture();
 spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ statusCode: 422, code: "DELIVERY_PROFILE_NOT_CONFIGURED", message: "Unprocessable Entity Exception", error: "UnprocessableEntityException" }, { status: 422 }));
 await expect(client.getPaymentAttempt(scope, "attempt")).rejects.toMatchObject({ status: 422, code: "DELIVERY_PROFILE_NOT_CONFIGURED", message: "Unprocessable Entity Exception (DELIVERY_PROFILE_NOT_CONFIGURED)" });
});
it("preserves a code-only canonical rejection instead of hiding it behind HTTP status", async () => {
 const { client } = fixture();
 spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ code: "INVALID_PAYMENT_CONTRACT" }, { status: 422 }));
 await expect(client.getPaymentAttempt(scope, "attempt")).rejects.toMatchObject({ status: 422, code: "INVALID_PAYMENT_CONTRACT", message: "Erro na API canônica SIM INT PAY (HTTP 422) (INVALID_PAYMENT_CONTRACT)" });
});

it("activates a company with existing auth secrets and no dedicated payment encryption variable", async () => {
 const { client, saved } = fixture(false);
 delete process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY;
 process.env.BETTER_AUTH_SECRETS = "1:existing-auth-secret-with-more-than-32-characters";
 spyOn(globalThis, "fetch").mockResolvedValue(Response.json(ready));
 expect(await client.provisionPlatform(scope, "Shop")).toEqual({ id: "platform", status: "READY" });
 expect(saved().encryptedAccessToken).toStartWith("v2:1:");
 expect(decryptSimpaySecret(saved().encryptedAccessToken)).toBe("scoped-token");
 expect(decryptSimpaySecret(saved().encryptedWebhookSecret)).toBe("webhook-secret");
});
