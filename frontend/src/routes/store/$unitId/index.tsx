import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useGetPublicUnits } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { variantKey } from "@/lib/variant";

function UnitStorePage() {
	const { t } = useTranslation();
	const { unitId } = Route.useParams();
	const { data: units } = useGetPublicUnits({ variantKey });
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

			<p className="text-muted-foreground text-sm">{t("store.unit.menuSoon")}</p>
		</Container>
	);
}

export const Route = createFileRoute("/store/$unitId/")({
	component: UnitStorePage,
});
