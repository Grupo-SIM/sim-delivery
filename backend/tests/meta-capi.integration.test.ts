import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { PrismaClient, adapter } from "sql";
import { CreateOrder } from "../src/modules/orders/useCases/CreateOrder";
import { ConfirmPayment } from "../src/modules/payments/useCases/ConfirmPayment";
import { MetaCapiWorker } from "../src/shared/infra/MetaCapiWorker";
import { encryptSimpaySecret } from "../src/shared/infra/simpay-secrets";
import { UpdateBranding } from "../src/modules/branding/useCases/UpdateBranding";
import { GetBranding } from "../src/modules/branding/useCases/GetBranding";

const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid.invalid/test");
if (process.env.META_CAPI_DISPOSABLE_TEST && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
	throw new Error("Requires META_CAPI_DISPOSABLE_TEST=1 and disposable loopback DATABASE_URL");
}
const prisma = new PrismaClient({ adapter });
const id = randomUUID();
let companyId: string;
let customerId: string;
let unitId: string;
const payments: string[] = [];

describe.skipIf(!process.env.META_CAPI_DISPOSABLE_TEST)("disposable Meta integration", () => {
beforeAll(async () => {
	process.env.SIMPAY_CREDENTIALS_ENCRYPTION_KEY = "a".repeat(64);
	const company = await prisma.company.create({ data: { name: "Integration", slug: id, metaPixelId: "123456", metaCapiToken: encryptSimpaySecret("secret-token") } });
	companyId = company.id;
	const user = await prisma.user.create({ data: { id, name: "Maria Silva", email: `${id}@example.test`, emailVerified: true, phoneNumber: "+5568999999999" } });
	customerId = (await prisma.customer.create({ data: { companyId, userId: user.id } })).id;
	unitId = (await prisma.unit.create({ data: { companyId, name: "Integration", slug: id } })).id;
}, 30_000);
afterAll(async () => {
	await prisma.marketingEvent.deleteMany({ where: { companyId } });
	await prisma.payment.deleteMany({ where: { order: { companyId } } });
	await prisma.orderItem.deleteMany({ where: { order: { companyId } } });
    await prisma.order.deleteMany({ where: { companyId } });
	await prisma.customer.deleteMany({ where: { companyId } });
	await prisma.unitProduct.deleteMany({ where: { unitId } });
    await prisma.product.deleteMany({ where: { companyId } });
    await prisma.unit.deleteMany({ where: { companyId } });
	await prisma.user.delete({ where: { id } });
	await prisma.company.delete({ where: { id: companyId } });
	await prisma.$disconnect();
}, 30_000);
async function payment(method = "pix", consent = true, total = 2500) {
	const order = await prisma.order.create({ data: { companyId, customerId, unitId, total, subtotal: total, deliveryFee: 0, deliveryMethod: "pickup", status: "awaiting_payment", ...(consent ? { marketingAttribution: { consent: true, consentVersion: "2026-10-29", consentedAt: new Date().toISOString(), fbp: "fb.1.123.456", sourceUrl: "https://example.test/checkout" } } : {}) } });
	const value = await prisma.payment.create({ data: { orderId: order.id, amount: total, method } });
	payments.push(value.token);
	return { order, value };
}
const confirm = () => new ConfirmPayment(prisma, { send: async () => {} } as never, { send: async () => {} } as never);

describe("consented atomic marketing outbox", () => {
    test("CreateOrder preserves consent snapshot on idempotent retry and strips query secrets", async () => {
        const product = await prisma.product.create({ data: { companyId, title: "Integration", slug: id, basePriceCents: 2500 } });
        const association = await prisma.unitProduct.create({ data: { unitId, productId: product.id } });
        const body = { slug: id, unitSlug: id, deliveryMethod: "pickup" as const, idempotencyKey: randomUUID(), items: [{ unitProductId: association.id, quantity: 1 }], marketingAttribution: { consent: true as const, consentVersion: "2026-10-29", sourceUrl: "https://example.test/checkout?token=secret#private", fbp: "fb.1.123.456", utm: { source: "meta" } } };
        const first = await new CreateOrder(prisma).execute(id, body, { ip: "127.0.0.1", userAgent: "Integration" });
        const retry = await new CreateOrder(prisma).execute(id, { ...body, marketingAttribution: undefined });
        expect(retry.id).toBe(first.id);
        const order = await prisma.order.findUniqueOrThrow({ where: { id: first.id } });
        expect((order.marketingAttribution as any).sourceUrl).toBe("https://example.test/checkout");
        expect((order.marketingAttribution as any).consentVersion).toBe("2026-10-29");
        expect((order.marketingAttribution as any).utm.source).toBe("meta");
        expect(await prisma.marketingEvent.count({ where: { orderId: first.id } })).toBe(0);
    });

	test("concurrent confirmations create exactly one Purchase with canonical timestamp/value", async () => {
		const { order, value } = await payment();
		const results = await Promise.all([confirm().execute(value.token), confirm().execute(value.token)]);
		expect(results.filter(Boolean)).toHaveLength(1);
		const event = await prisma.marketingEvent.findUniqueOrThrow({ where: { orderId_eventName: { orderId: order.id, eventName: "Purchase" } } });
		const confirmed = await prisma.payment.findUniqueOrThrow({ where: { id: value.id } });
		expect(event.eventTime).toEqual(confirmed.confirmedAt);
		expect(event.eventId).toBe(`purchase_${order.id}`);
		const payload = event.payload as any;
		expect(payload.custom_data.value).toBe(25);
		expect(payload.custom_data.payment_method).toBe("pix");
		expect(payload.user_data.em[0]).toMatch(/^[a-f0-9]{64}$/);
		expect(JSON.stringify(payload)).not.toContain("Maria");
	});
	test("card maps to card; refusal, offline methods and zero total never queue", async () => {
		for (const [method, consent, total, expected] of [["credit_card", true, 2500, 1], ["pix", false, 2500, 0], ["cash", true, 2500, 0], ["pix", true, 0, 0]] as const) {
			const { order, value } = await payment(method, consent, total);
			await confirm().execute(value.token);
			expect(await prisma.marketingEvent.count({ where: { orderId: order.id } })).toBe(expected);
			if (expected) expect((await prisma.marketingEvent.findFirstOrThrow({ where: { orderId: order.id } })).paymentMethod).toBe("card");
		}
	});
    test("pending and failed gateway states do not emit; account marker claims once", async () => {
        const { order, value } = await payment();
        expect(await prisma.marketingEvent.count({ where: { orderId: order.id } })).toBe(0);
        await prisma.payment.update({ where: { id: value.id }, data: { status: "failed" } });
        expect(await confirm().execute(value.token)).toBe(false);
        expect(await prisma.marketingEvent.count({ where: { orderId: order.id } })).toBe(0);
        const existing = await prisma.user.updateMany({ where: { id, registrationEventPendingAt: { gte: new Date(Date.now() - 30 * 60_000) } }, data: { registrationEventPendingAt: null } });
        expect(existing.count).toBe(0);
        await prisma.user.update({ where: { id }, data: { registrationEventPendingAt: new Date() } });
        const claims = await Promise.all([1,2].map(() => prisma.user.updateMany({ where: { id, registrationEventPendingAt: { gte: new Date(Date.now() - 30 * 60_000) } }, data: { registrationEventPendingAt: null } })));
        expect(claims.reduce((sum, claim) => sum + claim.count, 0)).toBe(1);
    });

	test("encrypted token never leaks into public branding; empty clears", async () => {
		const result = await new UpdateBranding(prisma).execute({ companyId, metaCapiToken: "replacement-secret", legalName: "Test Legal" });
		expect(JSON.stringify(result)).not.toContain("replacement-secret");
		const stored = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
		expect(stored.metaCapiToken).not.toBe("replacement-secret");
		const branding = await new GetBranding(prisma).execute({ slug: id });
		expect(branding.legalName).toBe("Test Legal");
		expect(branding).not.toHaveProperty("metaCapiToken");
		await new UpdateBranding(prisma).execute({ companyId, metaCapiToken: "" });
		expect((await prisma.company.findUniqueOrThrow({ where: { id: companyId } })).metaCapiToken).toBeNull();
		await prisma.company.update({ where: { id: companyId }, data: { metaCapiToken: encryptSimpaySecret("secret-token") } });
	});
	test("fake Meta transient retry preserves event ID and honors concurrent claims", async () => {
		await prisma.marketingEvent.updateMany({ where: { companyId }, data: { sentAt: new Date() } });
		const { order, value } = await payment();
		await confirm().execute(value.token);
		const bodies: any[] = [];
		const fake = (async (_url: unknown, options: RequestInit) => { bodies.push(JSON.parse(options.body as string)); return Response.json({ error: { code: 2, is_transient: true } }, { status: 503 }); }) as typeof fetch;
		await Promise.all([new MetaCapiWorker(prisma, fake).execute(), new MetaCapiWorker(prisma, fake).execute()]);
		expect(bodies).toHaveLength(1);
		const event = await prisma.marketingEvent.findFirstOrThrow({ where: { orderId: order.id } });
		expect(event.attempts).toBe(1);
		expect(event.nextRetryAt.getTime()).toBeGreaterThan(Date.now());
		await new MetaCapiWorker(prisma, fake).execute();
		expect(bodies).toHaveLength(1);
		await prisma.marketingEvent.update({ where: { id: event.id }, data: { nextRetryAt: new Date(0) } });
		await new MetaCapiWorker(prisma, (async (_url, options) => { bodies.push(JSON.parse(options!.body as string)); return Response.json({ events_received: 1 }); }) as typeof fetch).execute();
		expect(bodies[0].data[0].event_id).toBe(bodies[1].data[0].event_id);
		expect((await prisma.marketingEvent.findUniqueOrThrow({ where: { id: event.id } })).sentAt).not.toBeNull();
	});
    test("permanent failures stop; expired leases recover; expired events scrub without sending", async () => {
        await prisma.marketingEvent.updateMany({ where: { companyId }, data: { sentAt: new Date() } });
        const { order, value } = await payment();
        await confirm().execute(value.token);
        const event = await prisma.marketingEvent.findFirstOrThrow({ where: { orderId: order.id } });
        await prisma.marketingEvent.update({ where: { id: event.id }, data: { lockedAt: new Date(Date.now() - 180_000), lockToken: "dead-worker" } });
        let sends = 0;
        const fake = (async () => { sends++; return Response.json({ error: { code: 190 } }, { status: 400 }); }) as typeof fetch;
        await new MetaCapiWorker(prisma, fake).execute();
        expect(sends).toBe(1);
        expect((await prisma.marketingEvent.findUniqueOrThrow({ where: { id: event.id } })).failedAt).not.toBeNull();
        await new MetaCapiWorker(prisma, fake).execute();
        expect(sends).toBe(1);
        const old = new Date(Date.now() - 8 * 24 * 60 * 60_000);
        await prisma.marketingEvent.update({ where: { id: event.id }, data: { failedAt: null, eventTime: old, createdAt: old } });
        await prisma.order.update({ where: { id: order.id }, data: { createdAt: old } });
        await new MetaCapiWorker(prisma, fake).execute();
        expect(sends).toBe(1);
        expect((await prisma.marketingEvent.findUniqueOrThrow({ where: { id: event.id } })).payload).toEqual({});
        expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).marketingAttribution).toEqual({});
    });

});

});
