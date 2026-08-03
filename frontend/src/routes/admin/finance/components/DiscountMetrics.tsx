import { useTranslation } from "react-i18next";
import { DataTable } from "@/components/ui/DataTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";

interface DiscountMetricsProps {
	discounts?: {
		cashbackRedeemedCents: number;
		couponOrderCount: number;
		discountCents: number;
		discountShareOfGrossPercent: number;
		loyaltyPointsRedeemed: number;
		topCoupons: {
			code: string;
			discountCents: number;
			orderCount: number;
			revenueCents: number;
			type: string;
		}[];
	};
	formatCents: (value: number) => string;
	isPending: boolean;
}

export function DiscountMetrics({ discounts, formatCents, isPending }: DiscountMetricsProps) {
	const { t } = useTranslation();
	const loadingValue = <Skeleton className="h-6 w-20" />;

	const cards = [
		{
			label: t("admin.reports.finance.discounts.discounts"),
			value: discounts && formatCents(discounts.discountCents),
		},
		{
			label: t("admin.reports.finance.discounts.cashback"),
			value: discounts && formatCents(discounts.cashbackRedeemedCents),
		},
		{ label: t("admin.reports.finance.discounts.loyaltyPoints"), value: discounts?.loyaltyPointsRedeemed },
		{
			label: t("admin.reports.finance.discounts.shareOfGross"),
			value: discounts ? `${discounts.discountShareOfGrossPercent.toFixed(1)}%` : undefined,
		},
	];

	return (
		<section className="grid gap-6 lg:grid-cols-2">
			<div>
				<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.discounts.title")}</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					{cards.map(card => (
						<StatCard key={card.label} label={card.label} value={isPending ? loadingValue : card.value} />
					))}
				</div>
			</div>
			<div>
				<h2 className="mb-3 font-semibold text-base">{t("admin.reports.finance.discounts.topCoupons")}</h2>
				<DataTable tableClassName="!min-w-0 table-fixed">
					<thead>
						<tr className="border-border border-b text-left text-muted-foreground">
							<th className="p-3">{t("admin.reports.finance.discounts.columns.code")}</th>
							<th className="p-3 text-right">{t("admin.reports.finance.discounts.columns.orders")}</th>
							<th className="p-3 text-right">{t("admin.reports.finance.discounts.columns.discount")}</th>
						</tr>
					</thead>
					<tbody>
						{isPending ? (
							<tr>
								<td className="p-3" colSpan={3}>
									<Skeleton className="h-4 w-full" />
								</td>
							</tr>
						) : !discounts || discounts.topCoupons.length === 0 ? (
							<tr>
								<td className="p-8 text-center text-muted-foreground" colSpan={3}>
									{t("admin.reports.empty")}
								</td>
							</tr>
						) : (
							discounts.topCoupons.map(coupon => (
								<tr className="border-border/60 border-b last:border-0" key={coupon.code}>
									<td className="p-3 font-medium">{coupon.code}</td>
									<td className="p-3 text-right">{coupon.orderCount}</td>
									<td className="p-3 text-right">{formatCents(coupon.discountCents)}</td>
								</tr>
							))
						)}
					</tbody>
				</DataTable>
			</div>
		</section>
	);
}
