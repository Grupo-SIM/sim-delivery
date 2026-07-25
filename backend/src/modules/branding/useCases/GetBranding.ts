import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, GetBrandingQuery } from "../dtos";

export class GetBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetBrandingQuery): Promise<BrandingReturn> {
		let resolvedCompanyId = companyId;

		if (!resolvedCompanyId && query.unitId) {
			const unit = await this.prisma.unit.findUnique({
				select: { companyId: true },
				where: { id: query.unitId },
			});
			resolvedCompanyId = unit?.companyId ?? null;
		}

		if (!resolvedCompanyId && query.slug) {
			const company = await this.prisma.company.findUnique({
				select: { id: true },
				where: { slug: query.slug },
			});
			resolvedCompanyId = company?.id ?? null;
		}

		if (!resolvedCompanyId) {
			return {
				allowThemeToggle: true,
				companyName: null,
				fontDisplay: null,
				fontDisplayUrl: null,
				fontFamily: null,
				fontFamilyUrl: null,
				footerFacebookUrl: null,
				footerInstagramUrl: null,
				footerPaymentMethods: [],
				footerSupportEmail: null,
				footerText: null,
				footerWhatsApp: null,
				ga4Id: null,
				gtmId: null,
				logoUrl: null,
				metaPixelId: null,
				orderStatusWhatsAppTemplates: null,
				themeColors: null,
			};
		}

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
			where: { id: resolvedCompanyId },
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
