import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetPublicUnits } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { variantKey } from "@/lib/variant";

function StorePage() {
	const { t } = useTranslation();
	const { data: units, isError, isPending } = useGetPublicUnits({ variantKey });

	return (
		<Container className="space-y-6 py-8">
			<SectionHeading subtitle={t("store.chooseUnit.subtitle")} title={t("store.chooseUnit.title")} />

			{isPending ? (
				<Skeleton className="h-40 w-full" />
			) : isError ? (
				<ErrorState title={t("store.chooseUnit.loadError")} />
			) : units.length === 0 ? (
				<EmptyState title={t("store.chooseUnit.empty")} />
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{units.map(unit => (
						<Link
							className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
							key={unit.id}
							params={{ unitId: unit.id }}
							to="/store/$unitId"
						>
							<div className="flex items-center justify-between gap-2">
								<span className="font-medium">{unit.name}</span>
								<Badge
									className={
										unit.isOpenNow
											? "border-green-500/30 bg-green-500/10 text-green-500"
											: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
									}
								>
									{unit.isOpenNow ? t("store.status.open") : t("store.status.closed")}
								</Badge>
							</div>
							<span className="text-muted-foreground text-sm">
								{[unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ") ||
									t("store.chooseUnit.noAddress")}
							</span>
						</Link>
					))}
				</div>
			)}
		</Container>
	);
}

export const Route = createFileRoute("/store/")({
	component: StorePage,
});
