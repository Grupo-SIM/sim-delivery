import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateBranding } from "./UpdateBranding";

describe("UpdateBranding", () => {
	it("persists and returns runtime footer details for scoped company", async () => {
		const prisma = {
			company: {
				update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => ({
					...data,
					fontDisplay: null,
					fontDisplayUrl: null,
					fontFamily: null,
					fontFamilyUrl: null,
					footerFacebookUrl: data.footerFacebookUrl ?? null,
					footerInstagramUrl: data.footerInstagramUrl ?? null,
					footerPaymentMethods: data.footerPaymentMethods ?? [],
					footerSupportEmail: data.footerSupportEmail ?? null,
					footerText: data.footerText ?? null,
					footerWhatsApp: data.footerWhatsApp ?? null,
					ga4Id: null,
					gtmId: null,
					homepageBannerUrls: data.homepageBannerUrls ?? [],
					logoUrl: null,
					name: where.id,
					orderStatusWhatsAppTemplates: null,
					themeColors: null,
					unitFallbackImageUrl: data.unitFallbackImageUrl ?? null,
				}),
			},
		} as unknown as PrismaInstance;

		const result = await new UpdateBranding(prisma).execute({
			companyId: "company_1",
			welcomeEyebrow: "Seu pedido online",
			welcomeTitle: "Bateu",
			welcomeTitleAccent: "Vontade?",
			welcomeDescription: "Direto na sua casa.",
			footerInstagramUrl: "https://instagram.com/zero-grau",
			footerPaymentMethods: ["Pix", "Crédito"],
			footerSupportEmail: "contato@zero-grau.com",
			footerWhatsApp: "5581999999999",
			homepageBannerUrls: ["https://cdn.zero-grau.com/homepage-banner.png"],
			unitFallbackImageUrl: "https://cdn.zero-grau.com/unit-fallback.png",
		});

		expect(result).toMatchObject({
			companyName: "company_1",
			welcomeEyebrow: "Seu pedido online",
			welcomeTitle: "Bateu",
			welcomeTitleAccent: "Vontade?",
			welcomeDescription: "Direto na sua casa.",
			footerInstagramUrl: "https://instagram.com/zero-grau",
			footerPaymentMethods: ["Pix", "Crédito"],
			footerSupportEmail: "contato@zero-grau.com",
			footerWhatsApp: "5581999999999",
			homepageBannerUrls: ["https://cdn.zero-grau.com/homepage-banner.png"],
			unitFallbackImageUrl: "https://cdn.zero-grau.com/unit-fallback.png",
		});
	});

	it("does not enable WhatsApp for a created session without a connected number", async () => {
		const prisma = {
			company: {
				update: async () => ({
					footerPaymentMethods: [],
					name: "Zero Grau",
					whatsAppConnection: { connectedPhone: null },
				}),
			},
		} as unknown as PrismaInstance;

		const result = await new UpdateBranding(prisma).execute({ companyId: "cmp_1" });

		expect(result.whatsAppEnabled).toBe(false);
	});

	it("rejects an unscoped update", async () => {
		const prisma = {
			company: {
				update: async () => {
					throw new Error("should not reach the database");
				},
			},
		} as unknown as PrismaInstance;

		// The controller passes `scope.companyId!`, so a super admin without a company
		// really does reach the use case with null despite what the DTO type says.
		await expect(
			new UpdateBranding(prisma).execute({ companyId: null as unknown as string }),
		).rejects.toThrow("FORBIDDEN");
	});

	it("allows removing all homepage banners", async () => {
		let persisted: unknown;
		const prisma = {
			company: {
				update: async ({ data }: { data: Record<string, unknown> }) => {
					persisted = data.homepageBannerUrls;
					return { ...data, footerPaymentMethods: [], name: "Zero Grau" };
				},
			},
		} as unknown as PrismaInstance;

		await new UpdateBranding(prisma).execute({ companyId: "cmp_1", homepageBannerUrls: [] });

		expect(persisted).toEqual([]);
	});

	it("updates only the caller's own company", async () => {
		const wheres: { id: string }[] = [];
		const prisma = {
			company: {
				update: async ({ where }: { data: Record<string, unknown>; where: { id: string } }) => {
					wheres.push(where);

					return { footerPaymentMethods: [], name: "Zero Grau" };
				},
			},
		} as unknown as PrismaInstance;

		await new UpdateBranding(prisma).execute({ companyId: "cmp_1", footerText: "Rodapé" });

		expect(wheres).toEqual([{ id: "cmp_1" }]);
	});
});
