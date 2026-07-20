import type { PrismaInstance } from "@/shared/infra/sql";
import type { CategoryListReturn } from "../dtos";

export class ListCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<CategoryListReturn> {
		const categories = await this.prisma.category.findMany({
			include: { products: { include: { product: true } } },
			orderBy: [{ position: "asc" }, { createdAt: "asc" }],
			where: { ...(companyId ? { companyId } : {}) },
		});
		return categories.map(category => ({
			...category,
			products: category.products?.map(item => item.product) ?? [],
		}));
	}
}
