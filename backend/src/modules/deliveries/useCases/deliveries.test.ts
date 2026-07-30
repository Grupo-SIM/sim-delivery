import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { AssignDelivery } from "./AssignDelivery";
import { UpdateDeliveryStatus } from "./UpdateDeliveryStatus";

const baseOrder = { companyId: "cmp_1", deliveryMethod: "delivery", id: "ord_1", unitId: "unit_1" };
const baseDelivery = {
	companyId: "cmp_1",
	courierId: "courier_1",
	id: "del_1",
	orderId: "ord_1",
	status: "atribuida",
	unitId: "unit_1",
};

function makeAssignPrisma(opts: {
	courier?: { companyId: string; id: string; role: string } | null;
	staffUnit?: { userId: string; unitId: string } | null;
	existing?: typeof baseDelivery | null;
	order?: typeof baseOrder | null;
}) {
	const {
		courier = { companyId: "cmp_1", id: "courier_1", role: "courier" },
		staffUnit = { userId: "courier_1", unitId: "unit_1" },
		order = baseOrder,
		existing = null,
	} = opts;
	const created: object[] = [];

	const prisma = {
		staffUnit: {
			findUnique: async () => staffUnit,
		},
		delivery: {
			create: async ({ data }: { data: object }) => {
				const d = {
					assignedAt: new Date(),
					createdAt: new Date(),
					id: "del_1",
					status: "atribuida",
					updatedAt: new Date(),
					...data,
				};
				created.push(d);
				return d;
			},
			findUnique: async () => existing,
		},
		order: {
			findFirst: async ({ where }: { where: { companyId: string; id: string } }) =>
				order?.companyId === where.companyId && order?.id === where.id ? order : null,
		},
		user: {
			findFirst: async () => courier,
		},
	} as unknown as PrismaInstance;

	return { created, prisma };
}

describe("AssignDelivery", () => {
	it("creates delivery for a delivery order", async () => {
		const { created, prisma } = makeAssignPrisma({});
		await new AssignDelivery(prisma).execute("cmp_1", { courierId: "courier_1", orderId: "ord_1" });
		expect(created).toHaveLength(1);
		expect(created[0]).toMatchObject({ courierId: "courier_1", orderId: "ord_1" });
	});

	it("throws ORDER_NOT_FOUND for wrong companyId", async () => {
		const { prisma } = makeAssignPrisma({ order: null });
		await expect(
			new AssignDelivery(prisma).execute("cmp_1", { courierId: "courier_1", orderId: "ord_1" }),
		).rejects.toThrow("ORDER_NOT_FOUND");
	});

	it("throws ORDER_NOT_DELIVERY for pickup orders", async () => {
		const pickupOrder = { ...baseOrder, deliveryMethod: "pickup" };
		const { prisma } = makeAssignPrisma({ order: pickupOrder });
		await expect(
			new AssignDelivery(prisma).execute("cmp_1", { courierId: "courier_1", orderId: "ord_1" }),
		).rejects.toThrow("ORDER_NOT_DELIVERY");
	});

	it("throws COURIER_NOT_AVAILABLE when courier is outside order unit", async () => {
		const { prisma } = makeAssignPrisma({ staffUnit: null });
		await expect(
			new AssignDelivery(prisma).execute("cmp_1", { courierId: "courier_1", orderId: "ord_1" }),
		).rejects.toThrow("COURIER_NOT_AVAILABLE");
	});

	it("throws ORDER_ALREADY_ASSIGNED when delivery exists", async () => {
		const { prisma } = makeAssignPrisma({ existing: baseDelivery });
		await expect(
			new AssignDelivery(prisma).execute("cmp_1", { courierId: "courier_1", orderId: "ord_1" }),
		).rejects.toThrow("ORDER_ALREADY_ASSIGNED");
	});
});

function makeUpdateDeliveryPrisma(delivery: {
	id: string;
	companyId: string;
	courierId: string;
	orderId: string;
	status: string;
}) {
	const stored: {
		id: string;
		companyId: string;
		courierId: string;
		orderId: string;
		status: string;
		acceptedAt: Date | null;
		departedAt: Date | null;
		deliveredAt: Date | null;
	} = {
		...delivery,
		acceptedAt: null,
		deliveredAt: null,
		departedAt: null,
	};

	const prisma = {
		$transaction: async (ops: unknown[]) => Promise.all((ops as Promise<unknown>[]).map(op => op)),
		delivery: {
			findFirst: async ({ where }: { where: { companyId: string; id: string } }) =>
				stored.companyId === where.companyId && stored.id === where.id ? stored : null,
			update: async ({ data }: { data: object }) => {
				Object.assign(stored, data);
				return { ...stored };
			},
		},
		order: {
			update: async () => ({}),
		},
	} as unknown as PrismaInstance;

	return { prisma, stored };
}

describe("UpdateDeliveryStatus", () => {
	it("transitions atribuida → aceita", async () => {
		const { stored, prisma } = makeUpdateDeliveryPrisma({
			companyId: "cmp_1",
			courierId: "courier_1",
			id: "del_1",
			orderId: "ord_1",
			status: "atribuida",
		});
		await new UpdateDeliveryStatus(prisma).execute("cmp_1", "courier_1", "del_1", { status: "aceita" }, true);
		expect(stored.status).toBe("aceita");
	});

	it("throws FORBIDDEN_COURIER when courier is not assigned", async () => {
		const { prisma } = makeUpdateDeliveryPrisma({
			companyId: "cmp_1",
			courierId: "courier_1",
			id: "del_1",
			orderId: "ord_1",
			status: "atribuida",
		});
		await expect(
			new UpdateDeliveryStatus(prisma).execute("cmp_1", "courier_2", "del_1", { status: "aceita" }, true),
		).rejects.toThrow("FORBIDDEN_COURIER");
	});

	it("throws INVALID_TRANSITION for illegal jump", async () => {
		const { prisma } = makeUpdateDeliveryPrisma({
			companyId: "cmp_1",
			courierId: "courier_1",
			id: "del_1",
			orderId: "ord_1",
			status: "atribuida",
		});
		await expect(
			new UpdateDeliveryStatus(prisma).execute("cmp_1", "courier_1", "del_1", { status: "entregue" }, true),
		).rejects.toThrow("INVALID_TRANSITION");
	});

	it("allows staff to update any delivery regardless of courierId", async () => {
		const { stored, prisma } = makeUpdateDeliveryPrisma({
			companyId: "cmp_1",
			courierId: "courier_1",
			id: "del_1",
			orderId: "ord_1",
			status: "atribuida",
		});
		await new UpdateDeliveryStatus(prisma).execute(
			"cmp_1",
			"staff_999",
			"del_1",
			{ status: "aceita" },
			false,
		);
		expect(stored.status).toBe("aceita");
	});
});
