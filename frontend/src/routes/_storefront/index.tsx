import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { useGetPublicUnits } from "@/lib/api";
import { slug } from "@/lib/variant";
import { StorefrontBanner, UnitCard } from "../components/storefront";

function StorePage() {
	const { t } = useTranslation();
	const branding = useLiveBranding();
	const { data: units, isError, isPending } = useGetPublicUnits({ slug });

	return (
		<>
			<StorefrontBanner branding={branding} />

			<section className="border-border/70 border-b bg-muted/35">
				<div className="mx-auto max-w-6xl px-5 py-7 sm:py-9">
					<p className="font-semibold text-primary text-sm uppercase tracking-[0.2em]">Peça onde estiver</p>
					<h1 className="mt-2 max-w-3xl font-display text-5xl tracking-wide sm:text-6xl">
						{t("store.chooseUnit.title")}
					</h1>
					<p className="mt-3 max-w-2xl text-muted-foreground text-xl">{t("store.chooseUnit.subtitle")}</p>
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-5 py-10 sm:py-14" id="unidades">
				{isPending ? (
					<div className="grid gap-5 sm:grid-cols-2">
						<Skeleton className="h-64 w-full" />
						<Skeleton className="h-64 w-full" />
					</div>
				) : isError ? (
					<ErrorState title={t("store.chooseUnit.loadError")} />
				) : units.length === 0 ? (
					<EmptyState title={t("store.chooseUnit.empty")} />
				) : (
					<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{units.map(unit => (
							<UnitCard key={unit.id} unit={unit} />
						))}
					</div>
				)}
			</section>
		</>
	);
}

export const Route = createFileRoute("/_storefront/")({
	component: StorePage,
});
