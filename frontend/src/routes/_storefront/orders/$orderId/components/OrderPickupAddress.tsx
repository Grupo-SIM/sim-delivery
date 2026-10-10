import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PickupAddress } from "@/components/storefront";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPublicUnitsQueryOptions } from "@/lib/api";
import { slug } from "@/lib/variant";

export function OrderPickupAddress({ unitSlug }: { unitSlug: string }) {
	const { t } = useTranslation();
	const { data: units, isPending, isError } = useQuery(getPublicUnitsQueryOptions({ slug: slug ?? "" }));

	if (isPending) {
		return <div className="space-y-2 border-border border-t pt-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-5 w-full" /><Skeleton className="h-10 w-36" /></div>;
	}
	if (isError) return <p className="text-destructive text-sm">{t("store.checkout.order.pickupAddressError")}</p>;

	return <PickupAddress showMapLink unit={units?.find(unit => unit.slug === unitSlug)} />;
}
