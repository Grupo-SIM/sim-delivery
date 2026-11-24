import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { isValidMerchantDocument } from "@/shared/merchant-document";
import { slugify } from "@/shared/slug";
import type { CreateUnitBody, UnitReturn } from "../dtos";
import { UnitErrors } from "../errors";

export class CreateUnit {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateUnitBody): Promise<UnitReturn> {
		if (!companyId) {
			throw new DomainError(UnitErrors.NO_COMPANY);
		}

		const cnpj = data.cnpj || null;
		if (cnpj && !isValidMerchantDocument(cnpj)) throw new DomainError(UnitErrors.INVALID_CNPJ);

		return this.prisma.unit.create({ data: { ...data, cnpj, companyId, slug: slugify(data.name, "unidade") } });
	}
}
