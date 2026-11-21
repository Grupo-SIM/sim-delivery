import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import type { GetOrders200 } from "@/lib/api";
import { OrderStatusBadge } from "../OrderStatusBadge";
import { OrderCompactCard } from "./OrderCompactCard";
import { OrdersMobileSection } from "./OrdersMobileSection";
import type { MobileColumn, MobileFinalizedStatus } from "./types";

interface OrdersMobileListProps {
	canPrint: boolean;
	columns: MobileColumn[];
	finalizedStatuses: readonly MobileFinalizedStatus[];
}

export function OrdersMobileList({ canPrint, columns, finalizedStatuses }: OrdersMobileListProps) {
	const { t } = useTranslation();

	return (
		<ScrollArea className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-3">
			{columns.map(column => {
				const summary =
					column.kind === "finalized"
						? finalizedStatuses
								.map(status => ({
									count: column.orders.filter((order: GetOrders200[number]) => order.status === status).length,
									status,
								}))
								.filter(({ count }) => count > 0)
								.map(({ count, status }) => `${t(`admin.orders.status.${status}`)}: ${count}`)
								.join(" · ")
						: undefined;

				return (
					<OrdersMobileSection
						count={column.orders.length}
						defaultOpen={column.kind === "status" && column.orders.length > 0}
						key={column.status}
						summary={summary}
						title={
							column.kind === "finalized" ? (
								<span className="font-semibold text-sm">{t("admin.orders.kanban.finalized")}</span>
							) : (
								<OrderStatusBadge status={column.status} />
							)
						}
					>
						{column.orders.length === 0 ? (
							<p className="rounded-md border border-border border-dashed px-2 py-4 text-center text-muted-foreground text-xs">
								{t("admin.orders.kanban.emptyColumn")}
							</p>
						) : (
							column.orders.map((order: GetOrders200[number]) => (
								<OrderCompactCard
									canPrint={canPrint}
									key={order.id}
									order={order}
									showStatus={column.kind === "finalized"}
								/>
							))
						)}
					</OrdersMobileSection>
				);
			})}
		</ScrollArea>
	);
}
