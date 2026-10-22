import { useCartImages } from "@/hooks/use-cart-images";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
	StoreHoursModal,
	StoreToolbar,
	UnitReviews,
	UnitStoreHeader,
	UnitStoreSkeleton,
} from "../$unitId/components";
import { money } from "../$unitId/components/types";

export function UnitStorePage({ unitSlug, homepage = false }: { unitSlug: string; homepage?: boolean }) {
	const { t } = useTranslation();
	const productModal = useSearch({ strict: false });
	const navigate = useNavigate();
	const unitsQuery = useGetPublicUnits({ slug });
	const menu = useGetPublicUnitsByUnitSlugMenu(unitSlug, { slug });
	const units = unitsQuery.data;
	const unit = units?.find(item => item.slug === unitSlug);
	useCartImages(unit?.id, menu.data);
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
				images={[
					...unit.promotionalImages.map(image => ({ alt: image.title, href: image.linkUrl, src: image.imageUrl })),
					...unit.bannerUrls.map((src, index) => ({ alt: `${unit.name} — banner ${index + 1}`, src })),
				]}
				label={t("store.unit.bannerCarousel")}
			/>
			<Container className="unit-store-content space-y-6 py-5">
				<UnitStoreHeader onReviewsClick={() => setReviewsOpen(true)} unit={unit} unitSlug={unitSlug} units={units} />

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
							</div>
						}
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
			</Container>
		</>
	);
}
