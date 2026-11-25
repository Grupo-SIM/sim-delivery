import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/Checkbox";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useGetUnits } from "@/lib/api";
import { canPrintNatively, listNativePrinters } from "@/lib/native-printer";
import { canAccessAllUnits } from "@/lib/staff-guard";
import { showToast, useAuthStore, useAutoPrintStore } from "@/stores";

/** Desktop-only: toggles silent receipt printing for new orders and picks the printer. */
export function AutoPrintControls() {
	const { t } = useTranslation();
	const { enabled, printer, setEnabled, setPrinter, setUnitId, unitId } = useAutoPrintStore();
	const role = useAuthStore(state => state.role);
	const unitsQuery = useGetUnits();
	const canViewAllUnits = canAccessAllUnits(role);
	const units = unitsQuery.data ?? [];
	const printersQuery = useQuery({ enabled: canPrintNatively(), queryFn: listNativePrinters, queryKey: ["native-printers"] });
	const printers = printersQuery.data ?? [];

	// Fixed per station, independent from the board filter. Staff limited to some units must pick one of them.
	useEffect(() => {
		if (canViewAllUnits || units.length === 0 || units.some(unit => unit.id === unitId)) return;
		setUnitId(units[0].id);
	}, [canViewAllUnits, setUnitId, unitId, units]);

	if (!canPrintNatively()) return null;

	const effectivePrinter = printer || printers.find(item => item.isDefault)?.name || "";

	function handleToggle(checked: boolean) {
		if (checked && !effectivePrinter) {
			showToast(t("admin.orders.autoPrint.noPrinter"), "negative");
			return;
		}
		if (checked && !printer) setPrinter(effectivePrinter);
		setEnabled(checked);
		showToast(t(checked ? "admin.orders.autoPrint.enabled" : "admin.orders.autoPrint.disabled"), "info");
	}

	return (
		<div className="space-y-1">
			<span className="font-medium text-sm">{t("admin.orders.autoPrint.unit")}</span>
			<CustomSelect
				ariaLabel={t("admin.orders.autoPrint.unit")}
				onChange={setUnitId}
				options={[
					...(canViewAllUnits ? [{ label: t("admin.orders.autoPrint.unitAll"), value: "" }] : []),
					...units.map(unit => ({ label: unit.name, value: unit.id })),
				]}
				value={unitId}
			/>
			<span className="font-medium text-sm">{t("admin.orders.autoPrint.printer")}</span>
			<div className="flex items-center gap-3">
				<CustomSelect
					ariaLabel={t("admin.orders.autoPrint.printer")}
					disabled={printers.length === 0}
					onChange={setPrinter}
					options={printers.map(item => ({ label: item.name, value: item.name }))}
					value={effectivePrinter}
				/>
				<div className="flex cursor-pointer items-center gap-2 text-sm">
					<Checkbox
						aria-label={t("admin.orders.autoPrint.label")}
						checked={enabled}
						id="auto-print"
						onChange={event => handleToggle(event.currentTarget.checked)}
					/>
					<label className="cursor-pointer whitespace-nowrap" htmlFor="auto-print">
						{t("admin.orders.autoPrint.label")}
					</label>
				</div>
			</div>
		</div>
	);
}
