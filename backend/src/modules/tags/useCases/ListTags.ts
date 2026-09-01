import type { PrismaInstance } from "@/shared/infra/sql";
import type { Role } from "@/shared/permissions";
import type { TagListReturn } from "../dtos";

export class ListTags {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, role?: Role, userId?: string): Promise<TagListReturn> {
		const staffUserId = role !== undefined && !["owner", "superAdmin"].includes(role) ? userId : undefined;
		const staffProductScope = staffUserId
			? { unitProducts: { some: { unit: { staffUnits: { some: { userId: staffUserId } } } } } }
			: undefined;
		const tags = await this.prisma.tag.findMany({
			include: {
				products: {
					include: { product: true },
					...(staffProductScope ? { where: { product: staffProductScope } } : {}),
				},
			},
			orderBy: [{ name: "asc" }],
			where: {
				...(companyId ? { companyId } : {}),
				...(staffProductScope ? { products: { some: { product: staffProductScope } } } : {}),
			},
		});
		return tags.map(tag => ({ ...tag, products: tag.products?.map(item => item.product) ?? [] }));
	}
}
