import type { PrismaInstance } from "@/shared/infra/sql";
import type { GetOriginMetricsQuery, OriginMetricsReturn } from "../dtos";

/**
 * Orders/revenue/average ticket per campaign origin, plus overall totals for the applied filters. Only sold orders count: payment confirmed (or partially
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
				...(query.utmSource ? { firstUtmSource: query.utmSource.toLowerCase() } : {}),
				...(query.utmMedium ? { firstUtmMedium: query.utmMedium.toLowerCase() } : {}),
				...(query.utmCampaign ? { firstUtmCampaign: query.utmCampaign.toLowerCase() } : {}),
				...(query.utmContent ? { firstUtmContent: query.utmContent.toLowerCase() } : {}),
				...(query.search
					? {
							OR: [
								{ id: { contains: query.search } },
								{ customer: { user: { name: { contains: query.search, mode: "insensitive" as const } } } },
								{ customer: { phone: { contains: query.search } } },
							],
						}
					: {}),
				createdAt: {
					...(query.from ? { gte: new Date(query.from) } : {}),
					...(query.to ? { lte: new Date(query.to) } : {}),
				},
				payment: { is: { status: { in: ["confirmed", "partially_refunded"] } } },
				status: { notIn: ["cancelado", "falta_de_pagamento"] },
			},
		});
		const groups = new Map<string, OriginMetricsReturn["origins"][number]>();
		let totals = { orders: 0, revenueCents: 0 };
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
			totals = { orders: totals.orders + 1, revenueCents: totals.revenueCents + revenue };
		}
		const withTicket = (value: { orders: number; revenueCents: number }) => ({
			...value,
			averageTicketCents: value.orders ? Math.round(value.revenueCents / value.orders) : 0,
		});
		return {
			totals: withTicket(totals),
			origins: [...groups.values()].map(withTicket).sort((a, b) => b.revenueCents - a.revenueCents),
		};
	}
}
