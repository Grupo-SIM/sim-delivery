import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicUnits, useGetPublicUnitsByUnitIdMenu } from "@/lib/api";
import { variantKey } from "@/lib/variant";
import { CartBar, MenuBrowser, UnitSwitcher } from "./components";

function UnitStorePage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const { data: units } = useGetPublicUnits({ variantKey });
	const menu = useGetPublicUnitsByUnitIdMenu(unitId);
	const unit = units?.find(item => item.id === unitId);

	if (!unit) {
		return (
			<Container className="space-y-4 py-8">
				<ErrorState title={t("store.unit.notFound")} />
				<Link className="text-primary text-sm" to="/store">
					← {t("store.unit.change")}
				</Link>
			</Container>
		);
	}

	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");

	return (
		<Container className="space-y-4 py-8">
			<Link className="text-primary text-sm" to="/store">
				← {t("store.unit.change")}
			</Link>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-center gap-3">
					<SectionHeading subtitle={address || t("store.chooseUnit.noAddress")} title={unit.name} />
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
				{units && <UnitSwitcher unitId={unitId} units={units} />}
			</div>

			{menu.isPending ? (
				<Skeleton className="h-64 w-full" />
			) : menu.isError ? (
				<ErrorState title={t("store.menu.loadError")} />
			) : (
				<MenuBrowser sections={menu.data} unitId={unitId} />
			)}

			<CartBar unitId={unitId} />
		</Container>
	);
}

export const Route = createFileRoute("/store/$unitId/")({
	component: UnitStorePage,
});
