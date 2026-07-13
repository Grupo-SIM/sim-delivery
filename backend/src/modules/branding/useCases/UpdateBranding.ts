import { UserErrors } from "@/modules/users/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { BrandingReturn, UpdateBrandingDTO } from "../dtos";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({
		companyId,
		footerText,
		ga4Id,
		gtmId,
		logoUrl,
		metaPixelId,
		themeColors,
	}: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: { footerText, ga4Id, gtmId, logoUrl, metaPixelId, themeColors },
			select: {
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
			companyName: company.name,
			footerText: company.footerText ?? null,
			ga4Id: company.ga4Id ?? null,
			gtmId: company.gtmId ?? null,
			logoUrl: company.logoUrl ?? null,
			metaPixelId: company.metaPixelId ?? null,
			themeColors: (company.themeColors as BrandingReturn["themeColors"]) ?? null,
		};
	}
}
