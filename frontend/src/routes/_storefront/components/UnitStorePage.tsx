import { useCartImages } from "@/hooks/use-cart-images";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { useGetPublicUnits, useGetPublicUnitsByUnitSlugMenu } from "@/lib/api";
import { branding } from "@/lib/branding";
import { slug } from "@/lib/variant";
import { StorefrontBannerCarousel } from "../../components/storefront";
import { useSelectedUnitStore } from "@/stores";
import {
	CartBar,
	InfoPill,
	MenuBrowser,
	StoreHoursModal,
	StoreToolbar,
	UnitReviews,
	UnitStoreHeader,
	UnitStoreSkeleton,
} from "../$unitId/components";
import { money } from "../$unitId/components/types";

/** Returns path+query+hash when `link` points at this app (relative or same origin as the app URL), else null. */
function toInternalPath(link: string) {
	try {
		const base = new URL(import.meta.env.VITE_APP_URL || branding.siteUrl || window.location.origin);
		const url = new URL(link, base);
		const origins = [base.origin, window.location.origin];
		if (!origins.includes(url.origin)) return null;
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return null;
	}
}

export function UnitStorePage({ unitSlug, homepage = false }: { unitSlug: string; homepage?: boolean }) {
	const { t } = useTranslation();
	const productModal = useSearch({ strict: false });
	const menuOnly = productModal.menuOnly === true;
	const navigate = useNavigate();
	const router = useRouter();
	const unitsQuery = useGetPublicUnits({ slug });
	const menu = useGetPublicUnitsByUnitSlugMenu(unitSlug, { slug });
	const units = unitsQuery.data;
	const unit = units?.find(item => item.slug === unitSlug);
	useCartImages(menuOnly ? undefined : unit?.id, menu.data);
	const [hoursOpen, setHoursOpen] = useState(false);
	const [reviewsOpen, setReviewsOpen] = useState(false);
	const [categoryNavDocked, setCategoryNavDocked] = useState(false);
	const [search, setSearch] = useState("");
	const setSelectedUnit = useSelectedUnitStore(state => state.setUnit);

	const openProductModal = useCallback((productId: string) => {
		void navigate({
			params: { unitId: unitSlug },
			resetScroll: false,
			search: current => ({ ...current, note: undefined, options: undefined, product: productId }),
			to: homepage ? "/" : "/$unitId",
		});
	}, [homepage, navigate, unitSlug]);

	const updateProductModal = useCallback((options: string | undefined, note: string) => {
		void navigate({
			params: { unitId: unitSlug },
			replace: true,
			resetScroll: false,
			search: current => ({ ...current, note: note || undefined, options, product: current.product }),
			to: homepage ? "/" : "/$unitId",
		});
	}, [homepage, navigate, unitSlug]);

	const closeProductModal = useCallback(() => {
		window.history.back();
	}, []);

	useEffect(() => {
		if (unit) setSelectedUnit({ id: unit.id, name: unit.name, slug: unit.slug });
	}, [unit, setSelectedUnit]);

	if (unitsQuery.isPending) return <UnitStoreSkeleton menuOnly={menuOnly} />;

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
			{!menuOnly && (
				<StorefrontBannerCarousel
					images={unit.bannerUrls.map((src, index) => {
						const link = unit.bannerLinks[index]?.trim();
						const internalPath = link ? toInternalPath(link) : null;
						return {
							alt: `${unit.name} — banner ${index + 1}`,
							href: link && !internalPath ? link : undefined,
							onSelect: internalPath ? () => router.history.push(internalPath) : undefined,
							src,
						};
					})}
					label={t("store.unit.bannerCarousel")}
				/>
			)}
			<Container className="unit-store-content space-y-6 py-5">
				{!menuOnly && <UnitStoreHeader onReviewsClick={() => setReviewsOpen(true)} unit={unit} unitSlug={unitSlug} units={units} />}

				{menu.isPending ? (
					<UnitStoreSkeleton contentOnly menuOnly={menuOnly} />
				) : menu.isError ? (
					<ErrorState title={t("store.menu.loadError")} />
				) : (
					<MenuBrowser
						menuOnly={menuOnly}
						taxes={productModal.taxes !== false}
						header={!menuOnly && (
							<div className="space-y-3">
								<StoreToolbar
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
							</div>
						)}
						modalNote={productModal.note}
						modalOptions={productModal.options}
						modalProductId={productModal.product}
						onCloseProductModal={closeProductModal}
						onCategoryNavDockedChange={setCategoryNavDocked}
						onOpenProductModal={openProductModal}
						onUpdateProductModal={updateProductModal}
						search={search}
						sections={menu.data}
						unitId={unit.id}
						unitSlug={unitSlug}
					/>
				)}

				{!menuOnly && (
					<>
						<CartBar
							categoryNavDocked={categoryNavDocked}
							deliveryFee={fee}
							minOrderCents={minOrder}
							sections={menu.data ?? []}
							unitId={unit.id}
							unitSlug={unitSlug}
						/>
						<StoreHoursModal hours={unit.hours} isOpen={hoursOpen} onClose={() => setHoursOpen(false)} />
						<UnitReviews isOpen={reviewsOpen} onClose={() => setReviewsOpen(false)} unitId={unit.id} />
					</>
				)}
			</Container>
		</>
	);
}
