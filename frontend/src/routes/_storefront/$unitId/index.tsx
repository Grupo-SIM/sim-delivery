import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicUnits, useGetPublicUnitsByUnitSlugMenu } from "@/lib/api";
import { slug } from "@/lib/variant";
import { useSelectedUnitStore } from "@/stores";
import { StorefrontBannerCarousel } from "../../components/storefront";
import {
	CartBar,
	InfoPill,
	MenuBrowser,
	PromotionalCarousel,
	StoreHoursModal,
	StoreToolbar,
	UnitReviews,
	UnitStoreHeader,
	UnitStoreSkeleton,
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

	const minOrder = Number(unit.minOrderCents);
	const fee = Number(unit.deliveryFee);
	const prepMin = unit.prepTimeMinMinutes != null ? Number(unit.prepTimeMinMinutes) : null;
	const prepMax = unit.prepTimeMaxMinutes != null ? Number(unit.prepTimeMaxMinutes) : null;

	return (
		<>
			<StorefrontBannerCarousel
				images={unit.bannerUrls.map((src, index) => ({ alt: `${unit.name} — banner ${index + 1}`, src }))}
				label={t("store.unit.bannerCarousel")}
			/>
			<Container className="space-y-6 py-8">
				<UnitStoreHeader unit={unit} unitSlug={unitSlug} units={units} />

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

				<UnitReviews unitId={unit.id} />

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
