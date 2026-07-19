import { describe, expect, it } from "bun:test";
import type { PrismaInstance } from "@/shared/infra/sql";
import { UpdateBranding } from "./UpdateBranding";

describe("UpdateBranding", () => {
	it("persists and returns runtime footer details for scoped company", async () => {
		const prisma = {
			company: {
				update: async ({ data, where }: { data: Record<string, unknown>; where: { id: string } }) => ({
					...data,
					footerFacebookUrl: data.footerFacebookUrl ?? null,
					footerInstagramUrl: data.footerInstagramUrl ?? null,
					footerPaymentMethods: data.footerPaymentMethods ?? [],
					footerSupportEmail: data.footerSupportEmail ?? null,
					footerText: data.footerText ?? null,
					footerWhatsApp: data.footerWhatsApp ?? null,
					fontDisplay: null,
					fontDisplayUrl: null,
					fontFamily: null,
					fontFamilyUrl: null,
					ga4Id: null,
					gtmId: null,
					logoUrl: null,
					name: where.id,
					orderStatusWhatsAppTemplates: null,
					themeColors: null,
				}),
			},
		} as unknown as PrismaInstance;

		const result = await new UpdateBranding(prisma).execute({
			companyId: "company_1",
			footerInstagramUrl: "https://instagram.com/zero-grau",
			footerPaymentMethods: ["Pix", "Crédito"],
			footerSupportEmail: "contato@zero-grau.com",
			footerWhatsApp: "5581999999999",
		});

		expect(result).toMatchObject({
			companyName: "company_1",
			footerInstagramUrl: "https://instagram.com/zero-grau",
			footerPaymentMethods: ["Pix", "Crédito"],
			footerSupportEmail: "contato@zero-grau.com",
			footerWhatsApp: "5581999999999",
		});
	});
});
