import { useTranslation } from "react-i18next";
import { LuMapPin } from "react-icons/lu";
import type { GetPublicUnits200 } from "@/lib/api";

interface PickupAddressProps {
	unit: Pick<GetPublicUnits200[number], "addressLine" | "neighborhood" | "city"> | undefined;
	showMapLink?: boolean;
}

export function PickupAddress({ unit, showMapLink = false }: PickupAddressProps) {
	const { t } = useTranslation();
	const address = [unit?.addressLine, unit?.neighborhood, unit?.city].filter(Boolean).join(", ");

	return (
		<div className="space-y-2 border-border border-t pt-3 text-sm">
			<p className="flex items-center gap-2 font-semibold">
				<LuMapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
				{t("store.checkout.order.pickupAddress")}
			</p>
			<p>{address || t("store.chooseUnit.noAddress")}</p>
			{showMapLink && address && (
				<a
					className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-primary/40 px-3 py-2 font-semibold text-primary hover:bg-primary/10"
					href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
					rel="noopener noreferrer"
					target="_blank"
				>
					<LuMapPin aria-hidden="true" className="size-4" />
					{t("store.checkout.order.openMap")}
				</a>
			)}
		</div>
	);
}
