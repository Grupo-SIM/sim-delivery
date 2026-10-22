import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { PrismaClient, adapter, prismaExtensionKysely } from "sql";
import { startPaymentAttempt } from "../useCases/payment-attempts";
import type { PayingCustomerContext } from "../useCases/resolvePayingCustomer";
const local = process.env.CANONICAL_LOCAL_DATABASE_URL;
const enabled = !!local && new URL(local).hostname === "127.0.0.1" && process.env.DATABASE_URL === local;
const suite = enabled ? describe : describe.skip;
suite("canonical attempt SQL constraints (isolated local PostgreSQL)", () => {
 const db = new PrismaClient({ adapter }).$extends(prismaExtensionKysely());
 const context = { companyId: "local-company", order: { id: "attempt-order", total: 10537, feeTotalCents: 537 } } as PayingCustomerContext;
 beforeAll(async () => { await db.paymentAttempt.deleteMany({ where: { orderId: context.order.id } }); });
 afterAll(async () => { await db.paymentAttempt.deleteMany({ where: { orderId: context.order.id } }); await db.$disconnect(); });
 test("concurrent starts permit exactly one active attempt and preserve frozen cents", async () => {
  const result = await Promise.allSettled([startPaymentAttempt(db, context, "pix"), startPaymentAttempt(db, context, "pix")]);
  const rows = await db.paymentAttempt.findMany({ where: { orderId: context.order.id } });
  expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ amountCents: 10537, merchantAmountCents: 10000, platformFeeCents: 537 });
  expect(result.some(r => r.status === "fulfilled")).toBe(true);
  await expect(Promise.resolve(db.paymentAttempt.create({ data: { ...rows[0], id: "duplicate" } }))).rejects.toMatchObject({ code: "P2002" });
 });
 test("only terminal attempt permits another attempt; previous row remains unchanged", async () => {
  const before = await db.paymentAttempt.findFirstOrThrow({ where: { orderId: context.order.id } });
  await db.paymentAttempt.update({ where: { id: before.id }, data: { state: "failed" } });
  const next = await startPaymentAttempt(db, context, "credit_card");
  expect(next.created).toBe(true); expect(next.attempt.id).not.toBe(before.id);
  expect((await db.paymentAttempt.findUniqueOrThrow({ where: { id: before.id } })).state).toBe("failed");
 });
});
