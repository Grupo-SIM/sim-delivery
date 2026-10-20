import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/StarRating";
import type { GetPublicUnits200 } from "@/lib/api";
import { UnitContactLinks } from "./UnitContactLinks";
import { UnitSwitcher } from "./UnitSwitcher";

interface UnitStoreHeaderProps {
	onReviewsClick: () => void;
	unit: GetPublicUnits200[number];
	unitSlug: string;
	units?: GetPublicUnits200;
}

export function UnitStoreHeader({ onReviewsClick, unit, unitSlug, units }: UnitStoreHeaderProps) {
	const { t } = useTranslation();
	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");

	return (
		<header className="unit-store-header space-y-3">
			<div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
				<h1 className="min-w-0 font-display text-3xl text-primary">{unit.name}</h1>
				<UnitContactLinks unit={unit} />
			</div>
			<p className="text-muted-foreground text-sm">{address || t("store.chooseUnit.noAddress")}</p>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<Badge
						data-open={unit.isOpenNow}
						className={
							unit.isOpenNow
								? "border-success/30 bg-success/10 text-success"
								: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
						}
					>
						{unit.isOpenNow ? t("store.status.open") : t("store.status.closed")}
					</Badge>
					{Number(unit.ratingCount) > 0 && (
						<button
							aria-label={t("store.unit.reviews.title")}
							className="cursor-pointer rounded-md border border-transparent focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
							onClick={onReviewsClick}
							type="button"
						>
							<StarRating average={unit.ratingAverage} count={Number(unit.ratingCount)} />
						</button>
					)}
				</div>
				{units && <UnitSwitcher unitId={unitSlug} units={units} />}
			</div>
		</header>
	);
}
