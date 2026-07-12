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

		if (!resolvedCompanyId) {
			return {
				footerText: null,
				ga4Id: null,
				gtmId: null,
				logoUrl: null,
				metaPixelId: null,
				primaryColor: null,
			};
		}

		const company = await this.prisma.company.findUnique({
			select: {
				footerText: true,
				ga4Id: true,
				gtmId: true,
				logoUrl: true,
				metaPixelId: true,
				primaryColor: true,
			},
			where: { id: resolvedCompanyId },
		});

		return {
			footerText: company?.footerText ?? null,
			ga4Id: company?.ga4Id ?? null,
			gtmId: company?.gtmId ?? null,
			logoUrl: company?.logoUrl ?? null,
			metaPixelId: company?.metaPixelId ?? null,
			primaryColor: company?.primaryColor ?? null,
		};
	}
}
