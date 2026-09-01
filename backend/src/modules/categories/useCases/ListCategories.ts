import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { CategoryListReturn } from "../dtos";

export class ListCategories {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, role?: Role, userId?: string): Promise<CategoryListReturn> {
		const staffUserId = role !== undefined && !["owner", "superAdmin"].includes(role) ? userId : undefined;
		const staffProductScope = staffUserId
			? { unitProducts: { some: { unit: { staffUnits: { some: { userId: staffUserId } } } } } }
			: undefined;
		const categories = await this.prisma.category.findMany({
			include: {
				products: {
					include: { product: true },
					...(staffProductScope ? { where: { product: staffProductScope } } : {}),
				},
			},
			orderBy: [{ position: "asc" }, { createdAt: "asc" }],
			where: {
				...(companyId ? { companyId } : {}),
				...(staffProductScope ? { products: { some: { product: staffProductScope } } } : {}),
			},
		});
		return categories.map(category => ({
			...category,
			products: category.products?.map(item => item.product) ?? [],
		}));
	}
}
