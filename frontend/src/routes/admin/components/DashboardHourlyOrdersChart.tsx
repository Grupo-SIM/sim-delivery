interface DashboardPeriodOrdersChartProps {
	ordersByPeriod: { key: string; label: string; orderCount: number | string }[];
	title: string;
}

export function DashboardHourlyOrdersChart({ ordersByPeriod, title }: DashboardPeriodOrdersChartProps) {
	const maxOrders = Math.max(1, ...ordersByPeriod.map(item => Number(item.orderCount)));

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<div className="scrollbar-themed overflow-x-auto rounded-md border border-border bg-card px-5 py-4">
				<div aria-label={title} className="flex h-[193px] min-w-max items-end gap-1" role="img">
					{ordersByPeriod.map(item => {
						const { label } = item;
						const orderCount = Number(item.orderCount);
						const height = Math.max(orderCount > 0 ? 8 : 2, (orderCount / maxOrders) * 100);

						return (
							<div className="group flex h-full min-w-5 flex-1 flex-col justify-end" key={item.key}>
								<div
									className="w-full rounded-t-sm bg-primary transition-colors group-hover:bg-primary/75"
									style={{ height: `${height}%` }}
								/>
								<span className="mt-2 text-center text-[10px] text-muted-foreground">{label}</span>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
