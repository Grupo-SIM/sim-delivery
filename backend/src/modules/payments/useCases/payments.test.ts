import { beforeEach, describe, expect, it, mock } from "bun:test";
interface DomPagamentosClient {
 createCustomer(payload: unknown): Promise<string>;
 createCardToken(id: string, payload: unknown): Promise<{ brand: string; expiryMonth: string; expiryYear: string; holderName: string; last4: string; token: string }>;
}
import { PaymentProviderError } from "@/shared/infra/paymentProviderError";
import type { SimpayClient } from "@/shared/infra/simpay";
import type { PrismaInstance } from "@/shared/infra/sql";
import { ApplySimpayPaymentStatus } from "./ApplySimpayPaymentStatus";
import { ConfirmPayment } from "./ConfirmPayment";
import { CreateCardPayment } from "./CreateCardPayment";
import { CreatePixPayment } from "./CreatePixPayment";
import { DeleteSavedCard } from "./DeleteSavedCard";
import { GetPaymentStatus } from "./GetPaymentStatus";
import { ListSavedCards } from "./ListSavedCards";
import { ReconcilePendingPayments } from "./ReconcilePendingPayments";
import { buildPaymentDescription, resolvePayingCustomer } from "./resolvePayingCustomer";

/** Shapes below mirror only the columns the use cases actually read. */
interface CompanyRow {
	name?: string;
	cnpj?: string;
	id: string;
	slug: string;
}

interface CustomerRow {
	companyId: string;
	cpf: string | null;
	domId: string | null;
	id: string;
	notificationEmail?: boolean;
	phone: string | null;
	user: { email: string; id: string; name: string; phoneNumber: string | null };
	userId: string;
}

interface OrderRow {
	deliveryFee?: number;
	cashbackPercent: number;
	customerId: string;
	displayNumber: number;
	feeTotalCents?: number;
	id: string;
	loyaltyPointsRate: number;
	status?: string;
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
	bin?: string | null;
	brand: string;
	cardToken: string;
	createdAt: Date;
	customerId: string;
	expiryMonth: string;
	expiryYear: string;
	holderName: string;
	holderDocument?: string | null;
	id: string;
	isDefault: boolean;
	last4: string;
	nickname?: string | null;
}

const baseCompany: CompanyRow = { cnpj: "10802530000107", id: "cmp_1", slug: "zero-grau", name: "Zero Grau" };

const baseCustomer: CustomerRow = {
	companyId: "cmp_1",
	cpf: "52998224725",
	domId: null,
	id: "cust_1",
	notificationEmail: false,
	phone: "5581999999999",
	user: { email: "maria@example.com", id: "user_1", name: "Maria Silva", phoneNumber: "5581988888888" },
	userId: "user_1",
};

const baseOrder: OrderRow = {
	cashbackPercent: 10,
	customerId: "cust_1",
	displayNumber: 154,
	id: "order_1",
	loyaltyPointsRate: 5,
	status: "awaiting_payment",
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
	const orders = opts.orders ?? [structuredClone(baseOrder)];
	const payments = opts.payments ?? [];
	const savedCards: SavedCardRow[] = (opts.savedCards ?? []).map(card => ({ bin: "424242", ...card }));
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
		findFirst: async ({ where }: { where: { order?: { customer: { userId: string } }; simpayPaymentId?: string; token?: string } }) =>
			payments.find(payment => {
				if (where.simpayPaymentId !== undefined) return payment.simpayPaymentId === where.simpayPaymentId;
				if (payment.token !== where.token || !where.order) return false;
				const order = orders.find(candidate => candidate.id === payment.orderId);
				const customer = customers.find(candidate => candidate.id === order?.customerId);
				return customer?.userId === where.order.customer.userId;
			}) ?? null,
		findMany: async ({ where }: { where: { method: { in: string[] }; order?: { companyId?: string } } }) =>
			payments
				.filter(payment => {
					const order = orders.find(candidate => candidate.id === payment.orderId);
					const orderCompanyId = customers.find(candidate => candidate.id === order?.customerId)?.companyId;
					return (
						(!where.order?.companyId || orderCompanyId === where.order.companyId) &&
						where.method.in.includes(payment.method) &&
						payment.status === "pending" &&
						payment.simpayPaymentId !== null &&
						order?.status === "awaiting_payment"
					);
				})
				.map(payment => {
					const order = orders.find(candidate => candidate.id === payment.orderId);
					const customer = customers.find(candidate => candidate.id === order?.customerId);
					const company = companies.find(candidate => candidate.id === customer?.companyId);
					return { method: payment.method, order: { company }, simpayPaymentId: payment.simpayPaymentId };
				}),
		update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => {
			const payment = payments.find(row => row.id === where.id);
			if (!payment) throw new Error(`unknown payment ${where.id}`);
			Object.assign(payment, data);

			return payment;
		},
		updateMany: async ({
			data,
			where,
		}: {
			data: Record<string, unknown>;
			where: { id: string; status: string };
		}) => {
			const payment = payments.find(row => row.id === where.id && row.status === where.status);
			if (!payment) return { count: 0 };
			Object.assign(payment, data);
			return { count: 1 };
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
			const customer = customers.find(row => row.id === order.customerId);

			return {
				...order,
				company: {
					orderStatusWhatsAppTemplates: null,
					whatsAppConnection: { connectedPhone: "+5581999999999", sessionName: "company-session" },
				},
				customer,
				unit: {
					cashbackPercent: order.cashbackPercent,
					loyaltyPointsRate: order.loyaltyPointsRate,
					name: order.unitName,
					whatsAppConnection: { connectedPhone: "+5581999999999", sessionName: "unit-session" },
				},
			};
		},
		update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
			const order = orders.find(row => row.id === where.id);
			if (!order) throw new Error(`unknown order ${where.id}`);
			Object.assign(order, data);
			return order;
		},
	};

	const tx = {
		cashbackLedger: {
			create: async ({ data }: { data: Record<string, unknown> }) => cashbackLedger.push(data),
		},
		loyaltyLedger: {
			create: async ({ data }: { data: Record<string, unknown> }) => loyaltyLedger.push(data),
		},
		order: orderDelegate,
		payment: paymentDelegate,
		whatsAppNotification: { upsert: async () => ({}) },
	};

	const attempts: any[] = [];
	const prisma = {
		paymentAttempt: {
			findFirst: async ({ where }: any) => attempts.find(row => row.orderId === where.orderId && where.state.in.includes(row.state)) ?? null,
			findMany: async () => [],
			create: async ({ data }: any) => { const row = { id: `attempt_${attempts.length + 1}`, state: "preparing", ...data }; attempts.push(row); return row; },
			update: async ({ where, data }: any) => { const row = attempts.find(row => row.id === where.id); Object.assign(row, data); return row; },
			findUniqueOrThrow: async ({ where }: any) => attempts.find(row => row.id === where.id),
		},
		simpayWebhookInbox: { findMany: async () => [] },
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
				const card = {
					...data,
					createdAt: new Date(),
					id: `card_${savedCards.length + 1}`,
				} as unknown as SavedCardRow;
				savedCards.push(card);

				return card;
			},
			delete: async ({ where }: { where: { id: string } }) => {
				const index = savedCards.findIndex(card => card.id === where.id);
				if (index < 0) throw new Error(`unknown card ${where.id}`);
				return savedCards.splice(index, 1)[0];
			},
			findFirst: async ({ where }: { where: { customerId: string; id?: string } }) =>
				savedCards
					.filter(card => card.customerId === where.customerId && (!where.id || card.id === where.id))
					.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
			findMany: async ({ where }: { where: { customerId: string } }) =>
				savedCards
					.filter(card => card.customerId === where.customerId)
					.sort(
						(a, b) =>
							Number(b.isDefault) - Number(a.isDefault) || b.createdAt.getTime() - a.createdAt.getTime(),
						),
			update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => {
				const card = savedCards.find(row => row.id === where.id);
				if (!card) throw new Error(`unknown card ${where.id}`);
				Object.assign(card, data);
				return card;
			},
		},
	} as unknown as PrismaInstance;

	return { cashbackLedger, customers, loyaltyLedger, orders, payments, prisma, savedCards };
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

			return { id: "simpay_card_1", paymentId: "simpay_card_1", transactionId: "transaction_card_1", status: "COMPLETED" };
		},
		createPixPayment: async (payload: unknown) => {
			calls.pix.push(payload);

			return { ...pixSuccess, paymentId: "simpay_1", transactionId: "transaction_pix_1" };
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

function cardUseCase(prisma: PrismaInstance, client: SimpayClient, dom: DomPagamentosClient) {
 const simpay = Object.assign(Object.create(client), {
  createCustomer: async (_scope: unknown, input: any) => ({ id: await dom.createCustomer({ ...input, codeExternal: input.externalCustomerId, mobilePhone: input.phone }) }),
  tokenizeCard: async (_scope: unknown, customerId: string, card: any) => ({ ...await dom.createCardToken(customerId, { number: card.number, cvv: card.cvv, exp_month: card.expMonth, exp_year: card.expYear, holder_name: card.holderName, holder_document: card.holderDocument }), bin: card.number.slice(0, 6), customerId }),
 });
 return new CreateCardPayment(prisma, simpay);
}

describe("buildPaymentDescription", () => {
	it("uses the company and unit names without technical tags", () => {
		expect(buildPaymentDescription({ companyName: "Zero Grau", unitName: "Tucumã" })).toBe("Pedido Zero Grau - Tucumã");
		expect(buildPaymentDescription({ companyName: "Outra Empresa", unitName: "Centro" })).toBe("Pedido Outra Empresa - Centro");
	});
});

describe("resolvePayingCustomer", () => {
	const body = { orderId: "order_1", slug: "zero-grau" };

	it("returns the order, customer and user context", async () => {
		const { prisma } = makeWorld();

		const context = await resolvePayingCustomer(prisma, "user_1", body);

		expect(context.document).toBe("52998224725");
		expect(context.order).toEqual({ companyName: "Zero Grau", deliveryFee: 0, feeMode: "ADDITIVE_ONLY", feeTotalCents: 0, id: "order_1", total: 5000, unitName: "Boa Viagem" });
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

	it("requires a full customer name before payment", async () => {
		const { prisma } = makeWorld({
			customers: [{ ...baseCustomer, user: { ...baseCustomer.user, name: "Cliente" } }],
		});

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("NAME_REQUIRED");
	});

	it("requires a Brazilian mobile number before payment", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, phone: null }] });

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("PHONE_REQUIRED");
	});

	it("persists the body CPF when the customer has none", async () => {
		const { customers, prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: null }] });

		const context = await resolvePayingCustomer(prisma, "user_1", { ...body, cpf: "111.444.777-35" });

		expect(context.document).toBe("11144477735");
		expect(customers[0].cpf).toBe("11144477735");
	});

	it("keeps the stored CPF over the one sent in the body", async () => {
		const { customers, prisma } = makeWorld();

		const context = await resolvePayingCustomer(prisma, "user_1", { ...body, cpf: "111.444.777-35" });

		expect(context.document).toBe("52998224725");
		expect(customers[0].cpf).toBe("52998224725");
	});

	it("rejects an invalid CPF before calling the payment gateway", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: "70267787497" }] });

		await expect(resolvePayingCustomer(prisma, "user_1", body)).rejects.toThrow("INVALID_DOCUMENT");
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
		expect(payments[0]).toMatchObject({ orderId: "order_1", simpayPaymentId: "simpay_1" });
		expect(await prisma.paymentAttempt.findFirst({ where: { orderId: "order_1", state: { in: ["pending"] } } })).toMatchObject({ orderId: "order_1", providerPaymentId: "simpay_1", providerTransactionId: "transaction_pix_1" });
		expect(calls.pix[0]).toMatchObject({
			description: "Pedido Zero Grau - Boa Viagem",
			document: "52998224725",
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

	it("allows PIX retry or card after a definitive PIX request rejection", async () => {
		for (const status of [400, 422]) {
			for (const method of ["pix", "card"]) {
				const { prisma } = makeWorld();
				const rejected = makeSimpay({ createPixPayment: async () => { throw new PaymentProviderError("Simpay", "Contrato inválido", status); } });
				await expect(new CreatePixPayment(prisma, rejected.simpay).execute("user_1", body)).rejects.toMatchObject({ message: "PIX_FAILED", description: "Contrato inválido" });
				const { calls, simpay } = makeSimpay();
				if (method === "pix") {
					await new CreatePixPayment(prisma, simpay).execute("user_1", body);
				} else {
					await cardUseCase(prisma, simpay, makeDom().dom).execute("user_1", {
						...body, holderCpf: "11144477735",
						card: { cvv: "123", expMonth: 12, expYear: 2030, holderName: "MARIA SILVA", number: "4242424242424242" },
					});
				}
				expect(calls[method]).toHaveLength(1);
			}
		}
	});

	it("keeps uncertain PIX outcomes locked against retries and card switching", async () => {
		for (const error of [new Error("timeout"), new PaymentProviderError("Simpay", "Gateway indisponível", 503), new PaymentProviderError("Simpay", "Em processamento", 409)]) {
			const { prisma } = makeWorld();
			const { simpay } = makeSimpay({ createPixPayment: async () => { throw error; } });
			await expect(new CreatePixPayment(prisma, simpay).execute("user_1", body)).rejects.toThrow("PAYMENT_PROCESSING");
			const active = await prisma.paymentAttempt.findFirst({ where: { orderId: body.orderId, state: { in: ["submitting"] } } });
			expect(active).not.toBeNull();
			const next = makeSimpay({ getPaymentAttempt: async () => { throw new Error("timeout"); } });
			await expect(new CreatePixPayment(prisma, next.simpay).execute("user_1", body)).rejects.toThrow("PAYMENT_PROCESSING");
			await expect(cardUseCase(prisma, next.simpay, makeDom().dom).execute("user_1", { ...body })).rejects.toThrow("PAYMENT_PROCESSING");
			expect(next.calls.pix).toHaveLength(0);
			expect(next.calls.card).toHaveLength(0);
		}
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

	it("notifies email and WhatsApp when the order is received", async () => {
		const sent: Record<string, string | number>[] = [];
		const whatsAppSent: unknown[][] = [];
		const { prisma } = makeWorld({
			customers: [{ ...baseCustomer, notificationEmail: true }],
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

		await new ConfirmPayment(
			prisma,
			{ send: async input => void sent.push(input) },
			{ sendMessage: async (...input: unknown[]) => void whatsAppSent.push(input) },
		).execute("token_1");

		expect(sent).toEqual([
			{
				message: "Recebemos seu pedido #154 e ele já entrou na fila de preparo.",
				orderId: "order_1",
				orderNumber: 154,
				status: "recebido",
				subtitle: "Acompanhe seu pedido",
				title: "Atualização do pedido #154",
				to: "maria@example.com",
			},
		]);
		expect(whatsAppSent).toEqual([
			[
				"5581999999999",
				{
					attachments: [],
					text: "Recebemos seu pedido #154 e ele já entrou na fila de preparo.",
				},
				"unit-session",
			],
		]);
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

	it("does not award cashback or loyalty over platform fees", async () => {
		const { cashbackLedger, loyaltyLedger, prisma } = makeWorld({
			orders: [{ ...baseOrder, feeTotalCents: 1000, total: 6000 }],
			payments: [{ amount: 6000, id: "pay_1", method: "pix", orderId: "order_1", pixContent: "c", pixQrcode: "q", simpayPaymentId: "simpay_1", status: "pending", token: "token_1" }],
		});

		await new ConfirmPayment(prisma).execute("token_1");

		expect(cashbackLedger[0]).toMatchObject({ amount: 500 });
		expect(loyaltyLedger[0]).toMatchObject({ amount: 250 });
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

	it("ignores a duplicate webhook without accruing twice", async () => {
		const { cashbackLedger, prisma } = makePending();

		expect(await new ConfirmPayment(prisma).execute("token_1")).toBe(true);

		expect(await new ConfirmPayment(prisma).execute("token_1")).toBe(false);
		expect(cashbackLedger).toHaveLength(1);
	});
});

describe("GetPaymentStatus", () => {
	it("reads persisted pending status for SSE without waiting for the gateway", async () => {
		const { prisma } = makeWorld({ payments: [{ amount: 5000, id: "pay_1", method: "pix", orderId: "order_1", pixContent: "c", pixQrcode: "q", simpayPaymentId: "simpay_1", status: "pending", token: "token_1" }] });
		const getPixStatusDirect = mock(async () => { throw new Error("must not call remote"); });
		const { simpay } = makeSimpay({ getPixStatusDirect });
		expect(await new GetPaymentStatus(prisma, simpay).execute("user_1", "token_1", false)).toEqual({ status: "pending" });
		expect(getPixStatusDirect).not.toHaveBeenCalled();
	});

	function makePending(method = "pix") {
		return makeWorld({
			payments: [
				{
					amount: 5000,
					id: "pay_1",
					method,
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

	it("returns the persisted status for its owner", async () => {
		const { prisma } = makePending();
		const { simpay } = makeSimpay();

		expect(await new GetPaymentStatus(prisma, simpay).execute("user_1", "token_1")).toEqual({
			status: "pending",
		});
	});

	it("returns a confirmed persisted status without calling the gateway", async () => {
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
				throw new Error("must not call gateway");
			},
		});
		expect(await new GetPaymentStatus(prisma, simpay).execute("user_1", "token_1")).toEqual({
			status: "confirmed",
		});
	});

	it("confirms a card only after Simpay reports approval", async () => {
		const { cashbackLedger, payments, prisma } = makePending("credit_card");
		const { simpay } = makeSimpay({ getPaymentStatus: async () => ({ status: "COMPLETED" }) });

		expect(await new GetPaymentStatus(prisma, simpay).execute("user_1", "token_1")).toEqual({
			status: "confirmed",
		});
		expect(payments[0]?.status).toBe("confirmed");
		expect(cashbackLedger).toHaveLength(1);
	});

	it("marks a card as failed when Simpay reports a terminal rejection", async () => {
		const { payments, prisma } = makePending("credit_card");
		const { simpay } = makeSimpay({ getPaymentStatus: async () => ({ status: "FAILED" }) });

		expect(await new GetPaymentStatus(prisma, simpay).execute("user_1", "token_1")).toEqual({
			status: "failed",
		});
		expect(payments[0]?.status).toBe("failed");
	});

	it("does not disclose a payment to another user", async () => {
		const { prisma } = makePending();
		const { simpay } = makeSimpay();

		await expect(new GetPaymentStatus(prisma, simpay).execute("user_2", "token_1")).rejects.toThrow(
			"PAYMENT_NOT_FOUND",
		);
	});

	it("does not expose an unknown token", async () => {
		const { prisma } = makePending();
		const { simpay } = makeSimpay();

		await expect(new GetPaymentStatus(prisma, simpay).execute("user_1", "token_9")).rejects.toThrow(
			"PAYMENT_NOT_FOUND",
		);
	});
});

describe("ApplySimpayPaymentStatus", () => {
	it("confirms a payment from its Simpay payment id", async () => {
		const { payments, prisma } = makeWorld({
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

		const result = await new ApplySimpayPaymentStatus(prisma).execute("simpay_1", "COMPLETED");

		expect(result).toEqual({ found: true, status: "confirmed" });
		expect(payments[0]?.status).toBe("confirmed");
	});

	it("acknowledges an unknown payment without changing state", async () => {
		const { prisma } = makeWorld();

		expect(await new ApplySimpayPaymentStatus(prisma).execute("missing", "COMPLETED")).toEqual({
			found: false,
			status: "not_found",
		});
	});
});

describe("ReconcilePendingPayments", () => {
	beforeEach(() => {
		process.env.COMPANY_SLUG = baseCompany.slug;
	});

	it("ignores payments from other companies and does nothing without a company slug", async () => {
		const { payments, prisma } = makeWorld({
			payments: [{ amount: 5000, id: "pay_1", method: "credit_card", orderId: "order_1", pixContent: null, pixQrcode: null, simpayPaymentId: "simpay_1", status: "pending", token: "token_1" }],
		});
		const getPaymentStatus = mock(async () => ({ status: "COMPLETED" }));
		const { simpay } = makeSimpay({ getPaymentStatus });

		process.env.COMPANY_SLUG = "other-company";
		expect(await new ReconcilePendingPayments(prisma, simpay).execute()).toBe(0);
		process.env.COMPANY_SLUG = "";
		expect(await new ReconcilePendingPayments(prisma, simpay).execute()).toBe(0);

		expect(getPaymentStatus).not.toHaveBeenCalled();
		expect(payments[0]?.status).toBe("pending");
	});

	it("confirms an asynchronous card without an open checkout", async () => {
		const { payments, prisma, orders, cashbackLedger } = makeWorld({
			companies: [{ ...baseCompany, cnpj: "10802530000107" }],
			payments: [{ amount: 5000, id: "pay_1", method: "credit_card", orderId: "order_1", pixContent: null, pixQrcode: null, simpayPaymentId: "simpay_1", status: "pending", token: "token_1" }],
		});
		const getPaymentStatus = mock(async () => ({ status: "COMPLETED" }));
		const getPixStatusDirect = mock(async () => { throw new Error("card must use card status endpoint"); });
		const { simpay } = makeSimpay({ getPaymentStatus, getPixStatusDirect });
		const reconciliation = new ReconcilePendingPayments(prisma, simpay);
		expect(await reconciliation.execute()).toBe(1);
		expect(payments[0]?.status).toBe("confirmed");
		expect(orders[0]?.status).toBe("recebido");
		expect(getPaymentStatus).toHaveBeenCalledWith("simpay_1", { externalMerchantId: "cmp_1", integrationKey: "sim-delivery_zero-grau" });
		expect(getPixStatusDirect).not.toHaveBeenCalled();
		expect(await reconciliation.execute()).toBe(0);
		expect(cashbackLedger).toHaveLength(1);
	});

	it("persists card rejection without confirming an order", async () => {
		const { payments, prisma, orders, cashbackLedger } = makeWorld({
			payments: [{ amount: 5000, id: "pay_1", method: "credit_card", orderId: "order_1", pixContent: null, pixQrcode: null, simpayPaymentId: "simpay_1", status: "pending", token: "token_1" }],
		});
		const { simpay } = makeSimpay({ getPaymentStatus: async () => ({ status: "FAILED" }) });
		expect(await new ReconcilePendingPayments(prisma, simpay).execute()).toBe(1);
		expect(payments[0]?.status).toBe("failed");
		expect(orders[0]?.status).toBe("awaiting_payment");
		expect(cashbackLedger).toHaveLength(0);
	});

	it("polls pending PIX payments and confirms approvals", async () => {
		const { payments, prisma } = makeWorld({
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
		const { simpay } = makeSimpay({ getPixStatusDirect: async () => ({ status: "APPROVED" }) });

		expect(await new ReconcilePendingPayments(prisma, simpay).execute()).toBe(1);
		expect(payments[0]?.status).toBe("confirmed");
	});

	it("isolates gateway failures so later payments are still reconciled", async () => {
		const pending = (id: string): PaymentRow => ({
			amount: 5000,
			id: `pay_${id}`,
			method: "pix",
			orderId: "order_1",
			pixContent: "c",
			pixQrcode: "q",
			simpayPaymentId: id,
			status: "pending",
			token: `token_${id}`,
		});
		const { payments, prisma } = makeWorld({ payments: [pending("broken"), pending("approved")] });
		const { simpay } = makeSimpay({
			getPixStatusDirect: async (paymentId: string) => {
				if (paymentId === "broken") throw new Error("gateway unavailable");
				return { status: "COMPLETED" };
			},
		});

		expect(await new ReconcilePendingPayments(prisma, simpay).execute()).toBe(1);
		expect(payments.find(payment => payment.simpayPaymentId === "approved")?.status).toBe("confirmed");
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
				holderCpfRequired: true,
				holderName: "MARIA S",
				id: "card_1",
				isDefault: false,
				last4: "4242",
				nickname: null,
			},
		]);
	});

	it("marks cards with a stored holder document as ready for reuse", async () => {
		const { prisma } = makeWorld({ savedCards: [makeCard({ holderDocument: "11144477735" })] });

		expect((await new ListSavedCards(prisma).execute("user_1", "zero-grau"))[0]?.holderCpfRequired).toBe(
			false,
		);
	});

	it("puts the default card first", async () => {
		const { prisma } = makeWorld({
			savedCards: [makeCard(), makeCard({ id: "card_2", isDefault: true, last4: "1111" })],
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
	const card = {
		cvv: "123",
		expMonth: 12,
		expYear: 2030,
		holderName: "MARIA S",
		number: "4242 4242 4242 4242",
	};
	const body = { card, holderCpf: "11144477735", orderId: "order_1", slug: "zero-grau" };

	it("tokenizes a new card and confirms an explicitly completed charge", async () => {
		const { cashbackLedger, payments, prisma } = makeWorld();
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		const result = await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(result).toMatchObject({ status: "confirmed" });
		expect(payments[0]).toMatchObject({ method: "credit_card", status: "confirmed", orderId: "order_1", simpayPaymentId: "simpay_card_1" });
		expect(calls.card[0]).toMatchObject({ description: "Pedido Zero Grau - Boa Viagem", brand: "visa", installments: 1, price: 50, token: "424242tok" });
		expect(cashbackLedger).toHaveLength(1);
		expect(await prisma.paymentAttempt.findFirst({ where: { orderId: "order_1", state: { in: ["confirmed"] } } })).toMatchObject({ orderId: "order_1", providerPaymentId: "simpay_card_1", providerTransactionId: "transaction_card_1" });
	});

	it("keeps the order pending while Simpay has not approved the card", async () => {
		const { cashbackLedger, payments, prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createCardPayment: async () => ({ id: "simpay_card_1", status: "PENDING" }),
		});
		const { dom } = makeDom();

		const result = await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(result).toMatchObject({ status: "pending", token: "token_1" });
		expect(payments[0]).toMatchObject({ method: "credit_card", status: "pending" });
		expect(cashbackLedger).toHaveLength(0);
	});

	it("rejects a terminal failure returned with HTTP success", async () => {
		const { payments, prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createCardPayment: async () => ({ id: "simpay_card_1", status: "FAILED" }),
		});
		const { dom } = makeDom();

		await expect(cardUseCase(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"CARD_DECLINED",
		);
		expect(payments).toHaveLength(0);
	});

	it("strips card number formatting before tokenizing", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect((calls.tokens[0] as { payload: { number: string } }).payload.number).toBe("4242424242424242");
	});

	it("uses the explicit holder CPF without changing the customer's CPF", async () => {
		const { customers, prisma } = makeWorld();
		const { calls: simpayCalls, simpay } = makeSimpay();
		const { calls: domCalls, dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect((domCalls.tokens[0] as { payload: { holder_document: string } }).payload.holder_document).toBe(
			"11144477735",
		);
		expect((simpayCalls.card[0] as { document: string }).document).toBe("11144477735");
		expect(customers[0]?.cpf).toBe("52998224725");
	});

	it("creates a DOM customer once and reuses the stored id", async () => {
		const { customers, prisma } = makeWorld();
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(calls.customers).toHaveLength(1);
		expect(customers[0].domId).toBeNull();
	});

	it("does not trust a legacy DOM id without canonical customer ownership", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, domId: "dom_existing" }] });
		const { simpay } = makeSimpay();
		const { calls, dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(calls.customers).toHaveLength(1);
		expect((calls.tokens[0] as { domId: string }).domId).toBe("dom_1");
	});

	it("saves the card and marks the first one as default", async () => {
		const { prisma, savedCards } = makeWorld();
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", {
			...body,
			cardNickname: "Cartão pessoal",
			saveCard: true,
		});

		expect(savedCards).toHaveLength(1);
		expect(savedCards[0]).toMatchObject({
			holderDocument: "11144477735",
			isDefault: true,
			last4: "4242",
			nickname: "Cartão pessoal",
		});
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

		await cardUseCase(prisma, simpay, dom).execute("user_1", { ...body, saveCard: true });

		expect(savedCards[1]).toMatchObject({ isDefault: false });
	});

	it("does not save the card unless asked to", async () => {
		const { prisma, savedCards } = makeWorld();
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(savedCards).toHaveLength(0);
	});

	it("requires re-entry for a legacy saved card without real BIN and never charges it", async () => {
		const saved: SavedCardRow = { bin: null, brand: "visa", cardToken: "opaque-token-without-bin", createdAt: new Date(), customerId: "cust_1", expiryMonth: "12", expiryYear: "2030", holderDocument: "11144477735", holderName: "Maria Silva", id: "card_legacy", isDefault: true, last4: "4242" };
		const { prisma } = makeWorld({ savedCards: [saved] });
		const { calls, simpay } = makeSimpay();
		await expect(cardUseCase(prisma, simpay, makeDom().dom).execute("user_1", { orderId: "order_1", savedCardId: saved.id, slug: "zero-grau" })).rejects.toThrow("SAVED_CARD_REAUTH_REQUIRED");
		expect(calls.card).toHaveLength(0);
	});

	it("charges a saved card without tokenizing again", async () => {
		const saved: SavedCardRow = {
			brand: "mastercard",
			cardToken: "tok_saved",
			createdAt: new Date("2026-01-01T00:00:00Z"),
			customerId: "cust_1",
			expiryMonth: "12",
			expiryYear: "2030",
			holderDocument: "11144477735",
			holderName: "MARIA SILVA",
			id: "card_1",
			isDefault: true,
			last4: "5555",
		};
		const { prisma } = makeWorld({ savedCards: [saved] });
		const { calls, simpay } = makeSimpay();
		const { calls: domCalls, dom } = makeDom();

		const result = await cardUseCase(prisma, simpay, dom).execute("user_1", {
			orderId: "order_1",
			savedCardId: "card_1",
			slug: "zero-grau",
		});

		expect(result.status).toBe("confirmed");
		expect(domCalls.tokens).toHaveLength(0);
		expect(calls.card[0]).toMatchObject({
			brand: "mastercard",
			holder_name: "MARIA SILVA",
			token: "tok_saved",
		});
	});

	it("uses a saved holder CPF and backfills a legacy card after a successful charge", async () => {
		const saved: SavedCardRow = {
			brand: "visa",
			cardToken: "tok_saved",
			createdAt: new Date("2026-01-01T00:00:00Z"),
			customerId: "cust_1",
			expiryMonth: "12",
			expiryYear: "2030",
			holderDocument: null,
			holderName: "OUTRA PESSOA",
			id: "card_legacy",
			isDefault: true,
			last4: "4242",
		};
		const { prisma, savedCards } = makeWorld({ savedCards: [saved] });
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		await cardUseCase(prisma, simpay, dom).execute("user_1", {
			holderCpf: "11144477735",
			orderId: "order_1",
			savedCardId: "card_legacy",
			slug: "zero-grau",
		});

		expect((calls.card[0] as { document: string }).document).toBe("11144477735");
		expect(savedCards[0]?.holderDocument).toBe("11144477735");
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
			cardUseCase(prisma, simpay, dom).execute("user_1", {
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
			cardUseCase(prisma, simpay, dom).execute("user_1", { orderId: "order_1", slug: "zero-grau" }),
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

		await expect(cardUseCase(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
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

		await cardUseCase(prisma, simpay, dom).execute("user_1", body);

		expect(payments).toHaveLength(1);
		expect(payments[0]).toMatchObject({ method: "credit_card", pixQrcode: null, status: "confirmed" });
	});

	it("keeps an uncertain gateway failure recoverable", async () => {
		const { payments, prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createCardPayment: async () => {
				throw new PaymentProviderError("Simpay", "declined", 422);
			},
		});
		const { dom } = makeDom();

		await expect(cardUseCase(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"CARD_DECLINED",
		);
		expect(payments).toHaveLength(0);
	});

	it("preserves a safe gateway rejection description", async () => {
		const { prisma } = makeWorld();
		const { simpay } = makeSimpay({
			createCardPayment: async () => {
				throw new PaymentProviderError("Simpay", "Saldo insuficiente", 422);
			},
		});
		const { dom } = makeDom();

		try {
			await cardUseCase(prisma, simpay, dom).execute("user_1", body);
			throw new Error("expected payment to fail");
		} catch (error) {
			expect(error).toMatchObject({ description: "Saldo insuficiente", message: "CARD_DECLINED" });
		}
	});

	it("maps DOM tokenization details to a typed domain error", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, domId: "dom_1" }] });
		const { simpay } = makeSimpay();
		const { dom } = makeDom({
			createCardToken: async () => {
				throw new PaymentProviderError("DOM", "CPF do portador do cartão de crédito é inválido!", 400);
			},
		});

		try {
			await cardUseCase(prisma, simpay, dom).execute("user_1", body);
			throw new Error("expected tokenization to fail");
		} catch (error) {
			expect(error).toMatchObject({
				description: "CPF do portador do cartão de crédito é inválido!",
				message: "CARD_TOKENIZATION_FAILED",
			});
		}
	});

	it("requires an explicit holder document for a new card", async () => {
		const { prisma } = makeWorld({ customers: [{ ...baseCustomer, cpf: null }] });
		const { simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(
			cardUseCase(prisma, simpay, dom).execute("user_1", { ...body, holderCpf: undefined }),
		).rejects.toThrow("DOCUMENT_REQUIRED");
	});

	it("does not charge an order belonging to another customer", async () => {
		const { prisma } = makeWorld({ orders: [{ ...baseOrder, customerId: "cust_2" }] });
		const { calls, simpay } = makeSimpay();
		const { dom } = makeDom();

		await expect(cardUseCase(prisma, simpay, dom).execute("user_1", body)).rejects.toThrow(
			"UNAUTHORIZED_ORDER",
		);
		expect(calls.card).toHaveLength(0);
	});
});

describe("DeleteSavedCard", () => {
	function savedCard(id: string, isDefault: boolean, customerId = "cust_1"): SavedCardRow {
		return {
			brand: "visa",
			cardToken: `tok_${id}`,
			createdAt: new Date(id === "card_1" ? "2026-01-01" : "2026-02-01"),
			customerId,
			expiryMonth: "12",
			expiryYear: "2030",
			holderDocument: "11144477735",
			holderName: "MARIA",
			id,
			isDefault,
			last4: "4242",
		};
	}

	it("deletes an owned card and promotes the newest remaining card", async () => {
		const { prisma, savedCards } = makeWorld({ savedCards: [savedCard("card_1", true), savedCard("card_2", false)] });

		expect(await new DeleteSavedCard(prisma).execute("user_1", "zero-grau", "card_1")).toEqual({
			id: "card_1",
		});
		expect(savedCards).toHaveLength(1);
		expect(savedCards[0]).toMatchObject({ id: "card_2", isDefault: true });
	});

	it("does not delete another customer's card", async () => {
		const { prisma, savedCards } = makeWorld({ savedCards: [savedCard("card_1", true, "cust_2")] });

		await expect(new DeleteSavedCard(prisma).execute("user_1", "zero-grau", "card_1")).rejects.toThrow(
			"SAVED_CARD_NOT_FOUND",
		);
		expect(savedCards).toHaveLength(1);
	});
});

describe("platform fee allocation", () => {
	it("sends the frozen fee separately from merchant proceeds for PIX and card", async () => {
		for (const method of ["pix", "card"]) {
			const { prisma } = makeWorld({ orders: [{ ...baseOrder, deliveryFee: 1000, feeTotalCents: 537, total: 11537 }] });
			const { calls, simpay } = makeSimpay();
			if (method === "pix") {
				await new CreatePixPayment(prisma, simpay).execute("user_1", { orderId: "order_1", slug: "zero-grau" });
			} else {
				await cardUseCase(prisma, simpay, makeDom().dom).execute("user_1", {
					card: { cvv: "123", expMonth: 12, expYear: 2030, holderName: "MARIA SILVA", number: "4242424242424242" },
					holderCpf: "11144477735", orderId: "order_1", slug: "zero-grau",
				});
			}
			expect(calls[method][0]).toMatchObject({ price: 115.37, allocation: { merchantAmountCents: 11000, platformFeeCents: 537, itemsAmountCents: 10000, deliveryAmountCents: 1000 } });
		}
	});

	it("still declares an explicit zero platform fee", async () => {
		const { prisma } = makeWorld();
		const { calls, simpay } = makeSimpay();
		await new CreatePixPayment(prisma, simpay).execute("user_1", { orderId: "order_1", slug: "zero-grau" });
		expect(calls.pix[0]).toMatchObject({ allocation: { merchantAmountCents: 5000, platformFeeCents: 0 } });
	});
});
it("financial contract errors remain operational for PIX and card, never a card refusal", async () => {
 const error = new PaymentProviderError("Simpay", "Detalhamento comercial inválido", 422, "COPRODUCTION_BASE_INVALID");
 const { prisma } = makeWorld();
 const { simpay } = makeSimpay({ createCardPayment: async () => { throw error; }, createPixPayment: async () => { throw error; } });
 await expect(new CreatePixPayment(prisma, simpay).execute("user_1", { orderId: "order_1", slug: "zero-grau" })).rejects.toThrow("PAYMENT_PROCESSING");
 await expect(cardUseCase(prisma, simpay, makeDom().dom).execute("user_1", { orderId: "order_1", slug: "zero-grau", holderCpf: "11144477735", card: { cvv: "123", expMonth: 12, expYear: 2030, holderName: "MARIA SILVA", number: "4242424242424242" } })).rejects.toThrow("PAYMENT_PROCESSING");
});
