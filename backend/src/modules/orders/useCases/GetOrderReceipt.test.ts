import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetOrderReceipt } from "./GetOrderReceipt";

const receiptOrder = {
	address: {
		addressLine: "Rua das Flores",
		city: "Fortaleza",
		complement: "Apto 201",
		neighborhood: "Centro",
		number: "123",
		reference: "Próximo à praça",
		state: "CE",
		zipCode: "60000-000",
	},
	cashbackCentsRedeemed: 100,
	companyId: "cmp_1",
	company: { receiptTemplate: null },
	createdAt: new Date("2026-08-31T15:30:00.000Z"),
	customer: { phone: "85999999999", user: { name: "Ana", phoneNumber: null } },
	deliveryFee: 500,
	deliveryMethod: "delivery",
	discountCents: 200,
	displayNumber: 42,
	id: "ord_1",
	items: [
		{
			id: "item_1",
			note: "Sem cebola",
			optionSnapshots: [
				{
					groupName: "Adicionais",
					optionName: "Bacon",
					priceDeltaCents: 300,
					quantity: 2,
				},
			],
			productName: "Hambúrguer",
			quantity: 2,
			total: 3600,
			unitPrice: 1800,
		},
	],
	loyaltyPointsRedeemed: 50,
	payment: { method: "pix", status: "confirmed" },
	preparedBy: { id: "staff_1", name: "Carlos" },
	status: "em_preparo",
	subtotal: 3600,
	total: 3750,
	unit: { id: "unit_1", name: "Unidade Centro" },
};

function makePrisma(order: typeof receiptOrder | null = receiptOrder) {
	let receivedWhere: Record<string, unknown> | undefined;
	const prisma = {
		order: {
			findFirst: async ({ where }: { where: Record<string, unknown> }) => {
				receivedWhere = where;
				if (!order || where.id !== order.id) return null;
				if (where.companyId && where.companyId !== order.companyId) return null;
				return order;
			},
		},
	} as unknown as PrismaInstance;
	return { getWhere: () => receivedWhere, prisma };
}

describe("GetOrderReceipt", () => {
	it("returns a complete receipt without mutating the order", async () => {
		const { prisma } = makePrisma();
		const result = await new GetOrderReceipt(prisma).execute("cmp_1", "ord_1", "manager", "staff_1");
		const { company: _company, companyId: _companyId, ...publicReceiptOrder } = receiptOrder;

		expect(result).toEqual({
			...publicReceiptOrder,
			template: {
				blocks: [
					{ id: "unit-name", type: "unitName" },
					{ id: "order-number", type: "orderNumber" },
					{ id: "status", type: "status" },
					{ id: "date", type: "date" },
					{ id: "separator-1", type: "separator" },
					{ id: "delivery-method", type: "deliveryMethod" },
					{ id: "customer-name", type: "customerName" },
					{ id: "customer-phone", type: "customerPhone" },
					{ id: "address", type: "address" },
					{ id: "separator-2", type: "separator" },
					{ id: "items", type: "items" },
					{ id: "separator-3", type: "separator" },
					{ id: "payment", type: "payment" },
					{ id: "separator-4", type: "separator" },
					{ id: "subtotal", type: "subtotal" },
					{ id: "delivery-fee", type: "deliveryFee" },
					{ id: "discount", type: "discount" },
					{ id: "cashback", type: "cashback" },
					{ id: "loyalty", type: "loyalty" },
					{ id: "total", type: "total" },
					{ id: "separator-5", type: "separator" },
					{ id: "prepared-by", type: "preparedBy" },
				],
			},
			customer: { name: "Ana", phone: "85999999999" },
			items: [
				{
					id: "item_1",
					note: "Sem cebola",
					options: [
						{
							groupName: "Adicionais",
							optionName: "Bacon",
							priceDeltaCents: 300,
							quantity: 2,
						},
					],
					productName: "Hambúrguer",
					quantity: 2,
					total: 3600,
					unitPrice: 1800,
				},
			],
		});
	});

	it("returns pickup receipt without an address", async () => {
		const pickup = { ...receiptOrder, address: null, deliveryMethod: "pickup" } as unknown as typeof receiptOrder;
		const { prisma } = makePrisma(pickup);
		const result = await new GetOrderReceipt(prisma).execute("cmp_1", "ord_1", "attendant", "staff_2");
		expect(result.address).toBeNull();
		expect(result.deliveryMethod).toBe("pickup");
	});

	it("returns ORDER_NOT_FOUND for another tenant", async () => {
		const { prisma } = makePrisma();
		await expect(
			new GetOrderReceipt(prisma).execute("cmp_other", "ord_1", "owner", "owner_1"),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});

	it("scopes kitchen access to assigned units", async () => {
		const { getWhere, prisma } = makePrisma();
		await new GetOrderReceipt(prisma).execute("cmp_1", "ord_1", "kitchen", "kitchen_1");
		expect(getWhere()).toMatchObject({
			companyId: "cmp_1",
			unit: { staffUnits: { some: { userId: "kitchen_1" } } },
		});
	});

	it("returns ORDER_NOT_FOUND when kitchen unit scope finds no order", async () => {
		const { prisma } = makePrisma(null);
		await expect(
			new GetOrderReceipt(prisma).execute("cmp_1", "ord_1", "kitchen", "kitchen_other"),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});
});
