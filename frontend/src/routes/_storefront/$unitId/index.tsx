import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicUnits, useGetPublicUnitsByUnitSlugMenu } from "@/lib/api";
import { slug } from "@/lib/variant";
import { useSelectedUnitStore } from "@/stores";
import {
	CartBar,
	InfoPill,
	MenuBrowser,
	PromotionalCarousel,
	StoreHoursModal,
	StoreToolbar,
	UnitBanner,
	UnitStoreSkeleton,
	UnitSwitcher,
} from "./components";
import { money } from "./components/types";

function UnitStorePage() {
	const { t } = useTranslation();
	const { unitId: unitSlug } = Route.useParams();
	const unitsQuery = useGetPublicUnits({ slug });
	const menu = useGetPublicUnitsByUnitSlugMenu(unitSlug, { slug });
	const units = unitsQuery.data;
	const unit = units?.find(item => item.slug === unitSlug);
	const [hoursOpen, setHoursOpen] = useState(false);
	const [search, setSearch] = useState("");
	const setSelectedUnit = useSelectedUnitStore(state => state.setUnit);

	useEffect(() => {
		if (unit) setSelectedUnit({ id: unit.id, name: unit.name, slug: unit.slug });
	}, [unit, setSelectedUnit]);

	if (unitsQuery.isPending) return <UnitStoreSkeleton />;

	if (unitsQuery.isError || !unit)
		return (
			<Container className="space-y-4 py-8">
				<ErrorState title={t("store.unit.notFound")} />
			</Container>
		);

	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const minOrder = Number(unit.minOrderCents);
	const fee = Number(unit.deliveryFee);
	const prepMin = unit.prepTimeMinMinutes != null ? Number(unit.prepTimeMinMinutes) : null;
	const prepMax = unit.prepTimeMaxMinutes != null ? Number(unit.prepTimeMaxMinutes) : null;

	return (
		<>
			<UnitBanner bannerUrl={unit.bannerUrl} />
			<Container className="space-y-6 py-8">
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
					{units && <UnitSwitcher unitId={unitSlug} units={units} />}
				</div>

				{menu.isPending ? (
					<Skeleton className="h-64 w-full" />
				) : menu.isError ? (
					<ErrorState title={t("store.menu.loadError")} />
				) : (
					<MenuBrowser
						header={
							<div className="space-y-3">
								<StoreToolbar
									deliveryFee={fee}
									deliveryMethods={unit.deliveryMethods}
									hours={unit.hours}
									onHoursClick={() => setHoursOpen(true)}
									onSearchChange={setSearch}
									prepMax={prepMax}
									prepMin={prepMin}
									search={search}
									unitId={unit.id}
								/>
								{minOrder > 0 && (
									<InfoPill>
										{t("store.unit.minOrder")} {money.format(minOrder / 100)}
									</InfoPill>
								)}
								<PromotionalCarousel images={unit.promotionalImages} />
							</div>
						}
						search={search}
						sections={menu.data}
						unitId={unit.id}
						unitSlug={unitSlug}
					/>
				)}

				<CartBar
					deliveryFee={fee}
					minOrderCents={minOrder}
					sections={menu.data ?? []}
					unitId={unit.id}
					unitSlug={unitSlug}
				/>
				<StoreHoursModal hours={unit.hours} isOpen={hoursOpen} onClose={() => setHoursOpen(false)} />
			</Container>
		</>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/")({ component: UnitStorePage });
