import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryReturn, CreateCategoryBody } from "../dtos";
import { CategoryErrors } from "../errors";

export class CreateCategory {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateCategoryBody): Promise<CategoryReturn> {
		if (!companyId) {
			throw new DomainError(CategoryErrors.NO_COMPANY);
		}

		return this.prisma.category.create({ data: { ...data, companyId } });
	}
}
