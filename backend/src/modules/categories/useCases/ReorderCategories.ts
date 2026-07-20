import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryListReturn } from "../dtos";
import { CategoryErrors } from "../errors";
import { ListCategories } from "./ListCategories";

export class ReorderCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, categoryIds: string[]): Promise<CategoryListReturn> {
		if (!companyId) throw new DomainError(CategoryErrors.NO_COMPANY);
		const count = await this.prisma.category.count({ where: { companyId, id: { in: categoryIds } } });
		if (count !== categoryIds.length) throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		await this.prisma.$transaction(
			categoryIds.map((id, position) => this.prisma.category.update({ data: { position }, where: { id } })),
		);
		return new ListCategories(this.prisma).execute(companyId);
	}
}
