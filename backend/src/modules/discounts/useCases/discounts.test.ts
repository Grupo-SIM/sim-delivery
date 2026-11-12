import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreateDiscount } from "./CreateDiscount";
import { DeleteDiscount } from "./DeleteDiscount";
import { UpdateDiscount } from "./UpdateDiscount";

function prismaWith(discounts: Array<{ companyId: string; endsAt?: Date | null; id: string; startsAt?: Date | null; type: string; value: number }>) {
	return {
		discount: {
			create: async ({ data }: { data: object }) => ({ id: "new", ...data }),
			delete: async () => ({}),
			findFirst: async ({ where }: { where: { companyId?: string; id: string } }) =>
				discounts.find(item => item.id === where.id && (!where.companyId || item.companyId === where.companyId)) ?? null,
			update: async ({ data, where }: { data: object; where: { id: string } }) => ({ id: where.id, ...data }),
		},
	} as unknown as PrismaInstance;
}

const body = { kind: "real", name: "Promo", type: "percent", value: 10 } as const;

describe("discounts use-cases", () => {
	it("CreateDiscount requires a company and a sane percent", async () => {
		const create = new CreateDiscount(prismaWith([]));
		await expect(create.execute(null, body)).rejects.toThrow();
		await expect(create.execute("c1", { ...body, value: 100 })).rejects.toThrow();
		await expect(
			create.execute("c1", { ...body, endsAt: "2026-01-01T00:00:00Z", startsAt: "2026-02-01T00:00:00Z" }),
		).rejects.toThrow();
		expect(await create.execute("c1", body)).toMatchObject({ companyId: "c1", value: 10 });
	});

	it("UpdateDiscount and DeleteDiscount are company scoped", async () => {
		const prisma = prismaWith([{ companyId: "c1", id: "d1", type: "percent", value: 10 }]);
		await expect(new UpdateDiscount(prisma).execute("c2", "d1", { name: "x" })).rejects.toThrow();
		await expect(new DeleteDiscount(prisma).execute("c2", "d1")).rejects.toThrow();
		await expect(new UpdateDiscount(prisma).execute("c1", "d1", { type: "percent", value: 150 })).rejects.toThrow();
		expect(await new UpdateDiscount(prisma).execute("c1", "d1", { value: 20 })).toMatchObject({ value: 20 });
	});
});
