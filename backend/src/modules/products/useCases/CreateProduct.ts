import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import { slugify } from "@/shared/slug";
import type { CreateProductBody, ProductReturn } from "../dtos";
import { ProductErrors } from "../errors";
import {
	mapProductTaxonomy,
	productTaxonomyInclude,
	validateTaxonomy,
} from "./taxonomy";

export class CreateProduct {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		data: CreateProductBody,
	): Promise<ProductReturn> {
		if (!companyId) throw new DomainError(ProductErrors.NO_COMPANY);
		const { categoryIds, tagIds, unitIds, ...fields } = data;
		await validateTaxonomy(this.prisma, companyId, categoryIds, tagIds);
		const selectedUnitIds =
			unitIds ??
			(
				await this.prisma.unit.findMany({
					select: { id: true },
					where: { companyId },
				})
			).map((unit) => unit.id);
		if (unitIds) {
			const unitsCount = await this.prisma.unit.count({
				where: { companyId, id: { in: selectedUnitIds } },
			});
			if (unitsCount !== selectedUnitIds.length)
				throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}
		const product = await this.prisma.product.create({
			data: {
				...fields,
				categories: {
					create: (categoryIds ?? []).map((categoryId) => ({
						categoryId,
					})),
				},
				companyId,
				slug: slugify(data.title, "produto"),
				tags: { create: (tagIds ?? []).map((tagId) => ({ tagId })) },
				unitProducts: {
					create: selectedUnitIds.map((unitId) => ({ unitId })),
				},
			},
			include: productTaxonomyInclude,
		});
		return mapProductTaxonomy(product);
	}
}
