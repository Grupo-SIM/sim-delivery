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
}

const baseCompany: CompanyRow = {
	footerPaymentMethods: ["Pix"],
	id: "cmp_1",
	logoUrl: "https://cdn.zero-grau.com/logo.png",
	name: "Zero Grau",
	slug: "zero-grau",
	themeColors: { primary: "#ff0000" },
};

function makePrisma(opts: { companies?: CompanyRow[]; units?: { companyId: string; id: string }[] } = {}) {
	const { companies = [baseCompany], units = [{ companyId: "cmp_1", id: "unit_1" }] } = opts;
	const companyLookups: Record<string, unknown>[] = [];

	const prisma = {
		company: {
			findUnique: async ({ where }: { where: { id?: string; slug?: string } }) => {
				companyLookups.push(where);

				return (
					companies.find(
						company =>
							(where.id !== undefined && company.id === where.id) ||
							(where.slug !== undefined && company.slug === where.slug),
					) ?? null
				);
			},
		},
		unit: {
			findUnique: async ({ where }: { where: { id: string } }) =>
				units.find(unit => unit.id === where.id) ?? null,
		},
	} as unknown as PrismaInstance;

	return { companyLookups, prisma };
}

describe("GetBranding", () => {
	it("returns the scoped company's branding", async () => {
		const { prisma } = makePrisma();

		const result = await new GetBranding(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({
			companyName: "Zero Grau",
			footerPaymentMethods: ["Pix"],
			logoUrl: "https://cdn.zero-grau.com/logo.png",
			themeColors: { primary: "#ff0000" },
		});
	});

	it("resolves the company through the unit when unscoped", async () => {
		const { companyLookups, prisma } = makePrisma();

		const result = await new GetBranding(prisma).execute(null, { unitId: "unit_1" });

		expect(result.companyName).toBe("Zero Grau");
		expect(companyLookups.at(-1)).toEqual({ id: "cmp_1" });
	});

	it("resolves the company through the slug when unscoped", async () => {
		const { prisma } = makePrisma();

		expect((await new GetBranding(prisma).execute(null, { slug: "zero-grau" })).companyName).toBe(
			"Zero Grau",
		);
	});

	it("prefers the session scope over the query hints", async () => {
		const { prisma } = makePrisma({
			companies: [baseCompany, { ...baseCompany, id: "cmp_2", name: "Outra", slug: "outra" }],
		});

		const result = await new GetBranding(prisma).execute("cmp_1", { slug: "outra" });

		expect(result.companyName).toBe("Zero Grau");
	});

	it("returns empty branding when nothing identifies a company", async () => {
		const { prisma } = makePrisma();

		const result = await new GetBranding(prisma).execute(null, {});

		expect(result).toMatchObject({
			companyName: null,
			footerPaymentMethods: [],
			logoUrl: null,
			themeColors: null,
		});
	});

	it("returns empty branding for an unknown unit", async () => {
		const { prisma } = makePrisma({ units: [] });

		expect((await new GetBranding(prisma).execute(null, { unitId: "unit_missing" })).companyName).toBeNull();
	});

	it("returns empty branding for an unknown slug", async () => {
		const { prisma } = makePrisma();

		expect((await new GetBranding(prisma).execute(null, { slug: "nao-existe" })).companyName).toBeNull();
	});

	it("nulls every field when the resolved company is gone", async () => {
		const { prisma } = makePrisma({ companies: [] });

		const result = await new GetBranding(prisma).execute("cmp_1", {});

		expect(result).toMatchObject({ companyName: null, footerPaymentMethods: [], themeColors: null });
	});
});
