import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Skeleton } from "@/components/ui/Skeleton";

interface CancellationByStageProps {
	formatCents: (value: number) => string;
	isPending: boolean;
	rows: { lostRevenueCents: number; orderCount: number; stage: string }[];
}

export function CancellationByStage({ formatCents, isPending, rows }: CancellationByStageProps) {
	const { t } = useTranslation();
	const title = t("admin.reports.finance.cancellation.byStage");
	const total = rows.reduce((sum, row) => sum + row.orderCount, 0) || 1;

	return (
		<section>
			<h2 className="mb-3 font-semibold text-base">{title}</h2>
			<ScrollArea className="rounded-md border border-border bg-card text-card-foreground p-5">
				{isPending ? (
					<Skeleton className="h-32" />
				) : rows.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{t("admin.reports.finance.cancellation.byStageEmpty")}
					</p>
				) : (
					<div aria-label={title} className="space-y-3" role="img">
						{rows.map(row => (
							<div key={row.stage}>
								<div className="mb-1 flex items-center justify-between text-sm">
									<span className="font-medium">
										{t(`admin.reports.finance.cancelStage.${row.stage}`, { defaultValue: row.stage })}
									</span>
									<span className="text-muted-foreground">
										{row.orderCount} · {formatCents(row.lostRevenueCents)}
									</span>
								</div>
								<div className="h-2 rounded-full bg-muted">
									<div
										className="h-2 rounded-full bg-primary"
										style={{ width: `${Math.max(4, (row.orderCount / total) * 100)}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				)}
			</ScrollArea>
		</section>
	);
}
