import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetOriginMetricsQuery, OriginMetricsReturn } from "../dtos";

/**
 * Orders/revenue/average ticket per campaign origin. Only sold orders count: payment confirmed (or partially
 * refunded) and not cancelled. Revenue is `total` minus what was refunded.
 */
export class GetOriginMetrics {
	constructor(private readonly prisma: PrismaInstance) {}

	async execute(companyId: string | null, query: GetOriginMetricsQuery): Promise<OriginMetricsReturn> {
		const orders = await this.prisma.order.findMany({
			select: {
				firstUtmCampaign: true,
				firstUtmContent: true,
				firstUtmMedium: true,
				firstUtmSource: true,
				refundedCents: true,
				total: true,
			},
			where: {
				...(companyId ? { companyId } : {}),
				...(query.unitId ? { unitId: query.unitId } : {}),
				createdAt: {
					...(query.from ? { gte: new Date(query.from) } : {}),
					...(query.to ? { lte: new Date(query.to) } : {}),
				},
				payment: { is: { status: { in: ["confirmed", "partially_refunded"] } } },
				status: { not: "cancelado" },
			},
		});
		const groups = new Map<string, OriginMetricsReturn["origins"][number]>();
		let bio = { orders: 0, revenueCents: 0 };
		for (const order of orders) {
			const revenue = order.total - order.refundedCents;
			const key = [order.firstUtmSource, order.firstUtmMedium, order.firstUtmCampaign, order.firstUtmContent].join("|");
			const group = groups.get(key) ?? {
				averageTicketCents: 0,
				campaign: order.firstUtmCampaign,
				content: order.firstUtmContent,
				medium: order.firstUtmMedium,
				orders: 0,
				revenueCents: 0,
				source: order.firstUtmSource,
			};
			group.orders += 1;
			group.revenueCents += revenue;
			groups.set(key, group);
			if (order.firstUtmSource === "ig" && order.firstUtmMedium === "social" && order.firstUtmContent === "link_in_bio") {
				bio = { orders: bio.orders + 1, revenueCents: bio.revenueCents + revenue };
			}
		}
		const withTicket = (value: { orders: number; revenueCents: number }) => ({
			...value,
			averageTicketCents: value.orders ? Math.round(value.revenueCents / value.orders) : 0,
		});
		return {
			bio: withTicket(bio),
			origins: [...groups.values()].map(withTicket).sort((a, b) => b.revenueCents - a.revenueCents),
		};
	}
}
