import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicUnits, useGetPublicUnitsByUnitSlugMenu } from "@/lib/api";
import { slug } from "@/lib/variant";
import { useDeliveryMethodStore, useSelectedUnitStore } from "@/stores";
import {
	CartBar,
	DeliveryMethodSelector,
	InfoPill,
	MenuBrowser,
	StoreInfoModal,
	UnitBanner,
	UnitSwitcher,
} from "./components";
import { money } from "./components/types";

function UnitStorePage() {
	const { t } = useTranslation();
	const { unitId: unitSlug } = Route.useParams();
	const { data: units } = useGetPublicUnits({ slug });
	const menu = useGetPublicUnitsByUnitSlugMenu(unitSlug, { slug });
	const unit = units?.find(item => item.slug === unitSlug);
	const [profileOpen, setProfileOpen] = useState(false);
	const getMethod = useDeliveryMethodStore(state => state.getMethod);
	const setSelectedUnit = useSelectedUnitStore(state => state.setUnit);

	// Remember the unit the customer is browsing so it persists into checkout and later visits.
	useEffect(() => {
		if (unit) setSelectedUnit({ id: unit.id, name: unit.name, slug: unit.slug });
	}, [unit, setSelectedUnit]);

	if (!unit) {
		return (
			<Container className="space-y-4 py-8">
				<ErrorState title={t("store.unit.notFound")} />
				<Link className="text-primary text-sm" to="/">
					← {t("store.unit.change")}
				</Link>
			</Container>
		);
	}

	const address = [unit.addressLine, unit.neighborhood, unit.city].filter(Boolean).join(", ");
	const minOrder = Number(unit.minOrderCents);
	const fee = Number(unit.deliveryFee);
	const prepMin = unit.prepTimeMinMinutes != null ? Number(unit.prepTimeMinMinutes) : null;
	const prepMax = unit.prepTimeMaxMinutes != null ? Number(unit.prepTimeMaxMinutes) : null;
	const hasDelivery = unit.deliveryMethods.includes("delivery");
	const deliveryMethod = getMethod(unit.id, unit.deliveryMethods);

	return (
		<>
			<UnitBanner bannerUrl={unit.bannerUrl} />
			<Container className="space-y-4 py-8">
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

				<div className="flex flex-wrap items-center gap-2">
					<DeliveryMethodSelector deliveryMethods={unit.deliveryMethods} unitId={unit.id} />
					{prepMin != null && prepMax != null && (
						<InfoPill>
							⏱ {prepMin}–{prepMax} min
						</InfoPill>
					)}
					{minOrder > 0 && (
						<InfoPill>
							{t("store.unit.minOrder")} {money.format(minOrder / 100)}
						</InfoPill>
					)}
					{hasDelivery && deliveryMethod === "delivery" && (
						<InfoPill>
							{t("store.cart.deliveryFee")}:{" "}
							{fee > 0 ? money.format(fee / 100) : t("store.unit.freeDelivery")}
						</InfoPill>
					)}
					<button
						className="text-primary text-xs underline-offset-2 hover:underline"
						onClick={() => setProfileOpen(true)}
						type="button"
					>
						{t("store.unit.storeProfile")}
					</button>
				</div>

				{menu.isPending ? (
					<Skeleton className="h-64 w-full" />
				) : menu.isError ? (
					<ErrorState title={t("store.menu.loadError")} />
				) : (
					<MenuBrowser sections={menu.data} unitId={unit.id} unitSlug={unitSlug} />
				)}

				<CartBar
					deliveryFee={fee}
					minOrderCents={minOrder}
					sections={menu.data ?? []}
					unitId={unit.id}
					unitSlug={unitSlug}
				/>

				<StoreInfoModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} unit={unit} />
			</Container>
		</>
	);
}

export const Route = createFileRoute("/_storefront/$unitId/")({
	component: UnitStorePage,
});
