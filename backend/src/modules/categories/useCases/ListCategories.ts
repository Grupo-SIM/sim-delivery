import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryListReturn } from "../dtos";

export class ListCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<CategoryListReturn> {
		return this.prisma.category.findMany({
			orderBy: [{ position: "asc" }, { createdAt: "asc" }],
			where: { ...(companyId ? { companyId } : {}) },
		});
	}
}
