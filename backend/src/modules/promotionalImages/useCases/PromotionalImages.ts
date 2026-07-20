import { UnitErrors } from "@/modules/units/errors";
import { DomainError } from "@/shared/errors";
import type { PrismaInstance } from "@/shared/infra/sql";
import type {
	CreatePromotionalImageBody,
	PromotionalImageListReturn,
	PromotionalImageReturn,
	PromotionalImageUnitsReturn,
	UpdatePromotionalImageBody,
} from "../dtos";
import { PromotionalImageErrors } from "../errors";

export class ListPromotionalImages {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null): Promise<PromotionalImageListReturn> {
		if (!companyId) throw new DomainError(PromotionalImageErrors.NO_COMPANY);
		return this.prisma.promotionalImage.findMany({ orderBy: { createdAt: "asc" }, where: { companyId } });
	}
}

export class CreatePromotionalImage {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, data: CreatePromotionalImageBody): Promise<PromotionalImageReturn> {
		if (!companyId) throw new DomainError(PromotionalImageErrors.NO_COMPANY);
		return this.prisma.promotionalImage.create({ data: { ...data, companyId } });
	}
}

export class UpdatePromotionalImage {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		promotionalImageId: string,
		data: UpdatePromotionalImageBody,
	): Promise<PromotionalImageReturn> {
		const image = companyId
			? await this.prisma.promotionalImage.findFirst({ where: { companyId, id: promotionalImageId } })
			: null;
		if (!image) throw new DomainError(PromotionalImageErrors.PROMOTIONAL_IMAGE_NOT_FOUND);
		return this.prisma.promotionalImage.update({ data, where: { id: promotionalImageId } });
	}
}

export class DeletePromotionalImage {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, promotionalImageId: string): Promise<void> {
		const image = companyId
			? await this.prisma.promotionalImage.findFirst({ where: { companyId, id: promotionalImageId } })
			: null;
		if (!image) throw new DomainError(PromotionalImageErrors.PROMOTIONAL_IMAGE_NOT_FOUND);
		await this.prisma.promotionalImage.delete({ where: { id: promotionalImageId } });
	}
}

async function assertCompanyUnits(prisma: PrismaInstance, companyId: string, unitIds: string[]) {
	if (unitIds.length === 0) return;
	const count = await prisma.unit.count({ where: { companyId, id: { in: unitIds } } });
	if (count !== unitIds.length) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
}

export class ListPromotionalImageUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, promotionalImageId: string): Promise<PromotionalImageUnitsReturn> {
		const image = companyId
			? await this.prisma.promotionalImage.findFirst({ where: { companyId, id: promotionalImageId } })
			: null;
		if (!image) throw new DomainError(PromotionalImageErrors.PROMOTIONAL_IMAGE_NOT_FOUND);
		const rows = await this.prisma.unitPromotionalImage.findMany({
			select: { unitId: true },
			where: { promotionalImageId },
		});
		return rows.map(row => row.unitId);
	}
}

export class SetPromotionalImageUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		promotionalImageId: string,
		unitIds: string[],
	): Promise<PromotionalImageUnitsReturn> {
		if (!companyId) throw new DomainError(PromotionalImageErrors.NO_COMPANY);
		const image = await this.prisma.promotionalImage.findFirst({
			where: { companyId, id: promotionalImageId },
		});
		if (!image) throw new DomainError(PromotionalImageErrors.PROMOTIONAL_IMAGE_NOT_FOUND);
		const uniqueIds = [...new Set(unitIds)];
		await assertCompanyUnits(this.prisma, companyId, uniqueIds);
		await this.prisma.$transaction([
			this.prisma.unitPromotionalImage.deleteMany({ where: { promotionalImageId } }),
			this.prisma.unitPromotionalImage.createMany({
				data: uniqueIds.map((unitId, position) => ({ position, promotionalImageId, unitId })),
			}),
		]);
		return uniqueIds;
	}
}

export class ListUnitPromotionalImages {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, unitId: string): Promise<PromotionalImageListReturn> {
		const unit = companyId ? await this.prisma.unit.findFirst({ where: { companyId, id: unitId } }) : null;
		if (!unit) throw new DomainError(UnitErrors.UNIT_NOT_FOUND);
		const rows = await this.prisma.unitPromotionalImage.findMany({
			include: { promotionalImage: true },
			orderBy: [{ position: "asc" }, { createdAt: "asc" }],
			where: { unitId },
		});
		return rows.map(row => row.promotionalImage);
	}
}

export class SetUnitPromotionalImages {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		unitId: string,
		promotionalImageIds: string[],
	): Promise<PromotionalImageListReturn> {
		if (!companyId) throw new DomainError(PromotionalImageErrors.NO_COMPANY);
		await assertCompanyUnits(this.prisma, companyId, [unitId]);
		const uniqueIds = [...new Set(promotionalImageIds)];
		if (uniqueIds.length > 0) {
			const count = await this.prisma.promotionalImage.count({
				where: { companyId, id: { in: uniqueIds } },
			});
			if (count !== uniqueIds.length) {
				throw new DomainError(PromotionalImageErrors.PROMOTIONAL_IMAGE_NOT_FOUND);
			}
		}
		await this.prisma.$transaction([
			this.prisma.unitPromotionalImage.deleteMany({ where: { unitId } }),
			this.prisma.unitPromotionalImage.createMany({
				data: uniqueIds.map((promotionalImageId, position) => ({ position, promotionalImageId, unitId })),
			}),
		]);
		return new ListUnitPromotionalImages(this.prisma).execute(companyId, unitId);
	}
}
