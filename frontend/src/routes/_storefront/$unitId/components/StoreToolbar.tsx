import { trackMetaEvent } from "@/lib/meta-pixel";
import { useTranslation } from "react-i18next";
import { LuClock3, LuSearch } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { DeliveryMethodSelector } from "./DeliveryMethodSelector";
import type { StoreHours } from "./store-hours-types";

interface StoreToolbarProps {
	deliveryMethods: string[];
	hours: StoreHours[];
	onHoursClick: () => void;
	onSearchChange: (value: string) => void;
	prepMax: number | null;
	prepMin: number | null;
	search: string;
	unitId: string;
}

export function StoreToolbar({
	deliveryMethods,
	hours,
	onHoursClick,
	onSearchChange,
	prepMax,
	prepMin,
	search,
	unitId,
}: StoreToolbarProps) {
	const { t } = useTranslation();
	const [localSearch, setLocalSearch] = useDebouncedInput(search, value => {
		onSearchChange(value);
		if (value.trim()) trackMetaEvent("Search", { search_string: value.trim() });
	});
	const today = hours.find(day => Number(day.weekday) === new Date().getDay());
	const todayHours =
		today && !today.closed && today.opensAt && today.closesAt ? `${today.opensAt}–${today.closesAt}` : null;
	return (
		<div className="store-toolbar grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/70 p-3 shadow-sm md:grid-cols-[1.2fr_1fr_minmax(15rem,1.4fr)] md:items-center">
			<div className="store-delivery-method space-y-1 px-2">
				<p className="text-muted-foreground text-xs">{t("store.unit.deliveryMethods")}</p>
				<DeliveryMethodSelector deliveryMethods={deliveryMethods} unitId={unitId} />
			</div>
			<button
				className="store-hours col-span-2 flex w-fit justify-self-start cursor-pointer items-center gap-3 rounded-lg border border-border px-2 py-1.5 text-left transition-colors hover:bg-muted md:col-span-1"
				onClick={onHoursClick}
				type="button"
			>
				<LuClock3 className="size-5 text-primary" />
				<div>
					<p className="text-muted-foreground text-xs">{t("store.unit.operation")}</p>
					<p className="font-semibold text-sm">{todayHours ?? "—"}</p>
					{prepMin != null && prepMax != null && (
						<p className="text-muted-foreground text-xs">
							{t("store.unit.etaRange", { max: prepMax, min: prepMin })}
						</p>
					)}
				</div>
			</button>
			<label className="store-search relative col-span-2 block md:col-span-1">
				<span className="sr-only">{t("store.menu.searchPlaceholder")}</span>
				<input
					className="h-12 w-full rounded-lg border border-input bg-surface text-card-foreground pr-11 pl-4 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
