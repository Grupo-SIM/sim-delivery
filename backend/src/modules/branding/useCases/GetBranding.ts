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
				companyName: null,
				footerText: null,
				ga4Id: null,
				gtmId: null,
				logoUrl: null,
				metaPixelId: null,
				themeColors: null,
			};
		}

		const company = await this.prisma.company.findUnique({
			select: {
				footerText: true,
				ga4Id: true,
				gtmId: true,
				logoUrl: true,
				metaPixelId: true,
				name: true,
				themeColors: true,
			},
			where: { id: resolvedCompanyId },
		});

		return {
			companyName: company?.name ?? null,
			footerText: company?.footerText ?? null,
			ga4Id: company?.ga4Id ?? null,
			gtmId: company?.gtmId ?? null,
			logoUrl: company?.logoUrl ?? null,
			metaPixelId: company?.metaPixelId ?? null,
			themeColors: (company?.themeColors as BrandingReturn["themeColors"]) ?? null,
		};
	}
}
