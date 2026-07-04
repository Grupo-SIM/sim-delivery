import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateOrder } from "./CreateOrder";

const baseCompany = { id: "cmp_1", variantKey: "demo" };
const baseUnit = { id: "unit_1", companyId: "cmp_1", deliveryFee: 500 };
const baseCustomer = { id: "cust_1", companyId: "cmp_1", userId: "user_1" };
const baseProduct = { id: "prod_1", title: "Pão de queijo", basePriceCents: 1000 };
const baseUnitProduct = { id: "up_1", unitId: "unit_1", product: baseProduct, priceCentsOverride: null };

function makeOrderPrisma(opts: {
	company?: typeof baseCompany | null;
	customer?: typeof baseCustomer | null;
	unit?: typeof baseUnit | null;
	unitProducts?: typeof baseUnitProduct[];
} = {}) {
	const {
		company = baseCompany,
		customer = baseCustomer,
		unit = baseUnit,
		unitProducts = [baseUnitProduct],
	} = opts;

	const orders: object[] = [];
	const orderItems: object[] = [];

	const prisma = {
		company: {
			findUnique: async ({ where }: { where: { variantKey?: string } }) =>
				company?.variantKey === where.variantKey ? company : null,
		},
		customer: {
			findFirst: async ({ where }: { where: { companyId: string; userId: string } }) =>
				customer?.companyId === where.companyId && customer?.userId === where.userId
					? customer
					: null,
		},
		unit: {
			findFirst: async ({ where }: { where: { companyId: string; id: string } }) =>
				unit?.companyId === where.companyId && unit?.id === where.id ? unit : null,
		},
		unitProduct: {
			findMany: async ({ where }: { where: { id: { in: string[] }; unitId: string } }) =>
				unitProducts.filter(up => where.id.in.includes(up.id) && up.unitId === where.unitId),
		},
		$transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
			const tx = {
				order: {
					create: async ({ data }: { data: object }) => {
						const o = { id: "ord_1", status: "recebido", cancelReason: null, createdAt: new Date(), updatedAt: new Date(), ...data };
						orders.push(o);
						return o;
					},
					findUniqueOrThrow: async () => ({ ...(orders[0] as object), items: orderItems }),
				},
				orderItem: {
					createMany: async ({ data }: { data: object[] }) => {
						data.forEach(item => orderItems.push({ id: `oi_${orderItems.length + 1}`, ...item }));
						return { count: data.length };
					},
				},
			};
			return fn(tx);
		},
	} as unknown as PrismaInstance;

	return { orders, orderItems, prisma };
}

const baseBody = {
	deliveryMethod: "delivery" as const,
	items: [{ unitProductId: "up_1", quantity: 2, note: undefined }],
	unitId: "unit_1",
	variantKey: "demo",
};

describe("CreateOrder", () => {
	it("throws COMPANY_NOT_FOUND when variantKey unknown", async () => {
		const { prisma } = makeOrderPrisma({ company: null });
		await expect(
			new CreateOrder(prisma).execute("user_1", { ...baseBody, variantKey: "unknown" }),
		).rejects.toThrow("COMPANY_NOT_FOUND");
	});

	it("throws UNIT_NOT_FOUND when unit not in company", async () => {
		const { prisma } = makeOrderPrisma({ unit: null });
		await expect(
			new CreateOrder(prisma).execute("user_1", { ...baseBody, unitId: "unit_999" }),
		).rejects.toThrow("UNIT_NOT_FOUND");
	});

	it("throws CUSTOMER_NOT_FOUND when no customer record", async () => {
		const { prisma } = makeOrderPrisma({ customer: null });
		await expect(
			new CreateOrder(prisma).execute("user_1", baseBody),
		).rejects.toThrow("CUSTOMER_NOT_FOUND");
	});

	it("throws INVALID_ITEM when unitProductId not found in unit", async () => {
		const { prisma } = makeOrderPrisma();
		await expect(
			new CreateOrder(prisma).execute("user_1", {
				...baseBody,
				items: [{ unitProductId: "up_unknown", quantity: 1 }],
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
			unitId: "unit_1",
			subtotal: 2000,
			deliveryFee: 500,
			total: 2500,
			deliveryMethod: "delivery",
		});
		expect(orderItems).toHaveLength(1);
		expect(orderItems[0]).toMatchObject({
			productId: "prod_1",
			productName: "Pão de queijo",
			unitPrice: 1000,
			quantity: 2,
			total: 2000,
		});
		expect(result.items).toHaveLength(1);
	});

	it("uses priceCentsOverride when set", async () => {
		const overrideProduct = {
			...baseUnitProduct,
			priceCentsOverride: 800,
		};
		const { orders, prisma } = makeOrderPrisma({ unitProducts: [overrideProduct] });
		await new CreateOrder(prisma).execute("user_1", baseBody);
		expect(orders[0]).toMatchObject({ subtotal: 1600, total: 2100 });
	});

	it("sets deliveryFee to 0 for pickup", async () => {
		const { orders, prisma } = makeOrderPrisma();
		await new CreateOrder(prisma).execute("user_1", { ...baseBody, deliveryMethod: "pickup" });
		expect(orders[0]).toMatchObject({ deliveryFee: 0, total: 2000 });
	});
});
