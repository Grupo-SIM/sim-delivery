import type { PrismaInstance } from "@/shared/infra/sql";
import type { UpdateProductAvailabilityBody, UpdateProductAvailabilityReturn } from "../dtos";

/** Pauses or resumes a product only in units the staff member is allowed to operate. */
export class UpdateProductAvailability {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(
		companyId: string | null,
		productId: string,
		data: UpdateProductAvailabilityBody,
		permittedUnitIds?: string[],
	): Promise<UpdateProductAvailabilityReturn> {
		const result = await this.prisma.unitProduct.updateMany({
			data,
			where: {
				productId,
				unit: {
					...(companyId ? { companyId } : {}),
					...(permittedUnitIds ? { id: { in: permittedUnitIds } } : {}),
				},
			},
		});

		return { updatedCount: result.count };
	}
}
