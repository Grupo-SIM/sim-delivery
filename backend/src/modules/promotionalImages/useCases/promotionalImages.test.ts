import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CreatePromotionalImage, SetPromotionalImageUnits } from "./PromotionalImages";

describe("promotional images", () => {
	it("requires a company when creating", async () => {
		const prisma = {} as PrismaInstance;
		await expect(
			new CreatePromotionalImage(prisma).execute(null, { imageUrl: "https://x.test/a.png", title: "Oferta" }),
		).rejects.toThrow("NO_COMPANY");
	});

	it("creates image under current company", async () => {
		let received: unknown;
		const prisma = {
			promotionalImage: {
				create: async ({ data }: { data: unknown }) => {
					received = data;
					return { id: "p1", linkUrl: null, ...(data as object) };
				},
			},
		} as unknown as PrismaInstance;
		await new CreatePromotionalImage(prisma).execute("c1", {
			imageUrl: "https://x.test/a.png",
			title: "Oferta",
		});
		expect(received).toMatchObject({ companyId: "c1", title: "Oferta" });
	});

	it("rejects units outside image company", async () => {
		const prisma = {
			promotionalImage: { findFirst: async () => ({ id: "p1" }) },
			unit: { count: async () => 0 },
		} as unknown as PrismaInstance;
		await expect(new SetPromotionalImageUnits(prisma).execute("c1", "p1", ["u2"])).rejects.toThrow(
			"UNIT_NOT_FOUND",
		);
	});
});
