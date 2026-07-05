import { DomainError } from "@/shared/errors";
import { UserErrors } from "@/modules/users/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { UpdateBrandingDTO, BrandingReturn } from "../dtos";

export class UpdateBranding {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute({ companyId, footerText, logoUrl, primaryColor }: UpdateBrandingDTO): Promise<BrandingReturn> {
		if (!companyId) throw new DomainError(UserErrors.FORBIDDEN);

		const company = await this.prisma.company.update({
			data: { footerText, logoUrl, primaryColor },
			select: { footerText: true, logoUrl: true, primaryColor: true },
			where: { id: companyId },
		});

		return {
			footerText: company.footerText ?? null,
			logoUrl: company.logoUrl ?? null,
			primaryColor: company.primaryColor ?? null,
		};
	}
}
