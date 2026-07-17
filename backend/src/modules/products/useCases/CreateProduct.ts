import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { slugify } from "@/shared/slug";
import type { CreateProductBody, ProductReturn } from "../dtos";
import { ProductErrors } from "../errors";
import { mapProductTaxonomy, productTaxonomyInclude, validateTaxonomy } from "./taxonomy";

export class CreateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreateProductBody): Promise<ProductReturn> {
		if (!companyId) throw new DomainError(ProductErrors.NO_COMPANY);
		const { categoryIds, tagIds, ...fields } = data;
		await validateTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		const product = await this.prisma.product.create({
			data: {
				...fields,
				categories: { create: (categoryIds ?? []).map(categoryId => ({ categoryId })) },
				companyId,
				slug: slugify(data.title, "produto"),
				tags: { create: (tagIds ?? []).map(tagId => ({ tagId })) },
			},
			include: productTaxonomyInclude,
		});
		return mapProductTaxonomy(product);
	}
}
