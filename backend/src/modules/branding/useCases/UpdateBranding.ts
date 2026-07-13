import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, UpdateBrandingDTO } from "../dtos";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		bannerUrl,
		companyId,
		fontDisplay,
		fontDisplayUrl,
		fontFamily,
		fontFamilyUrl,
		footerText,
		ga4Id,
		gtmId,
		logoUrl,
		metaPixelId,
		themeColors,
	}: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: {
				bannerUrl,
				fontDisplay,
				fontDisplayUrl,
				fontFamily,
				fontFamilyUrl,
				footerText,
				ga4Id,
				gtmId,
				logoUrl,
				metaPixelId,
				themeColors,
			},
			select: {
				bannerUrl: true,
				fontDisplay: true,
				fontDisplayUrl: true,
				fontFamily: true,
				fontFamilyUrl: true,
				footerText: true,
				ga4Id: true,
				gtmId: true,
				logoUrl: true,
				metaPixelId: true,
				name: true,
				themeColors: true,
			},
			where: { id: companyId },
		});

		return {
			bannerUrl: company.bannerUrl ?? null,
			companyName: company.name,
			fontDisplay: company.fontDisplay ?? null,
			fontDisplayUrl: company.fontDisplayUrl ?? null,
			fontFamily: company.fontFamily ?? null,
			fontFamilyUrl: company.fontFamilyUrl ?? null,
			footerText: company.footerText ?? null,
			ga4Id: company.ga4Id ?? null,
			gtmId: company.gtmId ?? null,
			logoUrl: company.logoUrl ?? null,
			metaPixelId: company.metaPixelId ?? null,
			themeColors: (company.themeColors as BrandingReturn["themeColors"]) ?? null,
		};
	}
}
