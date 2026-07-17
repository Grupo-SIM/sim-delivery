import { useTranslation } from "react-i18next";
import { LuClock3, LuSearch, LuTruck } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { DeliveryMethodSelector } from "./DeliveryMethodSelector";
import { money } from "./types";

interface StoreToolbarProps {
	deliveryFee: number;
	deliveryMethods: string[];
	isOpen: boolean;
	onSearchChange: (value: string) => void;
	prepMax: number | null;
	prepMin: number | null;
	search: string;
	unitId: string;
}

export function StoreToolbar({
	deliveryFee,
	deliveryMethods,
	isOpen,
	onSearchChange,
	prepMax,
	prepMin,
	search,
	unitId,
}: StoreToolbarProps) {
	const { t } = useTranslation();
	const [localSearch, setLocalSearch] = useDebouncedInput(search, onSearchChange);
	return (
		<div className="grid gap-3 rounded-xl border border-border bg-muted/70 p-3 shadow-sm md:grid-cols-[1fr_1.2fr_1fr_minmax(15rem,1.4fr)] md:items-center">
			<div className="flex items-center gap-3 px-2">
				<LuTruck className="size-5 text-primary" />
				<div>
					<p className="text-muted-foreground text-xs">{t("store.cart.deliveryFee")}</p>
					<p className="font-semibold text-sm">
						{deliveryFee > 0 ? money.format(deliveryFee / 100) : t("store.unit.freeDelivery")}
					</p>
				</div>
			</div>
			<div className="space-y-1 px-2">
				<p className="text-muted-foreground text-xs">{t("store.unit.deliveryMethods")}</p>
				<DeliveryMethodSelector deliveryMethods={deliveryMethods} unitId={unitId} />
			</div>
			<div className="flex items-center gap-3 px-2">
				<LuClock3 className="size-5 text-primary" />
				<div>
					<p className="text-muted-foreground text-xs">{t("store.unit.operation")}</p>
					<p className="font-semibold text-sm">
						<span className={isOpen ? "text-success" : "text-muted-foreground"}>
							{isOpen ? t("store.status.open") : t("store.status.closed")}
						</span>
						{prepMin != null && prepMax != null ? ` · ${prepMin}–${prepMax} min` : ""}
					</p>
				</div>
			</div>
			<label className="relative block">
				<span className="sr-only">{t("store.menu.searchPlaceholder")}</span>
				<input
					className="h-12 w-full rounded-lg border border-input bg-surface pr-11 pl-4 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					onChange={event => setLocalSearch(event.currentTarget.value)}
					placeholder={`${t("store.menu.searchPlaceholder")}...`}
					type="text"
					value={localSearch}
				/>
				<LuSearch className="absolute top-1/2 right-4 size-5 -translate-y-1/2" />
			</label>
		</div>
	);
}
