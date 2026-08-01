import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";

interface FinancialTrendProps {
	formatCents: (value: number) => string;
	isPending: boolean;
	rows: { label: string; netRevenueCents: number }[];
	title: string;
}

export function FinancialTrend({ formatCents, isPending, rows, title }: FinancialTrendProps) {
	const maximum = Math.max(1, ...rows.map(row => row.netRevenueCents));

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<ScrollArea className="overflow-x-auto rounded-md border border-border bg-card p-5">
				{isPending ? (
					<Skeleton className="h-52 min-w-[36rem]" />
				) : (
					<div aria-label={title} className="flex h-52 min-w-max items-end gap-3" role="img">
						{rows.map(row => (
							<div className="flex h-full min-w-10 flex-1 flex-col justify-end" key={row.label}>
								<span className="mb-1 text-center text-[10px] text-muted-foreground">
									{formatCents(row.netRevenueCents)}
								</span>
								<div
									className="rounded-t bg-primary"
									style={{ height: `${Math.max(2, (row.netRevenueCents / maximum) * 100)}%` }}
								/>
								<span className="mt-2 text-center text-[10px] text-muted-foreground">{row.label}</span>
							</div>
						))}
					</div>
				)}
			</ScrollArea>
		</section>
	);
}
