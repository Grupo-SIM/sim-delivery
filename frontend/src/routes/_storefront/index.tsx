import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuGift, LuIceCreamCone, LuPizza, LuUtensils } from "react-icons/lu";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGetPublicUnits } from "@/lib/api";
import { slug } from "@/lib/variant";
import { CategoryShortcut, UnitHeroCard } from "./components";

function StorePage() {
	const { t } = useTranslation();
	const { data: units, isError, isPending } = useGetPublicUnits({ slug });

	return (
		<div>
			<div className="bg-[#f6f7fb]">
				<section className="mx-auto max-w-6xl px-5 pt-12 pb-8 sm:pt-16">
					<p className="font-semibold text-primary text-sm">ZERO GRAU</p>
					<h1 className="mt-2 max-w-2xl font-display text-4xl text-brand-ink sm:text-5xl">{t("store.chooseUnit.title")}</h1>
					<p className="mt-3 max-w-xl text-muted-foreground text-lg">{t("store.chooseUnit.subtitle")}</p>
				</section>

				<section className="mx-auto max-w-6xl px-5 pb-12" id="unidades">
				{isPending ? (
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-80 w-full" />
						<Skeleton className="h-80 w-full" />
					</div>
				) : isError ? (
					<ErrorState title={t("store.chooseUnit.loadError")} />
				) : units.length === 0 ? (
					<EmptyState title={t("store.chooseUnit.empty")} />
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{units.map(unit => (
							<UnitHeroCard key={unit.id} openLabel={t("store.status.open")} unit={unit} />
						))}
					</div>
				)}
				</section>
			</div>

			<section className="bg-white">
				<div className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
					<h2 className="font-display text-3xl text-brand-ink">{t("store.home.explore")}</h2>
					<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<CategoryShortcut description={t("store.home.clubDesc")} icon={<LuGift />} imageUrl="https://img.icons8.com/fluency/512/gift.png" label={t("store.home.club")} tone="blue" />
						<CategoryShortcut description={t("store.home.pizzaDesc")} icon={<LuPizza />} imageUrl="https://img.icons8.com/fluency/512/pizza.png" label={t("store.home.pizza")} tone="red" />
						<CategoryShortcut description={t("store.home.acaiDesc")} icon={<LuIceCreamCone />} imageUrl="https://img.icons8.com/fluency/512/ice-cream-cone.png" label={t("store.home.acai")} tone="cyan" />
						<CategoryShortcut description={t("store.home.otherDesc")} icon={<LuUtensils />} imageUrl="https://img.icons8.com/fluency/512/restaurant.png" label={t("store.home.other")} tone="yellow" />
					</div>
				</div>
			</section>
		</div>
	);
}

export const Route = createFileRoute("/_storefront/")({
	component: StorePage,
});
