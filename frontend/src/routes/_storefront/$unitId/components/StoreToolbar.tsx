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
		<div className="store-toolbar flex flex-col gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm sm:grid sm:grid-cols-2 md:grid-cols-[auto_auto_1fr] md:items-center md:gap-4">
			<div className="store-delivery-method w-full sm:col-span-1 md:w-auto">
				<DeliveryMethodSelector deliveryMethods={deliveryMethods} unitId={unitId} />
			</div>
			<button
				aria-label={t("store.unit.operation")}
				className="store-hours flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2 text-left transition-colors hover:bg-muted sm:col-span-1 md:w-auto"
				onClick={onHoursClick}
				type="button"
			>
				<LuClock3 className="size-5 shrink-0 text-primary" />
				<div className="min-w-0">
					<p className="text-muted-foreground text-xs leading-none">{t("store.unit.operation")}</p>
					<p className="mt-1 font-semibold text-sm leading-none text-foreground">{todayHours ?? "—"}</p>
					{prepMin != null && prepMax != null && (
						<p className="mt-1 text-muted-foreground text-xs leading-none">
							{t("store.unit.etaRange", { max: prepMax, min: prepMin })}
						</p>
					)}
				</div>
			</button>
			<label className="store-search relative block w-full sm:col-span-2 md:col-span-1">
				<span className="sr-only">{t("store.menu.searchPlaceholder")}</span>
				<input
					className="h-11 w-full rounded-xl border border-input bg-surface text-card-foreground pr-11 pl-4 text-sm placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
					onChange={event => setLocalSearch(event.currentTarget.value)}
					placeholder={`${t("store.menu.searchPlaceholder")}...`}
					type="text"
					value={localSearch}
				/>
				<LuSearch className="absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
			</label>
		</div>
	);
}
