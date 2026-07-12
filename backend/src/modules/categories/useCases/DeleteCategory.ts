import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { CategoryErrors } from "../errors";

export class DeleteCategory {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, categoryId: string): Promise<void> {
		const category = await this.prisma.category.findFirst({
			where: { ...(companyId ? { companyId } : {}), id: categoryId },
		});
		if (!category) {
			throw new DomainError(CategoryErrors.CATEGORY_NOT_FOUND);
		}

		await this.prisma.category.delete({ where: { id: categoryId } });
	}
}
