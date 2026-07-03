import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CreateProductBody, ProductReturn } from "../dtos";
import { ProductErrors } from "../errors";

export class CreateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateProductBody): Promise<ProductReturn> {
		if (!companyId) {
			throw new DomainError(ProductErrors.NO_COMPANY);
		}

		return this.prisma.product.create({ data: { ...data, companyId } });
	}
}
