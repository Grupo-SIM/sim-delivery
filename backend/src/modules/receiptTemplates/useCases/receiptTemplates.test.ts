import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { defaultReceiptTemplate } from "../defaultReceiptTemplate";
import { GetReceiptTemplate } from "./GetReceiptTemplate";
import { UpdateReceiptTemplate } from "./UpdateReceiptTemplate";

describe("receipt templates", () => {
	it("returns the default layout when company has no customization", async () => {
		const prisma = {
			company: { findUnique: async () => ({ receiptTemplate: null }) },
		} as unknown as PrismaInstance;
		expect(await new GetReceiptTemplate(prisma).execute("cmp_1")).toEqual(defaultReceiptTemplate);
	});

	it("persists ordered custom, separator, and dynamic blocks", async () => {
		let persisted: unknown;
		const prisma = {
			company: {
				update: async ({ data, where }: { data: { receiptTemplate: unknown }; where: { id: string } }) => {
					persisted = { data, where };
					return { receiptTemplate: data.receiptTemplate };
				},
			},
		} as unknown as PrismaInstance;
		const blocks = [
			{ align: "center" as const, content: "Obrigado!", id: "text-1", type: "text" as const },
			{ id: "separator-1", separatorStyle: "dashed" as const, type: "separator" as const },
			{ id: "order-number", orderNumberStyle: "giant" as const, type: "orderNumber" as const },
			{ id: "items", type: "items" as const },
		];
		expect(await new UpdateReceiptTemplate(prisma).execute({ blocks, companyId: "cmp_1" })).toEqual({ blocks });
		expect(persisted).toEqual({ data: { receiptTemplate: { blocks } }, where: { id: "cmp_1" } });
	});

	it("rejects duplicate singleton sections", async () => {
		const prisma = {} as PrismaInstance;
		await expect(
			new UpdateReceiptTemplate(prisma).execute({
				blocks: [
					{ id: "items-1", type: "items" },
					{ id: "items-2", type: "items" },
				],
				companyId: "cmp_1",
			}),
		).rejects.toThrow("FORBIDDEN");
	});
});
