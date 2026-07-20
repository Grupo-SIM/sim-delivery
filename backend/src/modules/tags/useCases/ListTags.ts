import type { PrismaInstance } from "@/shared/infra/sql";
import type { TagListReturn } from "../dtos";

export class ListTags {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<TagListReturn> {
		const tags = await this.prisma.tag.findMany({
			include: { products: { include: { product: true } } },
			orderBy: [{ name: "asc" }],
			where: { ...(companyId ? { companyId } : {}) },
		});
		return tags.map(tag => ({ ...tag, products: tag.products?.map(item => item.product) ?? [] }));
	}
}
