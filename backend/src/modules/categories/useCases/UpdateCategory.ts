import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryReturn, UpdateCategoryBody } from "../dtos";
import { CategoryErrors } from "../errors";

export class UpdateCategory {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		categoryId: string,
		data: UpdateCategoryBody,
	): Promise<CategoryReturn> {
		const category = await this.prisma.category.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: categoryId },
		});
		if (!category) {
			throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		}

		return this.prisma.category.update({ data, where: { id: categoryId } });
	}
}
