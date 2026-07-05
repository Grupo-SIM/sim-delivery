import { DomainError } from "@/shared/errors";
import { UserErrors } from "@/modules/users/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UpdateBrandingDTO, BrandingReturn } from "../dtos";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, footerText, ga4Id, gtmId, logoUrl, metaPixelId, primaryColor }: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: { footerText, ga4Id, gtmId, logoUrl, metaPixelId, primaryColor },
			select: { footerText: true, ga4Id: true, gtmId: true, logoUrl: true, metaPixelId: true, primaryColor: true },
			where: { id: companyId },
		});

		return {
			footerText: company.footerText ?? null,
			ga4Id: company.ga4Id ?? null,
			gtmId: company.gtmId ?? null,
			logoUrl: company.logoUrl ?? null,
			metaPixelId: company.metaPixelId ?? null,
			primaryColor: company.primaryColor ?? null,
		};
	}
}
