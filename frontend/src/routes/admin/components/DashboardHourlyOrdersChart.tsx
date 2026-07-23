interface DashboardHourlyOrdersChartProps {
	ordersByHour: { hour: number | string; orderCount: number | string }[];
	title: string;
}

export function DashboardHourlyOrdersChart({ ordersByHour, title }: DashboardHourlyOrdersChartProps) {
	const maxOrders = Math.max(1, ...ordersByHour.map(item => Number(item.orderCount)));

	return (
		<section className="rounded-brand border border-border bg-card p-5 shadow-soft">
			<h2 className="font-semibold text-base">{title}</h2>
			<div aria-label={title} className="mt-6 flex h-48 items-end gap-1" role="img">
				{ordersByHour.map(item => {
					const hour = Number(item.hour);
					const orderCount = Number(item.orderCount);
					const height = Math.max(orderCount > 0 ? 8 : 2, (orderCount / maxOrders) * 100);

					return (
						<div className="group flex h-full min-w-0 flex-1 flex-col justify-end" key={hour}>
							<div
								aria-label={`${String(hour).padStart(2, "0")}:00: ${orderCount}`}
								className="w-full rounded-t-sm bg-primary transition-colors group-hover:bg-primary/75"
								style={{ height: `${height}%` }}
							/>
							{hour % 3 === 0 && (
								<span className="mt-2 text-center text-[10px] text-muted-foreground">{String(hour).padStart(2, "0")}</span>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
}
