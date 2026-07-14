import { ProductErrors } from "@/modules/products/errors";
import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type { ProductUnitsReturn } from "../dtos";

export class SetProductUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	/** Replaces the whole set of units a product is assigned to, keeping existing
	 * per-unit overrides (price, stock, category, ...) intact for units that stay checked. */
	async execute(companyId: string | null, productId: string, unitIds: string[]): Promise<ProductUnitsReturn> {
		const product = companyId
			? await this.prisma.product.findFirst({ where: { companyId, id: productId } })
			: null;
		if (!product) {
			throw new DomainError(ProductErrors.PRODUCT_NOT_FOUND);
		}

		const uniqueUnitIds = [...new Set(unitIds)];
		if (uniqueUnitIds.length > 0) {
			const unitsCount = await this.prisma.unit.count({
				where: { ...(companyId ? { companyId } : {}), id: { in: uniqueUnitIds } },
			});
			if (unitsCount !== uniqueUnitIds.length) {
				throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
			}
		}

		const existing = await this.prisma.unitProduct.findMany({
			select: { unitId: true },
			where: { productId },
		});
		const existingUnitIds = existing.map(({ unitId }) => unitId);

		const toAdd = uniqueUnitIds.filter(unitId => !existingUnitIds.includes(unitId));
		const toRemove = existingUnitIds.filter(unitId => !uniqueUnitIds.includes(unitId));

		await this.prisma.$transaction([
			this.prisma.unitProduct.deleteMany({ where: { productId, unitId: { in: toRemove } } }),
			this.prisma.unitProduct.createMany({ data: toAdd.map(unitId => ({ productId, unitId })) }),
		]);

		return uniqueUnitIds;
	}
}
