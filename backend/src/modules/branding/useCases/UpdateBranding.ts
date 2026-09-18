import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, UpdateBrandingDTO } from "../dtos";
import { normalizeOrderStatusWhatsAppTemplates } from "../orderStatusWhatsAppTemplates";
import { normalizeOrderStatusEmailTemplates } from "../orderStatusEmailTemplates";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		allowThemeToggle,
		companyId,
		defaultTheme,
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
		homepageBannerUrls,
		logoUrl,
		metaPixelId,
		mobileIconUrl,
		orderStatusEmailTemplates,
		orderStatusWhatsAppTemplates,
		themeColors,
		unitFallbackImageUrl,
	}: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: {
				allowThemeToggle,
				defaultTheme,
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
				homepageBannerUrls,
				logoUrl,
				metaPixelId,
				mobileIconUrl,
				orderStatusEmailTemplates,
				orderStatusWhatsAppTemplates,
				themeColors,
				unitFallbackImageUrl,
			},
			select: {
				allowThemeToggle: true,
				defaultTheme: true,
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
				homepageBannerUrls: true,
				logoUrl: true,
				metaPixelId: true,
				mobileIconUrl: true,
				name: true,
				orderStatusEmailTemplates: true,
				orderStatusWhatsAppTemplates: true,
				themeColors: true,
				unitFallbackImageUrl: true,
				whatsAppConnection: { select: { connectedPhone: true } },
			},
			where: { id: companyId },
		});

		return {
			allowThemeToggle: company.allowThemeToggle,
			companyName: company.name,
			defaultTheme: company.defaultTheme === "dark" ? "dark" : "light",
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
			homepageBannerUrls: company.homepageBannerUrls,
			logoUrl: company.logoUrl ?? null,
			metaPixelId: company.metaPixelId ?? null,
			mobileIconUrl: company.mobileIconUrl ?? null,
			orderStatusEmailTemplates: normalizeOrderStatusEmailTemplates(company.orderStatusEmailTemplates),
			orderStatusWhatsAppTemplates: normalizeOrderStatusWhatsAppTemplates(
				company.orderStatusWhatsAppTemplates,
			),
			themeColors: (company.themeColors as BrandingReturn["themeColors"]) ?? null,
			unitFallbackImageUrl: company.unitFallbackImageUrl ?? null,
			whatsAppEnabled: Boolean(company.whatsAppConnection?.connectedPhone),
		};
	}
}
