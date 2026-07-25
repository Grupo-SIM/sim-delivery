import { CustomSelect } from "@/components/ui/CustomSelect";
import type { GetReportsDashboardAnalytics200GroupByEnumKey } from "@/lib/api";

interface DashboardOrdersByPeriodChartProps {
	groupBy: GetReportsDashboardAnalytics200GroupByEnumKey;
	onGroupByChange: (groupBy: GetReportsDashboardAnalytics200GroupByEnumKey) => void;
	options: readonly { label: string; value: GetReportsDashboardAnalytics200GroupByEnumKey }[];
	ordersByPeriod: { key: string; label: string; orderCount: number | string }[];
	selectLabel: string;
	title: string;
}

export function DashboardOrdersByPeriodChart({
	groupBy,
	onGroupByChange,
	options,
	ordersByPeriod,
	selectLabel,
	title,
}: DashboardOrdersByPeriodChartProps) {
	const maxOrders = Math.max(1, ...ordersByPeriod.map(item => Number(item.orderCount)));

	return (
		<section>
			<div className="mb-3 flex min-h-11 flex-wrap items-center justify-between gap-2">
				<h2 className="font-semibold text-base">{title}</h2>
				<div className="w-44">
					<CustomSelect
						className="h-9"
						onChange={value => onGroupByChange(value as GetReportsDashboardAnalytics200GroupByEnumKey)}
						options={[...options]}
						value={groupBy}
					/>
				</div>
			</div>
			<div className="overflow-x-auto rounded-md border border-border bg-card px-5 py-4">
				<div aria-label={title} className="flex h-[193px] min-w-max items-end gap-1" role="img">
					{ordersByPeriod.map(item => {
						const orderCount = Number(item.orderCount);
						const height = Math.max(orderCount > 0 ? 8 : 2, (orderCount / maxOrders) * 100);

						return (
							<div className="group flex h-full min-w-5 flex-1 flex-col justify-end" key={item.key}>
								<div
									className="w-full rounded-t-sm bg-primary transition-colors group-hover:bg-primary/75"
									style={{ height: `${height}%` }}
								/>
								<span className="mt-2 text-center text-[10px] text-muted-foreground">{item.label}</span>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
