import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { GetBranding } from "./GetBranding";

interface CompanyRow {
	footerPaymentMethods: string[];
	id: string;
	logoUrl: string | null;
	name: string;
	slug: string;
	themeColors: unknown;
	unitFallbackImageUrl: string | null;
}

const baseCompany: CompanyRow = {
	footerPaymentMethods: ["Pix"],
	id: "cmp_1",
	logoUrl: "https://cdn.zero-grau.com/logo.png",
	name: "Zero Grau",
	slug: "zero-grau",
	themeColors: { primary: "#ff0000" },
	unitFallbackImageUrl: "https://cdn.zero-grau.com/unit-fallback.png",
};

function makePrisma(opts: { companies?: CompanyRow[] } = {}) {
	const { companies = [baseCompany] } = opts;
	const prisma = {
		company: {
			findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
				return (
					companies.find(
						company =>
							(where.id !== undefined && company.id === where.id) ||
							(where.slug !== undefined && company.slug === where.slug),
					) ?? null
				);
			},
		},
	} as unknown as PrismaInstance;

	return { prisma };
}

describe("GetBranding", () => {
	it("returns the scoped company's branding", async () => {
		const { prisma } = makePrisma();

		const result = await new GetBranding(prisma).execute({ slug: "zero-grau" });

		expect(result).toMatchObject({
			companyName: "Zero Grau",
			footerPaymentMethods: ["Pix"],
			logoUrl: "https://cdn.zero-grau.com/logo.png",
			themeColors: { primary: "#ff0000" },
			unitFallbackImageUrl: "https://cdn.zero-grau.com/unit-fallback.png",
		});
	});

	it("resolves the company through the supplied build slug", async () => {
		const { prisma } = makePrisma();

		expect((await new GetBranding(prisma).execute({ slug: "zero-grau" })).companyName).toBe(
			"Zero Grau",
		);
	});

	it("uses only the supplied static build slug", async () => {
		const { prisma } = makePrisma({
			companies: [baseCompany, { ...baseCompany, id: "cmp_2", name: "Outra", slug: "outra" }],
		});

		const result = await new GetBranding(prisma).execute({ slug: "outra" });

		expect(result.companyName).toBe("Outra");
	});

	it("returns empty branding when the build has no company slug", async () => {
		const { prisma } = makePrisma();

		expect((await new GetBranding(prisma).execute({})).companyName).toBeNull();
	});

	it("returns empty branding for an unknown slug", async () => {
		const { prisma } = makePrisma();

		expect((await new GetBranding(prisma).execute({ slug: "nao-existe" })).companyName).toBeNull();
	});

	it("nulls every field when the resolved company is gone", async () => {
		const { prisma } = makePrisma({ companies: [] });

		const result = await new GetBranding(prisma).execute({ slug: "zero-grau" });

		expect(result).toMatchObject({ companyName: null, footerPaymentMethods: [], themeColors: null });
	});
});
