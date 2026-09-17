import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { DisabledWhatsAppProvider } from "@/shared/infra/whatsapp";
import { CreateOrder } from "./CreateOrder";
import { GetCustomerOrder } from "./GetCustomerOrder";
import { ListCustomerOrders } from "./ListCustomerOrders";
import { ListOrders } from "./ListOrders";
import { UpdateOrderStatus } from "./UpdateOrderStatus";

const noopWhatsApp = new DisabledWhatsAppProvider();

const baseCompany = { id: "cmp_1", slug: "demo" };
const baseUnit = { active: true, companyId: "cmp_1", deliveryFee: 500, id: "unit_1", slug: "centro" };
const baseCustomer = { companyId: "cmp_1", id: "cust_1", userId: "user_1" };
const baseAddress = { customerId: "cust_1", deletedAt: null, id: "addr_1" };
const baseProduct = { basePriceCents: 1000, id: "prod_1", title: "Pão de queijo" };
const baseUnitProduct = { id: "up_1", priceCentsOverride: null, product: baseProduct, unitId: "unit_1" };

function makeOrderPrisma(
	opts: {
		address?: typeof baseAddress | null;
		company?: typeof baseCompany | null;
		customer?: typeof baseCustomer | null;
		platformFees?: Array<Record<string, unknown> & { id: string }>;
		unit?: typeof baseUnit | null;
		unitProducts?: (typeof baseUnitProduct)[];
	} = {},
) {
	const {
		address = baseAddress,
		company = baseCompany,
		customer = baseCustomer,
		platformFees = [],
		unit = baseUnit,
		unitProducts = [baseUnitProduct],
	} = opts;

	const orders: object[] = [];
	const orderItems: object[] = [];
	const orderItemOptions: object[] = [];
	const orderFeeSnapshots: Array<Record<string, unknown> & { id: string }> = [];
	const orderItemFeeSnapshots: Array<Record<string, unknown>> = [];
	const itemsWithFees = () =>
		orderItems.map(item => ({
			...item,
			feeSnapshots: orderItemFeeSnapshots.filter(
				fee => fee.orderItemId === (item as { id: string }).id,
			),
		}));

	const prisma = {
		$transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
			const tx = {
				inventoryReservation: { createMany: async () => ({ count: 0 }) },
				localOptionRecipeIngredient: { findMany: async () => [] },
				optionRecipeIngredient: { findMany: async () => [] },
				order: {
					create: async ({ data }: { data: object }) => {
						const o = {
							cancelReason: null,
							createdAt: new Date(),
							id: "ord_1",
							status: "recebido",
							updatedAt: new Date(),
							...data,
						};
						orders.push(o);
						return o;
					},
					findUniqueOrThrow: async () => ({
						...(orders[0] as object),
						feeSnapshots: orderFeeSnapshots,
						items: itemsWithFees(),
					}),
				},
				orderFeeSnapshot: {
					create: async ({ data }: { data: Record<string, unknown> }) => {
						const snapshot = { ...data, id: `ofs_${orderFeeSnapshots.length + 1}` };
						orderFeeSnapshots.push(snapshot);
						return snapshot;
					},
				},
				orderItemFeeSnapshot: {
					createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
						orderItemFeeSnapshots.push(...data);
						return { count: data.length };
					},
				},
				orderItem: {
					create: async ({ data }: { data: object }) => {
						const item = { id: `oi_${orderItems.length + 1}`, ...data };
						orderItems.push(item);
						return item;
					},
					createMany: async ({ data }: { data: object[] }) => {
						data.forEach(item => {
							orderItems.push({ id: `oi_${orderItems.length + 1}`, ...item });
						});
						return { count: data.length };
					},
					update: async ({ data, where }: { data: object; where: { id: string } }) => {
						const item = orderItems.find(candidate => (candidate as { id: string }).id === where.id)!;
						Object.assign(item, data);
						return item;
					},
				},
				orderItemOption: {
					createMany: async ({ data }: { data: object[] }) => {
						orderItemOptions.push(...data);
						return { count: data.length };
					},
				},
				productRecipeIngredient: { findMany: async () => [] },
				unitProduct: { updateMany: async () => ({ count: 1 }) },
			};
			return fn(tx);
		},
		address: {
			findFirst: async ({ where }: { where: { customerId: string; deletedAt: null; id: string } }) =>
				address?.customerId === where.customerId &&
				address?.deletedAt === where.deletedAt &&
				address?.id === where.id
					? address
					: null,
		},
		company: {
			findUnique: async ({ where }: { where: { slug?: string } }) =>
				company?.slug === where.slug ? company : null,
		},
		customer: {
			findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
				customer?.companyId === where.companyId && customer?.userId === where.userId ? customer : null,
		},
		order: {
			findFirst: async ({ where }: { where: { createdAt?: { gte: Date }; customerId: string; idempotencyKey?: string; status?: string; unitId?: string } }) => {
				const order = orders.find(candidate => {
					const value = candidate as {
						createdAt?: Date;
						customerId?: string;
						idempotencyKey?: string;
						status?: string;
						unitId?: string;
					};
					if (value.customerId !== where.customerId) return false;
					if (where.idempotencyKey) return value.idempotencyKey === where.idempotencyKey;
					return (
						value.createdAt !== undefined &&
						value.createdAt >= where.createdAt!.gte &&
						value.status === where.status &&
						value.unitId === where.unitId
					);
				});
				return order
					? { ...(order as object), feeSnapshots: orderFeeSnapshots, items: itemsWithFees() }
					: null;
			},
		},
		platformFee: { findMany: async () => platformFees },
		unit: {
			findFirst: async ({ where }: { where: { active: boolean; companyId: string; slug: string } }) =>
				unit?.active === where.active && unit?.companyId === where.companyId && unit?.slug === where.slug
					? unit
					: null,
		},
		unitProduct: {
			findMany: async ({ where }: { where: { id: { in: string[] }; unitId: string } }) =>
				unitProducts.filter(up => where.id.in.includes(up.id) && up.unitId === where.unitId),
		},
	} as unknown as PrismaInstance;

	return { orderFeeSnapshots, orderItemFeeSnapshots, orderItemOptions, orderItems, orders, prisma };
}

const baseBody = {
	addressId: "addr_1",
	deliveryMethod: "delivery" as const,
	idempotencyKey: "00000000-0000-4000-8000-000000000001",
	items: [{ note: undefined, quantity: 2, unitProductId: "up_1" }],
	slug: "demo",
	unitSlug: "centro",
};

describe("CreateOrder", () => {
	it("throws COMPANY_NOT_FOUND when slug unknown", async () => {
		const { prisma } = makeOrderPrisma({ company: null });
		await expect(new CreateOrder(prisma).execute("user_1", { ...baseBody, slug: "unknown" })).rejects.toThrow(
			"COMPANY_NOT_FOUND",
		);
	});

	it("throws UNIT_NOT_FOUND when unit not in company", async () => {
		const { prisma } = makeOrderPrisma({ unit: null });
		await expect(
			new CreateOrder(prisma).execute("user_1", { ...baseBody, unitSlug: "other" }),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("throws UNIT_NOT_FOUND when unit is inactive", async () => {
		const { prisma } = makeOrderPrisma({ unit: { ...baseUnit, active: false } });
		await expect(new CreateOrder(prisma).execute("user_1", baseBody)).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("throws CUSTOMER_NOT_FOUND when no customer record", async () => {
		const { prisma } = makeOrderPrisma({ customer: null });
		await expect(new CreateOrder(prisma).execute("user_1", baseBody)).rejects.toThrow("CUSTOMER_NOT_FOUND");
	});

	it("throws INVALID_ITEM when unitProductId not found in unit", async () => {
		const { prisma } = makeOrderPrisma();
		await expect(
			new CreateOrder(prisma).execute("user_1", {
				...baseBody,
				items: [{ quantity: 1, unitProductId: "up_unknown" }],
			}),
		).rejects.toThrow("INVALID_ITEM");
	});

	it("creates order with correct totals using base price", async () => {
		const { orders, orderItems, prisma } = makeOrderPrisma();
		const result = await new CreateOrder(prisma).execute("user_1", baseBody);

		expect(orders).toHaveLength(1);
		expect(orders[0]).toMatchObject({
			companyId: "cmp_1",
			customerId: "cust_1",
			deliveryFee: 500,
			deliveryMethod: "delivery",
			subtotal: 2000,
			total: 2500,
			unitId: "unit_1",
		});
		expect(orderItems).toHaveLength(1);
		expect(orderItems[0]).toMatchObject({
			productId: "prod_1",
			productName: "Pão de queijo",
			quantity: 2,
			total: 2000,
			unitPrice: 1000,
		});
		expect(result.items).toHaveLength(1);
	});

	it("returns the existing order when the checkout request is retried", async () => {
		const { orders, prisma } = makeOrderPrisma();
		const createOrder = new CreateOrder(prisma);

		const first = await createOrder.execute("user_1", baseBody);
		const retry = await createOrder.execute("user_1", baseBody);

		expect(orders).toHaveLength(1);
		expect(retry.id).toBe(first.id);
	});

	it("recovers a valid unpaid order when checkout receives a new idempotency key", async () => {
		const { orders, prisma } = makeOrderPrisma();
		const createOrder = new CreateOrder(prisma);

		const first = await createOrder.execute("user_1", baseBody);
		const recovered = await createOrder.execute("user_1", {
			...baseBody,
			idempotencyKey: "00000000-0000-4000-8000-000000000002",
		});

		expect(orders).toHaveLength(1);
		expect(first.status).toBe("awaiting_payment");
		expect(recovered.id).toBe(first.id);
	});

	it("does not recover an unpaid order after its one-hour reservation expires", async () => {
		const { orders, prisma } = makeOrderPrisma();
		const createOrder = new CreateOrder(prisma);

		await createOrder.execute("user_1", baseBody);
		(orders[0] as { createdAt: Date }).createdAt = new Date(Date.now() - 60 * 60 * 1_000 - 1);
		await createOrder.execute("user_1", {
			...baseBody,
			idempotencyKey: "00000000-0000-4000-8000-000000000002",
		});

		expect(orders).toHaveLength(2);
	});

	it("uses priceCentsOverride when set", async () => {
		const overrideProduct = {
			...baseUnitProduct,
			priceCentsOverride: 800 as unknown as null,
		};
		const { orders, prisma } = makeOrderPrisma({ unitProducts: [overrideProduct] });
		await new CreateOrder(prisma).execute("user_1", baseBody);
		expect(orders[0]).toMatchObject({ subtotal: 1600, total: 2100 });
	});

	it("adds stacked fees without reducing merchant prices and stores snapshots", async () => {
		const { orderFeeSnapshots, orderItemFeeSnapshots, orders, prisma } = makeOrderPrisma({
			platformFees: [
				{
					active: true,
					applicationScope: "product",
					calculationType: "percentage",
					companyOverrides: [],
					displayMode: "embedded",
					id: "fee_percent",
					name: "Serviço",
					value: 500,
				},
				{
					active: true,
					applicationScope: "order",
					calculationType: "fixed",
					companyOverrides: [],
					displayMode: "checkout_only",
					id: "fee_order",
					name: "Operação",
					value: 75,
				},
			],
		});

		const result = await new CreateOrder(prisma).execute("user_1", baseBody);

		expect(orders[0]).toMatchObject({ feeTotalCents: 175, subtotal: 2000, total: 2675 });
		expect(orderFeeSnapshots).toHaveLength(2);
		expect(orderItemFeeSnapshots).toHaveLength(1);
		expect(result.items[0]).toMatchObject({ displayTotal: 2100, total: 2000, unitPrice: 1000 });
	});

	it("requires an address for delivery orders", async () => {
		const { prisma } = makeOrderPrisma({ address: null });
		await expect(new CreateOrder(prisma).execute("user_1", baseBody)).rejects.toThrow(
			"DELIVERY_ADDRESS_REQUIRED",
		);
	});

	it("creates pickup orders without an address or delivery fee", async () => {
		const { orders, prisma } = makeOrderPrisma({ address: null });
		await new CreateOrder(prisma).execute("user_1", {
			...baseBody,
			addressId: null,
			deliveryMethod: "pickup",
		});
		expect(orders[0]).toMatchObject({ addressId: null, deliveryFee: 0, total: 2000 });
	});

	it("confirms a zero-value order without creating a payment", async () => {
		const freeUnitProduct = {
			...baseUnitProduct,
			priceCentsOverride: 0 as unknown as null,
		};
		const { orders, prisma } = makeOrderPrisma({ unitProducts: [freeUnitProduct] });

		const result = await new CreateOrder(prisma).execute("user_1", {
			...baseBody,
			deliveryMethod: "pickup",
		});

		expect(orders[0]).toMatchObject({ status: "recebido", subtotal: 0, total: 0 });
		expect(result.status).toBe("recebido");
	});
});

function makeUpdateStatusPrisma(order: {
	companyId: string;
	deliveryMethod?: string;
	estimatedStatusCompletionAt?: Date | null;
	id: string;
	phone?: string | null;
	status: string;
	templates?: Record<string, string> | null;
}) {
	const stored: {
		displayNumber: number;
		id: string;
		companyId: string;
		status: string;
		cancelReason: string | null;
		items: unknown[];
		deliveryMethod: string;
		estimatedStatusCompletionAt: Date | null;
		preparedById?: string | null;
		company: { orderStatusWhatsAppTemplates: Record<string, string> | null };
		customer: {
			notificationEmail?: boolean;
			notificationWhatsApp?: boolean;
			phone: string | null;
			user: { email: string };
		};
		unit: { slug: string };
	} = {
		...order,
		cancelReason: null,
		displayNumber: 154,
		company: { orderStatusWhatsAppTemplates: order.templates ?? null },
		customer: {
			notificationEmail: false,
			notificationWhatsApp: true,
			phone: order.phone ?? null,
			user: { email: "cliente@example.com" },
		},
		deliveryMethod: order.deliveryMethod ?? "delivery",
		estimatedStatusCompletionAt: order.estimatedStatusCompletionAt ?? null,
		items: [],
		unit: { slug: "centro" },
	};

	const prisma = {
		$transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
		inventoryReservation: {
			findMany: async () => [],
			updateMany: async () => ({ count: 0 }),
		},
		order: {
			findFirst: async ({ where }: { where: { companyId?: string; id: string } }) =>
				(where.companyId ? stored.companyId === where.companyId : true) && stored.id === where.id
				? { ...stored, company: { ...stored.company }, customer: { ...stored.customer }, unit: { ...stored.unit } }
					: null,
			update: async ({ data }: { data: object }) => {
				Object.assign(stored, data);
				return { ...stored };
			},
		},
		orderItem: { findMany: async () => [] },
		orderStatusEvent: { create: async () => ({}) },
		user: { findFirst: async () => ({ id: "kitchen_2" }) },
		unitProduct: { updateMany: async () => ({ count: 1 }) },
	} as unknown as PrismaInstance;

	return { prisma, stored };
}

describe("UpdateOrderStatus", () => {
	it("transitions recebido → em_preparo", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "em_preparo" });
		expect(stored.status).toBe("em_preparo");
	});

	it("stores a deadline for the current estimated phase", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		const before = Date.now();

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", {
			estimatedMinutes: 15,
			status: "em_preparo",
		});

		expect(stored.estimatedStatusCompletionAt).toBeInstanceOf(Date);
		expect((stored.estimatedStatusCompletionAt as Date).getTime()).toBeGreaterThanOrEqual(before + 15 * 60_000);
	});

	it("does not store an estimate when the order leaves for delivery", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "pronto",
		});

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", {
			estimatedMinutes: 15,
			status: "saiu_para_entrega",
		});

		expect(stored.estimatedStatusCompletionAt).toBeNull();
	});

	it("emails the customer when the preparation estimate is added or edited", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			phone: "5581999999999",
			status: "em_preparo",
		});
		stored.customer.notificationEmail = true;
		const sent: Record<string, string | number | undefined>[] = [];

		const whatsAppSent: unknown[][] = [];
		const whatsApp = { sendMessage: async (...input: unknown[]) => void whatsAppSent.push(input) };

		await new UpdateOrderStatus(prisma, whatsApp, undefined, { send: async input => void sent.push(input) }).execute(
			"cmp_1",
			"ord_1",
			{ estimatedMinutes: 20, status: "em_preparo" },
		);

		expect(sent).toEqual([
			{
				message: "Seu pedido #154 já está sendo preparado com carinho. Assim que ficar pronto, seguirá para entrega.",
				orderNumber: 154,
				status: "em_preparo",
				to: "cliente@example.com",
			},
		]);
		expect(whatsAppSent).toEqual([
			[
				"5581999999999",
				{
					attachments: [],
					text: "Seu pedido #154 já está sendo preparado com carinho. Assim que ficar pronto, seguirá para entrega.",
				},
			],
		]);
	});

	it("clears the previous phase deadline when advancing", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			estimatedStatusCompletionAt: new Date(),
			id: "ord_1",
			status: "em_preparo",
		});

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "pronto" });

		expect(stored.estimatedStatusCompletionAt).toBeNull();
	});

	it("lets kitchen move an order to any status", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "em_preparo" },
			"kitchen",
		);
		expect(stored.status).toBe("em_preparo");
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "saiu_para_entrega" },
			"kitchen",
		);
		expect(stored.status).toBe("saiu_para_entrega");
	});

	it("lets courier move an order to any status", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "entregue" },
			"courier",
		);
		expect(stored.status).toBe("entregue");
	});

	it("lets kitchen return a ready order to preparation", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "pronto",
		});

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "em_preparo" },
			"kitchen",
		);

		expect(stored.status).toBe("em_preparo");
	});

	it("completes a pickup order directly from ready", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			deliveryMethod: "pickup",
			id: "ord_1",
			status: "pronto",
		});

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "entregue" });

		expect(stored.status).toBe("entregue");
	});

	it("does not send a pickup order out for delivery", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			deliveryMethod: "pickup",
			id: "ord_1",
			status: "pronto",
		});

		await expect(
			new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "saiu_para_entrega" }),
		).rejects.toThrow("INVALID_TRANSITION");

		expect(stored.status).toBe("pronto");
	});

	it("emails pickup completion as collected", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			deliveryMethod: "pickup",
			id: "ord_1",
			status: "pronto",
		});
		stored.customer.notificationEmail = true;
		const sent: Record<string, string | number | undefined>[] = [];

		await new UpdateOrderStatus(prisma, noopWhatsApp, undefined, { send: async input => void sent.push(input) }).execute(
			"cmp_1",
			"ord_1",
			{ status: "entregue" },
		);

		expect(sent[0]).toMatchObject({
			message: "Seu pedido #154 foi retirado. Esperamos que aproveite cada detalhe!",
			orderNumber: 154,
			to: "cliente@example.com",
		});
		expect(sent[0]?.reviewUrl).toContain("/centro/rate?orderId=ord_1");
	});

	it("lets kitchen reassign the cook during preparation", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "em_preparo",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ preparedById: "kitchen_2", status: "em_preparo" },
			"kitchen",
		);
		expect(stored).toMatchObject({ preparedById: "kitchen_2", status: "em_preparo" });
	});

	it("lets courier return an order to an earlier status", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "pronto",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "saiu_para_entrega" },
			"courier",
		);
		expect(stored.status).toBe("saiu_para_entrega");
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(
			"cmp_1",
			"ord_1",
			{ status: "em_preparo" },
			"courier",
		);
		expect(stored.status).toBe("em_preparo");
	});

	it("sends configured WhatsApp template for a status", async () => {
		const { prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			deliveryMethod: "delivery",
			id: "ord_1",
			phone: "+5511999999999",
			status: "recebido",
			templates: { em_preparo: "Pedido {{orderId}} em produção." },
		});
		const messages: string[] = [];
		const whatsApp = {
			sendMessage: async (_phone: string, message: { text: string }) => {
				messages.push(message.text);
			},
		};

		await new UpdateOrderStatus(prisma, whatsApp).execute("cmp_1", "ord_1", { status: "em_preparo" });

		expect(messages).toEqual(["Pedido #154 em produção."]);
	});

	it("notifies the customer when the order is ready", async () => {
		const { prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			phone: "+5511999999999",
			status: "em_preparo",
		});
		const messages: string[] = [];

		await new UpdateOrderStatus(prisma, {
			sendMessage: async (_phone, message) => void messages.push(message.text),
		}).execute("cmp_1", "ord_1", { status: "pronto" });

		expect(messages).toEqual(["Seu pedido #154 está pronto e logo seguirá para entrega."]);
	});

	it("does not send WhatsApp when customer opted out", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			deliveryMethod: "delivery",
			id: "ord_1",
			phone: "+5511999999999",
			status: "recebido",
		});
		stored.customer.notificationWhatsApp = false;
		const messages: string[] = [];

		await new UpdateOrderStatus(prisma, { sendMessage: async () => void messages.push("sent") }).execute(
			"cmp_1",
			"ord_1",
			{
				status: "em_preparo",
			},
		);

		expect(messages).toEqual([]);
	});

	it("throws ORDER_NOT_FOUND for wrong companyId", async () => {
		const { prisma } = makeUpdateStatusPrisma({ companyId: "cmp_1", id: "ord_1", status: "recebido" });
		await expect(
			new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_2", "ord_1", { status: "em_preparo" }),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});

	it("allows superAdmin (null company) to update an order from any company", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute(null, "ord_1", { status: "em_preparo" });
		expect(stored.status).toBe("em_preparo");
	});

	it("allows moving an order directly to any operational status", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});

		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "entregue" });

		expect(stored.status).toBe("entregue");
	});

	it("does not notify when returning an order to an earlier status", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			phone: "+5511999999999",
			status: "pronto",
		});
		stored.customer.notificationEmail = true;
		const emails: Record<string, string | number | undefined>[] = [];
		const messages: string[] = [];

		await new UpdateOrderStatus(
			prisma,
			{ sendMessage: async () => void messages.push("sent") },
			undefined,
			{ send: async input => void emails.push(input) },
		).execute("cmp_1", "ord_1", { status: "em_preparo" });

		expect(stored.status).toBe("em_preparo");
		expect(emails).toEqual([]);
		expect(messages).toEqual([]);
	});

	it("allows reopening a cancelled order for correction", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "cancelado",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "em_preparo" });
		expect(stored.status).toBe("em_preparo");
		expect(stored.cancelReason).toBeNull();
	});

	it("cancels without a reason", async () => {
		const { prisma, stored } = makeUpdateStatusPrisma({ companyId: "cmp_1", id: "ord_1", status: "recebido" });
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", { status: "cancelado" });
		expect(stored.status).toBe("cancelado");
		expect(stored.cancelReason).toBeNull();
	});

	it("cancels with reason", async () => {
		const { stored, prisma } = makeUpdateStatusPrisma({
			companyId: "cmp_1",
			id: "ord_1",
			status: "recebido",
		});
		await new UpdateOrderStatus(prisma, noopWhatsApp).execute("cmp_1", "ord_1", {
			cancelReason: "Cliente desistiu",
			status: "cancelado",
		});
		expect(stored.status).toBe("cancelado");
		expect(stored.cancelReason).toBe("Cliente desistiu");
	});
});

function makeListOrdersPrisma() {
	const baseUser = { id: "user_1", name: "Maria" };
	const baseCustomer = {
		companyId: "cmp_1",
		id: "cust_1",
		phone: "11999999999",
		user: baseUser,
		userId: "user_1",
	};
	const baseUnit = { companyId: "cmp_1", id: "unit_1", name: "Centro" };
	const order1 = {
		addressId: null,
		cancelReason: null,
		cashbackCentsRedeemed: 0,
		companyId: "cmp_1",
		coupon: null,
		couponId: null,
		createdAt: new Date("2024-01-01"),
		customer: baseCustomer,
		customerId: "cust_1",
		deliveryFee: 500,
		deliveryMethod: "delivery",
		discountCents: 0,
		id: "ord_1",
		items: [],
		loyaltyPointsRedeemed: 0,
		status: "recebido",
		subtotal: 2000,
		total: 2500,
		unit: baseUnit,
		unitId: "unit_1",
		updatedAt: new Date("2024-01-01"),
	};

	const prisma = {
		company: {
			findUnique: async () => ({ orderBoardStartedAt: null }),
		},
		order: {
			findMany: async () => [order1],
		},
		product: {
			findMany: async () => [],
		},
		unit: {
			findMany: async () => [{ hours: [], id: "unit_1" }],
		},
	} as unknown as PrismaInstance;

	return { order1, prisma };
}

describe("ListOrders", () => {
	it("returns orders with customer and unit names", async () => {
		const { prisma } = makeListOrdersPrisma();
		const result = await new ListOrders(prisma).execute("cmp_1", {});
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ customerName: "Maria", unitName: "Centro" });
	});

	it("allows superAdmin (null company) to list orders across companies", async () => {
		const { prisma } = makeListOrdersPrisma();
		const result = await new ListOrders(prisma).execute(null, {});
		expect(result).toHaveLength(1);
	});

	it("excludes cancelled unpaid orders when listing one customer's history", async () => {
		let where: unknown;
		const prisma = {
			order: {
				findMany: async ({ where: nextWhere }: { where: unknown }) => {
					where = nextWhere;
					return [];
				},
			},
			product: { findMany: async () => [] },
			unit: { findMany: async () => [] },
		} as unknown as PrismaInstance;

		await new ListOrders(prisma).execute("cmp_1", { customerId: "cust_1" });

		expect(where).toMatchObject({
			NOT: {
				AND: [
					{ status: "cancelado" },
					{
						OR: [
							{ payment: { is: null } },
							{ payment: { is: { status: { not: "confirmed" } } } },
						],
					},
				],
			},
			customerId: "cust_1",
		});
		expect(where).not.toHaveProperty("OR");
	});
});

describe("ListCustomerOrders", () => {
	it("excludes cancelled unpaid orders from the customer's own order history", async () => {
		let where: unknown;
		const prisma = {
			company: { findUnique: async () => ({ id: "cmp_1", slug: "demo" }) },
			order: {
				findMany: async ({ where: nextWhere }: { where: unknown }) => {
					where = nextWhere;
					return [];
				},
			},
		} as unknown as PrismaInstance;

		const result = await new ListCustomerOrders(prisma).execute("user_1", "demo");

		expect(result).toEqual([]);
		expect(where).toMatchObject({
			NOT: {
				AND: [
					{ status: "cancelado" },
					{
						OR: [
							{ payment: { is: null } },
							{ payment: { is: { status: { not: "confirmed" } } } },
						],
					},
				],
			},
			companyId: "cmp_1",
			customer: { userId: "user_1" },
		});
	});
});

function makeCustomerOrderPrisma(order: object | null) {
	const prisma = {
		company: { findUnique: async () => ({ id: "cmp_1", slug: "demo" }) },
		order: { findFirst: async () => order },
		product: { findMany: async () => [{ id: "prod_1", imageUrl: "https://example.com/pao-de-queijo.jpg" }] },
	} as unknown as PrismaInstance;

	return prisma;
}

describe("GetCustomerOrder", () => {
	it("returns the tracking details for the order owner", async () => {
		const result = await new GetCustomerOrder(
		makeCustomerOrderPrisma({
				cancelReason: null,
				createdAt: new Date("2024-01-01"),
				deliveryMethod: "delivery",
				id: "ord_1",
				items: [],
				productReviews: [{ productId: "prod_1" }],
				review: { id: "review_1" },
				status: "em_preparo",
				total: 2500,
			unit: { name: "Centro", slug: "centro" },
		}),
		).execute("user_1", "ord_1", "demo");

		expect(result).toMatchObject({
			hasOrderReview: true,
			id: "ord_1",
			reviewedProductIds: ["prod_1"],
			status: "em_preparo",
			unitName: "Centro",
			unitSlug: "centro",
		});
	});

	it("hides orders that do not belong to the authenticated customer", async () => {
		await expect(
			new GetCustomerOrder(makeCustomerOrderPrisma(null)).execute("user_2", "ord_1", "demo"),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});
});
