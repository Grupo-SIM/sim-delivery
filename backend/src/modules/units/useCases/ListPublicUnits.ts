import type { PrismaInstance } from "@/shared/infra/sql";
import type { PublicUnitListReturn } from "../dtos";
import { isUnitOpen } from "../isUnitOpen";

/**
 * Lists the storefront units of the company that owns `variantKey` (the value baked into
 * each whitelabel build). Public/no-auth; returns [] for a missing or unknown variant.
 */
export class ListPublicUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(variantKey: string | undefined): Promise<PublicUnitListReturn> {
		if (!variantKey) {
			return [];
		}

		const company = await this.prisma.company.findUnique({ where: { variantKey } });
		if (!company) {
			return [];
		}

		const units = await this.prisma.unit.findMany({
			include: { hours: true },
			orderBy: { createdAt: "asc" },
			where: { companyId: company.id },
		});

		return units.map(({ hours, ...unit }) => ({
			addressLine: unit.addressLine,
			city: unit.city,
			deliveryMethods: unit.deliveryMethods,
			id: unit.id,
			isOpenNow: isUnitOpen(hours, unit.isOpenManual),
			name: unit.name,
			neighborhood: unit.neighborhood,
			phone: unit.phone,
		}));
	}
}
