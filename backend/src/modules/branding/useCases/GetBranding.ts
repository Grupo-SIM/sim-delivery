import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, GetBrandingQuery } from "../dtos";

export class GetBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ slug }: GetBrandingQuery): Promise<BrandingReturn> {
		const company = await this.prisma.company.findUnique({
			select: {
				allowThemeToggle: true,
				fontDisplay: true,
				fontDisplayUrl: true,
				fontFamily: true,
				fontFamilyUrl: true,
				footerFacebookUrl: true,
				footerInstagramUrl: true,
				footerPaymentMethods: true,
				footerSupportEmail: true,
				footerText: true,
				footerWhatsApp: true,
				ga4Id: true,
				gtmId: true,
				logoUrl: true,
				metaPixelId: true,
				name: true,
				orderStatusWhatsAppTemplates: true,
				themeColors: true,
			},
			where: { slug },
		});

		return {
			allowThemeToggle: company?.allowThemeToggle ?? true,
			companyName: company?.name ?? null,
			fontDisplay: company?.fontDisplay ?? null,
			fontDisplayUrl: company?.fontDisplayUrl ?? null,
			fontFamily: company?.fontFamily ?? null,
			fontFamilyUrl: company?.fontFamilyUrl ?? null,
			footerFacebookUrl: company?.footerFacebookUrl ?? null,
			footerInstagramUrl: company?.footerInstagramUrl ?? null,
			footerPaymentMethods: company?.footerPaymentMethods ?? [],
			footerSupportEmail: company?.footerSupportEmail ?? null,
			footerText: company?.footerText ?? null,
			footerWhatsApp: company?.footerWhatsApp ?? null,
			ga4Id: company?.ga4Id ?? null,
			gtmId: company?.gtmId ?? null,
			logoUrl: company?.logoUrl ?? null,
			metaPixelId: company?.metaPixelId ?? null,
			orderStatusWhatsAppTemplates:
				(company?.orderStatusWhatsAppTemplates as BrandingReturn["orderStatusWhatsAppTemplates"]) ?? null,
			themeColors: (company?.themeColors as BrandingReturn["themeColors"]) ?? null,
		};
	}
}
