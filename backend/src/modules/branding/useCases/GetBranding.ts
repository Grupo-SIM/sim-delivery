import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetBrandingQuery, BrandingReturn } from "../dtos";

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
			return { footerText: null, logoUrl: null, primaryColor: null };
		}

		const company = await this.prisma.company.findUnique({
			select: { footerText: true, logoUrl: true, primaryColor: true },
			where: { id: resolvedCompanyId },
		});

		return {
			footerText: company?.footerText ?? null,
			logoUrl: company?.logoUrl ?? null,
			primaryColor: company?.primaryColor ?? null,
		};
	}
}
