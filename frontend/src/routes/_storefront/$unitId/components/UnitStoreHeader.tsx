import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StarRating } from "@/components/ui/StarRating";
import type { GetPublicUnits200 } from "@/lib/api";
import { UnitContactLinks } from "./UnitContactLinks";
import { UnitSwitcher } from "./UnitSwitcher";

interface UnitStoreHeaderProps {
	unit: GetPublicUnits200[number];
	unitSlug: string;
	units?: GetPublicUnits200;
}

export function UnitStoreHeader({ unit, unitSlug, units }: UnitStoreHeaderProps) {
	const { t } = useTranslation();
	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");

	return (
		<header className="space-y-3">
			<div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
				<SectionHeading
					className="mb-0 min-w-0"
					subtitle={address || t("store.chooseUnit.noAddress")}
					title={unit.name}
				/>
				<UnitContactLinks unit={unit} />
			</div>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<Badge
						className={
							unit.isOpenNow
								? "border-success/30 bg-success/10 text-success"
								: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground"
						}
					>
						{unit.isOpenNow ? t("store.status.open") : t("store.status.closed")}
					</Badge>
					{Number(unit.ratingCount) > 0 && (
						<StarRating average={unit.ratingAverage} count={Number(unit.ratingCount)} />
					)}
				</div>
				{units && <UnitSwitcher unitId={unitSlug} units={units} />}
			</div>
		</header>
	);
}
