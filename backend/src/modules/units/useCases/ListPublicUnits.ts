import type { PrismaInstance } from "@/shared/infra/sql";
import type { PublicUnitListReturn } from "../dtos";
import { isUnitOpen } from "../isUnitOpen";

/**
 * Lists the storefront units of the company that owns `slug` (the value baked into
 * each whitelabel build). Public/no-auth; returns [] for a missing or unknown variant.
 */
export class ListPublicUnits {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(slug: string | undefined): Promise<PublicUnitListReturn> {
		if (!slug) {
			return [];
		}

		const company = await this.prisma.company.findUnique({ where: { slug } });
		if (!company) {
			return [];
		}

		const units = await this.prisma.unit.findMany({
			include: {
				hours: true,
				promotionalImages: {
					include: { promotionalImage: true },
					orderBy: [{ position: "asc" }, { createdAt: "asc" }],
				},
			},
			orderBy: { createdAt: "asc" },
			where: { companyId: company.id },
		});

		return units.map(({ hours, promotionalImages, ...unit }) => ({
			addressLine: unit.addressLine,
			bannerUrl: unit.bannerUrl,
			city: unit.city,
			deliveryFee: unit.deliveryFee,
			deliveryMethods: unit.deliveryMethods,
			id: unit.id,
			isOpenNow: isUnitOpen(hours, unit.isOpenManual),
			minOrderCents: unit.minOrderCents,
			name: unit.name,
			neighborhood: unit.neighborhood,
			phone: unit.phone,
			prepTimeMaxMinutes: unit.prepTimeMaxMinutes,
			prepTimeMinMinutes: unit.prepTimeMinMinutes,
			promotionalImages: promotionalImages.map(row => row.promotionalImage),
			slug: unit.slug,
		}));
	}
}
