import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetBranding, useGetPublicUnits } from "@/lib/api";
import { slug } from "@/lib/variant";
import { StorefrontBannerCarousel, StorefrontBannerSkeleton } from "../components/storefront";
import { unitSearchSchema } from "./components/unit-search";
import { UnitHeroCard, UnitStorePage, WelcomeHero } from "./components";

function StorePage() {
	const { t } = useTranslation();
	const { data: branding, isPending: isBrandingPending } = useGetBranding(slug ? { slug } : undefined);
	const { data: units, isError, isPending } = useGetPublicUnits({ slug });

	if (!isPending && !isError && units.length === 1) {
		return <UnitStorePage homepage unitSlug={units[0].slug} />;
	}

	return (
		<div className="storefront-home bg-background">
			{isBrandingPending ? (
				<StorefrontBannerSkeleton />
			) : branding?.homepageBannerUrls.length ? (
				<StorefrontBannerCarousel
					images={branding.homepageBannerUrls.map((src, index) => ({
						alt: `${t("store.chooseUnit.bannerAlt")} ${index + 1}`,
						src,
					}))}
					label={t("store.chooseUnit.bannerCarousel")}
				/>
			) : <WelcomeHero />}
			<section className="unit-selection-heading mx-auto max-w-6xl px-5 pt-12 pb-8 sm:pt-16" id="unidades">
				<p className="font-semibold text-primary text-sm">{branding?.companyName ?? "JB DELIVERY"}</p>
				<h1 className="mt-2 max-w-2xl font-display text-4xl text-foreground sm:text-5xl">
					{t("store.chooseUnit.title")}
				</h1>
				<p className="mt-3 max-w-xl text-lg text-muted-foreground">{t("store.chooseUnit.subtitle")}</p>
			</section>

			<section className="unit-selection mx-auto max-w-6xl px-5 pb-12">
				{isPending || isBrandingPending ? (
					<div className="grid grid-cols-2 gap-3 sm:gap-5">
						<Skeleton className="aspect-[1.2] w-full rounded-3xl" />
						<Skeleton className="aspect-[1.2] w-full rounded-3xl" />
					</div>
				) : isError ? (
					<ErrorState title={t("store.chooseUnit.loadError")} />
				) : units.length === 0 ? (
					<EmptyState title={t("store.chooseUnit.empty")} />
				) : (
					<div className="grid grid-cols-2 gap-3 sm:gap-5">
						{units.map(unit => (
							<UnitHeroCard
								key={unit.id}
								openLabel={t("store.status.open")}
								unit={unit}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

export const Route = createFileRoute("/_storefront/")({
	component: StorePage,
	validateSearch: unitSearchSchema,
});
