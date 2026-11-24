import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { isValidMerchantDocument } from "@/shared/merchant-document";
import { slugify } from "@/shared/slug";
import type { UnitReturn, UpdateUnitBody } from "../dtos";
import { UnitErrors } from "../errors";

export class UpdateUnit {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string, data: UpdateUnitBody): Promise<UnitReturn> {
		const unit = await this.prisma.unit.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: unitId },
		});
		if (!unit) {
			throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		}

		const cnpj = data.cnpj === undefined ? undefined : data.cnpj || null;
		if (cnpj && !isValidMerchantDocument(cnpj)) throw new DomainError(UnitErrors.INVALID_CNPJ);

		return this.prisma.unit.update({
			data: { ...data, ...(cnpj !== undefined && { cnpj }), ...(data.name && { slug: slugify(data.name, "unidade") }) },
			where: { id: unitId },
		});
	}
}
