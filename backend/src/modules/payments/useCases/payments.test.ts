import { describe, expect, it } from "bun:test";
import type { DomPagamentosClient } from "@/shared/infra/domPagamentos";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ConfirmPayment } from "./ConfirmPayment";
import { CreateCardPayment } from "./CreateCardPayment";
import { CreatePixPayment } from "./CreatePixPayment";
import { GetPaymentStatus } from "./GetPaymentStatus";
import { ListSavedCards } from "./ListSavedCards";
import { buildPaymentDescription, resolvePayingCustomer } from "./resolvePayingCustomer";

/** Shapes below mirror only the columns the use cases actually read. */
interface CompanyRow {
	id: string;
	slug: string;
}

interface CustomerRow {
	companyId: string;
	cpf: string | null;
	domId: string | null;
	id: string;
	phone: string | null;
	user: { email: string; id: string; name: string; phoneNumber: string | null };
	userId: string;
}

interface OrderRow {
	cashbackPercent: number;
	customerId: string;
	id: string;
	loyaltyPointsRate: number;
	total: number;
	unitName: string;
}

interface PaymentRow {
	amount: number;
	id: string;
	method: string;
	orderId: string;
	pixContent: string | null;
	pixQrcode: string | null;
	simpayPaymentId: string | null;
	status: string;
	token: string;
}

interface SavedCardRow {
	brand: string;
	cardToken: string;
	createdAt: Date;
	customerId: string;
	expiryMonth: string;
	expiryYear: string;
	holderName: string;
	id: string;
	isDefault: boolean;
	last4: string;
	nickname?: string | null;
}

const baseCompany: CompanyRow = { id: "cmp_1", slug: "zero-grau" };

const baseCustomer: CustomerRow = {
	companyId: "cmp_1",
	cpf: "12345678901",
	domId: null,
	id: "cust_1",
	phone: "5581999999999",
	user: { email: "maria@example.com", id: "user_1", name: "Maria", phoneNumber: "5581988888888" },
	userId: "user_1",
};

const baseOrder: OrderRow = {
	cashbackPercent: 10,
	customerId: "cust_1",
	id: "order_1",
	loyaltyPointsRate: 5,
	total: 5000,
	unitName: "Boa Viagem",
};

interface WorldOptions {
	addresses?: Record<string, unknown>[];
	companies?: CompanyRow[];
	customers?: CustomerRow[];
	orders?: OrderRow[];
	payments?: PaymentRow[];
	savedCards?: SavedCardRow[];
}

/**
 * In-memory Prisma double shared by every payment use case, so charge creation,
 * confirmation and status polling can be exercised against the same state.
 */
function makeWorld(opts: WorldOptions = {}) {
	const addresses = opts.addresses ?? [];
	const companies = opts.companies ?? [baseCompany];
	const customers = opts.customers ?? [structuredClone(baseCustomer)];
	const orders = opts.orders ?? [baseOrder];
	const payments = opts.payments ?? [];
	const savedCards = opts.savedCards ?? [];
	const cashbackLedger: Record<string, unknown>[] = [];
	const loyaltyLedger: Record<string, unknown>[] = [];

	let tokenSeq = 0;

	const paymentDelegate = {
		create: async ({ data }: { data: Record<string, unknown> }) => {
			tokenSeq += 1;
			const payment: PaymentRow = {
				amount: data.amount as number,
				id: `pay_${tokenSeq}`,
				method: data.method as string,
				orderId: data.orderId as string,
				pixContent: (data.pixContent as string) ?? null,
				pixQrcode: (data.pixQrcode as string) ?? null,
				simpayPaymentId: (data.simpayPaymentId as string) ?? null,
				status: "pending",
				token: `token_${tokenSeq}`,
			};
			payments.push(payment);

			return payment;
		},
		findUnique: async ({ where }: { where: { orderId?: string; token?: string } }) =>
			payments.find(
				payment =>
					(where.orderId !== undefined && payment.orderId === where.orderId) ||
					(where.token !== undefined && payment.token === where.token),
			) ?? null,
		update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => {
			const payment = payments.find(row => row.id === where.id);
			if (!payment) throw new Error(`unknown payment ${where.id}`);
			Object.assign(payment, data);

			return payment;
		},
	};

	const orderDelegate = {
		findUnique: async ({ where }: { where: { id: string } }) => {
			const order = orders.find(row => row.id === where.id);

			return order ? { ...order, unit: { name: order.unitName } } : null;
		},
		findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
			const order = orders.find(row => row.id === where.id);
			if (!order) throw new Error(`unknown order ${where.id}`);

			return {
				...order,
				unit: {
					cashbackPercent: order.cashbackPercent,
					loyaltyPointsRate: order.loyaltyPointsRate,
					name: order.unitName,
				},
			};
		},
		update: async () => ({}),
	};

	const tx = {
		cashbackLedger: { create: async ({ data }: { data: Record<string, unknown> }) => cashbackLedger.push(data) },
		loyaltyLedger: { create: async ({ data }: { data: Record<string, unknown> }) => loyaltyLedger.push(data) },
		order: orderDelegate,
		payment: paymentDelegate,
	};

	const prisma = {
		$transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
		address: {
			findFirst: async () => addresses[0] ?? null,
		},
		company: {
			findUnique: async ({ where }: { where: { slug: string } }) =>
				companies.find(company => company.slug === where.slug) ?? null,
		},
		customer: {
			findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
				customers.find(
					customer => customer.companyId === where.companyId && customer.userId === where.userId,
				) ?? null,
			update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => {
				const customer = customers.find(row => row.id === where.id);
				if (customer) Object.assign(customer, data);

				return customer;
			},
		},
		order: orderDelegate,
		payment: paymentDelegate,
		savedCard: {
			count: async ({ where }: { where: { customerId: string } }) =>
				savedCards.filter(card => card.customerId === where.customerId).length,
			create: async ({ data }: { data: Record<string, unknown> }) => {
				const card = { ...data, id: `card_${savedCards.length + 1}` } as unknown as SavedCardRow;
				savedCards.push(card);

				return card;
			},
			findFirst: async ({ where }: { where: { customerId: string; id: string } }) =>
				savedCards.find(card => card.customerId === where.customerId && card.id === where.id) ?? null,
			findMany: async ({ where }: { where: { customerId: string } }) =>
				savedCards
					.filter(card => card.customerId === where.customerId)
					.sort(
						(a, b) =>
							Number(b.isDefault) - Number(a.isDefault) ||
							b.createdAt.getTime() - a.createdAt.getTime(),
					),
		},
	} as unknown as PrismaInstance;

	return { cashbackLedger, customers, loyaltyLedger, payments, prisma, savedCards };
}

const pixSuccess = {
	id: "simpay_1",
	pix_content: "00020126...",
	pix_qrcode: "data:image/png;base64,AAA",
};

function makeSimpay(overrides: Partial<Record<string, unknown>> = {}) {
	const calls: Record<string, unknown[]> = { card: [], pix: [] };

	const simpay = {
		createCardPayment: async (payload: unknown) => {
			calls.card.push(payload);

			return { id: "simpay_card_1" };
		},
		createPixPayment: async (payload: unknown) => {
			calls.pix.push(payload);

			return pixSuccess;
		},
		getPaymentStatus: async () => ({ status: "PENDING" }),
		getPixStatusDirect: async () => ({ status: "PENDING" }),
		...overrides,
	} as unknown as SimpayClient;

	return { calls, simpay };
}

function makeDom(overrides: Partial<Record<string, unknown>> = {}) {
	const calls: Record<string, unknown[]> = { customers: [], tokens: [] };

	const dom = {
		createCardToken: async (domId: string, payload: unknown) => {
			calls.tokens.push({ domId, payload });

			return {
				brand: "visa",
				expiryMonth: "12",
				expiryYear: "2030",
				holderName: "MARIA S",
				last4: "4242",
				token: "424242tok",
			};
		},
		createCustomer: async (payload: unknown) => {
			calls.customers.push(payload);

			return "dom_1";
		},
		...overrides,
	} as unknown as DomPagamentosClient;

	return { calls, dom };
}

describe("buildPaymentDescription", () => {
	it("tags the description with the unit name", () => {
		expect(buildPaymentDescription(baseOrder)).toBe("Pedido Zero Grau [Unidade - Boa Viagem]");
	});
});

describe("resolvePayingCustomer", () => {
	const body = { orderId: "order_1", slug: "zero-grau" };

	it("returns the order, customer and user context", async () => {
		const { prisma } = makeWorld();

		const context = await resolvePayingCustomer(prisma, "user_1", body);

		expect(context.document).toBe("12345678901");
		expect(context.order).toEqual({ id: "order_1", total: 5000, unitName: "Boa Viagem" });
		expect(context.user.email).toBe("maria@example.com");
	});

	it("throws when the order does not exist", async () => {
		const { prisma } = makeWorld();

		await expect(resolvePayingCustomer(prisma, "user_1", { ...body, orderId: "order_9" })).rejects.toThrow(
			"ORDER_NOT_FOUND",
		);
	});

	it("refuses an order that belongs to another customer", async () => {
		const { prisma } = makeWorld({ orders: [{ ...baseOrder, customerId: "cust_2" }] });

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("UNAUTHORIZED_ORDER");
	});

	it("refuses a customer from another company", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, companyId: "cmp_2" }] });

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("UNAUTHORIZED_ORDER");
	});

	it("refuses an unknown company slug", async () => {
		const { prisma } = makeWorld();

		await expect(resolvePayingCustomer(prisma, "user_1", { ...body, slug: "outra" })).rejects.toThrow(
			"UNAUTHORIZED_ORDER",
		);
	});

	it("requires a document when neither the customer nor the body has one", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: null }] });

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("DOCUMENT_REQUIRED");
	});

	it("persists the body CPF when the customer has none", async () => {
		const { customers, prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: null }] });

		const context = await resolvePayingCustomer(prisma, "user_1", { ...body, cpf: "987.654.321-00" });

		expect(context.document).toBe("98765432100");
		expect(customers[0].cpf).toBe("98765432100");
	});

	it("keeps the stored CPF over the one sent in the body", async () => {
		const { customers, prisma } = makeWorld();

		const context = await resolvePayingCustomer(prisma, "user_1", { ...body, cpf: "987.654.321-00" });

		expect(context.document).toBe("12345678901");
		expect(customers[0].cpf).toBe("12345678901");
	});
});

describe("CreatePixPayment", () => {
	const body = { orderId: "order_1", slug: "zero-grau" };

	it("creates the charge and returns the QR code", async () => {
		const { payments, prisma } = makeWorld();
		const { calls, simpay } = makeSimpay();

		const result = await new CreatePixPayment(prisma, simpay).execute("user_1", body);

		expect(result).toMatchObject({
			amount: 5000,
			pixContent: pixSuccess.pix_content,
			pixQrcode: pixSuccess.pix_qrcode,
		});
		expect(payments).toHaveLength(1);
		expect(calls.pix[0]).toMatchObject({
			description: "Pedido Zero Grau [Unidade - Boa Viagem]",
			document: "12345678901",
			document_type: "CPF",
			price: 50,
		});
	});

	it("sends the amount to the gateway in reais, not cents", async () => {
		const { prisma } = makeWorld({ orders: [{ ...baseOrder, total: 12345 }] });
		const { calls, simpay } = makeSimpay();

		await new CreatePixPayment(prisma, simpay).execute("user_1", body);

		expect((calls.pix[0] as { price: number }).price).toBe(123.45);
	});

	it("labels a 14-digit document as CNPJ", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: "12345678000199" }] });
		const { calls, simpay } = makeSimpay();

		await new CreatePixPayment(prisma, simpay).execute("user_1", body);

		expect((calls.pix[0] as { document_type: string }).document_type).toBe("CNPJ");
	});

	it("reuses a pending PIX charge instead of creating a duplicate", async () => {
		const existing: PaymentRow = {
			amount: 5000,
			id: "pay_1",
			method: "pix",
			orderId: "order_1",
			pixContent: "existing-content",
			pixQrcode: "existing-qrcode",
			simpayPaymentId: "simpay_1",
			status: "pending",
			token: "token_existing",
		};
		const { payments, prisma } = makeWorld({ payments: [existing] });
		const { calls, simpay } = makeSimpay();

		const result = await new CreatePixPayment(prisma, simpay).execute("user_1", body);

		expect(result.token).toBe("token_existing");
		expect(calls.pix).toHaveLength(0);
		expect(payments).toHaveLength(1);
	});

	it("re-charges over a failed payment row instead of inserting a new one", async () => {
		const existing: PaymentRow = {
			amount: 5000,
			id: "pay_1",
			method: "pix",
			orderId: "order_1",
			pixContent: null,
			pixQrcode: null,
			simpayPaymentId: null,
			status: "failed",
			token: "token_existing",
		};
		const { payments, prisma } = makeWorld({ payments: [existing] });
		const { simpay } = makeSimpay();

		const result = await new CreatePixPayment(prisma, simpay).execute("user_1", body);

		expect(payments).toHaveLength(1);
		expect(payments[0].status).toBe("pending");
		expect(result.token).toBe("token_existing");
	});

	it("falls back to the QR code URL when the image is missing", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createPixPayment: async () => ({
				id: "simpay_1",
				pix_content: "00020126...",
				pix_qrcode: "",
				pix_qrcode_url: "https://gateway/qr.png",
			}),
		});

		expect((await new CreatePixPayment(prisma, simpay).execute("user_1", body)).pixQrcode).toBe(
			"https://gateway/qr.png",
		);
	});

	it("surfaces a document rejection as INVALID_DOCUMENT", async () => {
		const { payments, prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createPixPayment: async () => ({ internal_msg: "CPF inválido", pix_content: "", pix_qrcode: "" }),
		});

		await expect(new CreatePixPayment(prisma, simpay).execute("user_1", body)).rejects.toThrow(
			"INVALID_DOCUMENT",
		);
		expect(payments).toHaveLength(0);
	});

	it("surfaces any other empty QR response as PIX_FAILED", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createPixPayment: async () => ({ message: "gateway offline", pix_content: "", pix_qrcode: "" }),
		});

		await expect(new CreatePixPayment(prisma, simpay).execute("user_1", body)).rejects.toThrow("PIX_FAILED");
	});

	it("does not charge for an order of another customer", async () => {
		const { prisma } = makeWorld({ orders: [{ ...baseOrder, customerId: "cust_2" }] });
		const { calls, simpay } = makeSimpay();

		await expect(new CreatePixPayment(prisma, simpay).execute("user_1", body)).rejects.toThrow(
			"UNAUTHORIZED_ORDER",
		);
		expect(calls.pix).toHaveLength(0);
	});
});

describe("ConfirmPayment", () => {
	function makePending() {
		return makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_1",
					status: "pending",
					token: "token_1",
				},
			],
		});
	}

	it("confirms the payment and accrues cashback and points", async () => {
		const { cashbackLedger, loyaltyLedger, payments, prisma } = makePending();

		await new ConfirmPayment(prisma).execute("token_1");

		expect(payments[0].status).toBe("confirmed");
		expect(cashbackLedger[0]).toMatchObject({ amount: 500, customerId: "cust_1", type: "accrual" });
		expect(loyaltyLedger[0]).toMatchObject({ amount: 250, customerId: "cust_1", type: "earn" });
	});

	it("floors fractional cashback and points", async () => {
		const { cashbackLedger, loyaltyLedger, prisma } = makeWorld({
			orders: [{ ...baseOrder, cashbackPercent: 7, loyaltyPointsRate: 3, total: 999 }],
			payments: [
				{
					amount: 999,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_1",
					status: "pending",
					token: "token_1",
				},
			],
		});

		await new ConfirmPayment(prisma).execute("token_1");

		expect(cashbackLedger[0]).toMatchObject({ amount: 69 });
		expect(loyaltyLedger[0]).toMatchObject({ amount: 29 });
	});

	it("skips the ledgers when the unit grants no rewards", async () => {
		const { cashbackLedger, loyaltyLedger, prisma } = makeWorld({
			orders: [{ ...baseOrder, cashbackPercent: 0, loyaltyPointsRate: 0 }],
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_1",
					status: "pending",
					token: "token_1",
				},
			],
		});

		await new ConfirmPayment(prisma).execute("token_1");

		expect(cashbackLedger).toHaveLength(0);
		expect(loyaltyLedger).toHaveLength(0);
	});

	it("throws for an unknown token", async () => {
		const { prisma } = makePending();

		await expect(new ConfirmPayment(prisma).execute("token_9")).rejects.toThrow("PAYMENT_NOT_FOUND");
	});

	it("does not confirm and accrue twice", async () => {
		const { cashbackLedger, prisma } = makePending();

		await new ConfirmPayment(prisma).execute("token_1");

		await expect(new ConfirmPayment(prisma).execute("token_1")).rejects.toThrow("PAYMENT_ALREADY_CONFIRMED");
		expect(cashbackLedger).toHaveLength(1);
	});
});

describe("GetPaymentStatus", () => {
	function makePending() {
		return makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_1",
					status: "pending",
					token: "token_1",
				},
			],
		});
	}

	it("throws for an unknown token", async () => {
		const { prisma } = makePending();
		const { simpay } = makeSimpay();

		await expect(new GetPaymentStatus(prisma, simpay).execute("token_9")).rejects.toThrow("PAYMENT_NOT_FOUND");
	});

	it("returns the stored status without polling when already confirmed", async () => {
		const { prisma } = makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_1",
					status: "confirmed",
					token: "token_1",
				},
			],
		});
		const { simpay } = makeSimpay({
			getPixStatusDirect: async () => {
				throw new Error("should not poll");
			},
		});

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "confirmed" });
	});

	it("stays pending while the gateway has not settled", async () => {
		const { cashbackLedger, prisma } = makePending();
		const { simpay } = makeSimpay();

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "pending" });
		expect(cashbackLedger).toHaveLength(0);
	});

	it("confirms when the direct DOM check reports approval", async () => {
		const { cashbackLedger, payments, prisma } = makePending();
		const { simpay } = makeSimpay({ getPixStatusDirect: async () => ({ status: "APPROVED" }) });

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "confirmed" });
		expect(payments[0].status).toBe("confirmed");
		expect(cashbackLedger).toHaveLength(1);
	});

	it("falls back to the Simpay status when the direct check is inconclusive", async () => {
		const { payments, prisma } = makePending();
		const { simpay } = makeSimpay({ getPaymentStatus: async () => ({ status: "PAID" }) });

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "confirmed" });
		expect(payments[0].status).toBe("confirmed");
	});

	it("stays pending when the fallback status service throws", async () => {
		const { prisma } = makePending();
		const { simpay } = makeSimpay({
			getPaymentStatus: async () => {
				throw new Error("status service down");
			},
		});

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "pending" });
	});

	it("cannot poll a pending payment that never reached the gateway", async () => {
		const { prisma } = makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: null,
					status: "pending",
					token: "token_1",
				},
			],
		});
		const { simpay } = makeSimpay({
			getPixStatusDirect: async () => {
				throw new Error("should not poll");
			},
		});

		expect(await new GetPaymentStatus(prisma, simpay).execute("token_1")).toEqual({ status: "pending" });
	});
});

describe("ListSavedCards", () => {
	function makeCard(overrides: Partial<SavedCardRow> = {}): SavedCardRow {
		return {
			brand: "visa",
			cardToken: "tok_1",
			createdAt: new Date("2026-01-01T00:00:00Z"),
			customerId: "cust_1",
			expiryMonth: "12",
			expiryYear: "2030",
			holderName: "MARIA S",
			id: "card_1",
			isDefault: false,
			last4: "4242",
			nickname: null,
			...overrides,
		};
	}

	it("returns the customer's cards without exposing the gateway token", async () => {
		const { prisma } = makeWorld({ savedCards: [makeCard()] });

		const result = await new ListSavedCards(prisma).execute("user_1", "zero-grau");

		expect(result).toEqual([
			{
				brand: "visa",
				expiryMonth: "12",
				expiryYear: "2030",
				holderName: "MARIA S",
				id: "card_1",
				isDefault: false,
				last4: "4242",
				nickname: null,
			},
		]);
	});

	it("puts the default card first", async () => {
		const { prisma } = makeWorld({
			savedCards: [
				makeCard(),
				makeCard({ id: "card_2", isDefault: true, last4: "1111" }),
			],
		});

		expect((await new ListSavedCards(prisma).execute("user_1", "zero-grau")).map(card => card.id)).toEqual([
			"card_2",
			"card_1",
		]);
	});

	it("returns nothing for an unknown company", async () => {
		const { prisma } = makeWorld({ savedCards: [makeCard()] });

		expect(await new ListSavedCards(prisma).execute("user_1", "outra")).toEqual([]);
	});

	it("returns nothing when the user has no customer in that company", async () => {
		const { prisma } = makeWorld({ savedCards: [makeCard()] });

		expect(await new ListSavedCards(prisma).execute("user_9", "zero-grau")).toEqual([]);
	});

	it("does not list another customer's cards", async () => {
		const { prisma } = makeWorld({ savedCards: [makeCard({ customerId: "cust_2" })] });

		expect(await new ListSavedCards(prisma).execute("user_1", "zero-grau")).toEqual([]);
	});
});

describe("CreateCardPayment", () => {
	const card = { cvv: "123", expMonth: 12, expYear: 2030, holderName: "MARIA S", number: "4242 4242 4242 4242" };
	const body = { card, orderId: "order_1", slug: "zero-grau" };

	it("tokenizes a new card, charges it and confirms right away", async () => {
		const { cashbackLedger, payments, prisma } = makeWorld();
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		const result = await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect(result).toMatchObject({ status: "confirmed" });
		expect(payments[0]).toMatchObject({ method: "credit_card", status: "confirmed" });
		expect(calls.card[0]).toMatchObject({ brand: "visa", installments: 1, price: 50, token: "424242tok" });
		expect(cashbackLedger).toHaveLength(1);
	});

	it("strips card number formatting before tokenizing", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect((calls.tokens[0] as { payload: { number: string } }).payload.number).toBe("4242424242424242");
	});

	it("creates a DOM customer once and reuses the stored id", async () => {
		const { customers, prisma } = makeWorld();
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect(calls.customers).toHaveLength(1);
		expect(customers[0].domId).toBe("dom_1");
	});

	it("skips DOM customer creation when the customer already has one", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, domId: "dom_existing" }] });
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect(calls.customers).toHaveLength(0);
		expect((calls.tokens[0] as { domId: string }).domId).toBe("dom_existing");
	});

	it("saves the card and marks the first one as default", async () => {
		const { prisma, savedCards } = makeWorld();
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", {
			...body,
			cardNickname: "Cartão pessoal",
			saveCard: true,
		});

		expect(savedCards).toHaveLength(1);
		expect(savedCards[0]).toMatchObject({ isDefault: true, last4: "4242", nickname: "Cartão pessoal" });
	});

	it("does not mark a later saved card as default", async () => {
		const existing: SavedCardRow = {
			brand: "visa",
			cardToken: "tok_0",
			createdAt: new Date("2026-01-01T00:00:00Z"),
			customerId: "cust_1",
			expiryMonth: "01",
			expiryYear: "2029",
			holderName: "MARIA S",
			id: "card_0",
			isDefault: true,
			last4: "1111",
		};
		const { prisma, savedCards } = makeWorld({ savedCards: [existing] });
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", { ...body, saveCard: true });

		expect(savedCards[1]).toMatchObject({ isDefault: false });
	});

	it("does not save the card unless asked to", async () => {
		const { prisma, savedCards } = makeWorld();
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect(savedCards).toHaveLength(0);
	});

	it("charges a saved card without tokenizing again", async () => {
		const saved: SavedCardRow = {
			brand: "mastercard",
			cardToken: "tok_saved",
			createdAt: new Date("2026-01-01T00:00:00Z"),
			customerId: "cust_1",
			expiryMonth: "12",
			expiryYear: "2030",
			holderName: "MARIA SILVA",
			id: "card_1",
			isDefault: true,
			last4: "5555",
		};
		const { prisma } = makeWorld({ savedCards: [saved] });
		const { calls, simpay } = makeSimpay();
		const { calls: domCalls, dom } = makeDom();

		const result = await new CreateCardPayment(prisma, simpay, dom).execute("user_1", {
			orderId: "order_1",
			savedCardId: "card_1",
			slug: "zero-grau",
		});

		expect(result.status).toBe("confirmed");
		expect(domCalls.tokens).toHaveLength(0);
		expect(calls.card[0]).toMatchObject({ brand: "mastercard", holder_name: "MARIA SILVA", token: "tok_saved" });
	});

	it("refuses a saved card that belongs to someone else", async () => {
		const { prisma } = makeWorld({
			savedCards: [
				{
					brand: "visa",
					cardToken: "tok_x",
					createdAt: new Date("2026-01-01T00:00:00Z"),
					customerId: "cust_2",
					expiryMonth: "12",
					expiryYear: "2030",
					holderName: "OUTRO",
					id: "card_1",
					isDefault: true,
					last4: "9999",
				},
			],
		});
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(
			new CreateCardPayment(prisma, simpay, dom).execute("user_1", {
				orderId: "order_1",
				savedCardId: "card_1",
				slug: "zero-grau",
			}),
		).rejects.toThrow("SAVED_CARD_NOT_FOUND");
	});

	it("requires either a card or a saved card", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(
			new CreateCardPayment(prisma, simpay, dom).execute("user_1", { orderId: "order_1", slug: "zero-grau" }),
		).rejects.toThrow("CARD_REQUIRED");
	});

	it("refuses to charge an already confirmed order", async () => {
		const { prisma } = makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "credit_card",
					orderId: "order_1",
					pixContent: null,
					pixQrcode: null,
					simpayPaymentId: "simpay_1",
					status: "confirmed",
					token: "token_1",
				},
			],
		});
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(new CreateCardPayment(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"PAYMENT_ALREADY_CONFIRMED",
		);
		expect(calls.card).toHaveLength(0);
	});

	it("reuses the pending PIX row when the customer switches to card", async () => {
		const { payments, prisma } = makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method: "pix",
					orderId: "order_1",
					pixContent: "c",
					pixQrcode: "q",
					simpayPaymentId: "simpay_pix",
					status: "pending",
					token: "token_1",
				},
			],
		});
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await new CreateCardPayment(prisma, simpay, dom).execute("user_1", body);

		expect(payments).toHaveLength(1);
		expect(payments[0]).toMatchObject({ method: "credit_card", pixQrcode: null, status: "confirmed" });
	});

	it("maps a gateway rejection to CARD_DECLINED", async () => {
		const { payments, prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createCardPayment: async () => {
				throw new Error("declined");
			},
		});
		const { dom } = makeDom();

		await expect(new CreateCardPayment(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"CARD_DECLINED",
		);
		expect(payments).toHaveLength(0);
	});

	it("requires a document", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: null }] });
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(new CreateCardPayment(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"DOCUMENT_REQUIRED",
		);
	});

	it("does not charge an order belonging to another customer", async () => {
		const { prisma } = makeWorld({ orders: [{ ...baseOrder, customerId: "cust_2" }] });
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(new CreateCardPayment(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"UNAUTHORIZED_ORDER",
		);
		expect(calls.card).toHaveLength(0);
	});
});
