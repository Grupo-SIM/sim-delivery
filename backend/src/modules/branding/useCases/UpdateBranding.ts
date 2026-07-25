import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, UpdateBrandingDTO } from "../dtos";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		allowThemeToggle,
		companyId,
		footerFacebookUrl,
		footerInstagramUrl,
		footerPaymentMethods,
		footerSupportEmail,
		fontDisplay,
		fontDisplayUrl,
		fontFamily,
		fontFamilyUrl,
		footerText,
		footerWhatsApp,
		ga4Id,
		gtmId,
		logoUrl,
		metaPixelId,
		orderStatusWhatsAppTemplates,
		themeColors,
	}: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: {
				allowThemeToggle,
				fontDisplay,
				fontDisplayUrl,
				fontFamily,
				fontFamilyUrl,
				footerFacebookUrl,
				footerInstagramUrl,
				footerPaymentMethods,
				footerSupportEmail,
				footerText,
				footerWhatsApp,
				ga4Id,
				gtmId,
				logoUrl,
				metaPixelId,
				orderStatusWhatsAppTemplates,
				themeColors,
			},
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
			where: { id: companyId },
		});

		return {
			allowThemeToggle: company.allowThemeToggle,
			companyName: company.name,
			fontDisplay: company.fontDisplay ?? null,
			fontDisplayUrl: company.fontDisplayUrl ?? null,
			fontFamily: company.fontFamily ?? null,
			fontFamilyUrl: company.fontFamilyUrl ?? null,
			footerFacebookUrl: company.footerFacebookUrl ?? null,
			footerInstagramUrl: company.footerInstagramUrl ?? null,
			footerPaymentMethods: company.footerPaymentMethods,
			footerSupportEmail: company.footerSupportEmail ?? null,
			footerText: company.footerText ?? null,
			footerWhatsApp: company.footerWhatsApp ?? null,
			ga4Id: company.ga4Id ?? null,
			gtmId: company.gtmId ?? null,
			logoUrl: company.logoUrl ?? null,
			metaPixelId: company.metaPixelId ?? null,
			orderStatusWhatsAppTemplates:
				(company.orderStatusWhatsAppTemplates as BrandingReturn["orderStatusWhatsAppTemplates"]) ?? null,
			themeColors: (company.themeColors as BrandingReturn["themeColors"]) ?? null,
		};
	}
}
