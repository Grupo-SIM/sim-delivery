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

		const [units, ratings] = await Promise.all([
			this.prisma.unit.findMany({
				include: {
					hours: true,
					promotionalImages: {
						include: { promotionalImage: true },
						orderBy: [{ position: "asc" }, { createdAt: "asc" }],
					},
				},
				orderBy: { createdAt: "asc" },
				where: { active: true, companyId: company.id },
			}),
			this.prisma.review.groupBy({
				_avg: { rating: true },
				_count: { rating: true },
				by: ["orderId"],
				where: { companyId: company.id },
			}),
		]);
		const reviewedOrders = await this.prisma.order.findMany({
			select: { id: true, unitId: true },
			where: { id: { in: ratings.map(rating => rating.orderId) } },
		});
		const unitIdsByOrderId = new Map(reviewedOrders.map(order => [order.id, order.unitId]));
		const ratingsByUnit = new Map<string, { count: number; sum: number }>();
		for (const rating of ratings) {
			const unitId = unitIdsByOrderId.get(rating.orderId);
			if (!unitId || rating._avg.rating === null) continue;

			const entry = ratingsByUnit.get(unitId) ?? { count: 0, sum: 0 };
			entry.count += rating._count.rating;
			entry.sum += rating._avg.rating * rating._count.rating;
			ratingsByUnit.set(unitId, entry);
		}

		return units.map(({ hours, promotionalImages, ...unit }) => {
			const rating = ratingsByUnit.get(unit.id);
			return {
				addressLine: unit.addressLine,
				bannerUrl: unit.bannerUrl,
				city: unit.city,
				deliveryFee: unit.deliveryFee,
				deliveryMethods: unit.deliveryMethods,
				hours: hours.map(({ closed, closesAt, opensAt, weekday }) => ({
					closed,
					closesAt,
					opensAt,
					weekday,
				})),
				id: unit.id,
				imageUrl: unit.imageUrl,
				isOpenNow: isUnitOpen(hours, unit.isOpenManual),
				minOrderCents: unit.minOrderCents,
				name: unit.name,
				neighborhood: unit.neighborhood,
				phone: unit.phone,
				prepTimeMaxMinutes: unit.prepTimeMaxMinutes,
				prepTimeMinMinutes: unit.prepTimeMinMinutes,
				promotionalImages: promotionalImages.map(row => row.promotionalImage),
				ratingAverage: rating ? rating.sum / rating.count : null,
				ratingCount: rating?.count ?? 0,
				slug: unit.slug,
			};
		});
	}
}
