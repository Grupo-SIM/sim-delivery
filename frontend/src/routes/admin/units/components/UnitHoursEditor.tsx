import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PatternFormat } from "react-number-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getUnitsByUnitIdHoursQueryKey, useGetUnitsByUnitIdHours, usePutUnitsByUnitIdHours } from "@/lib/api";
import { showAlert } from "@/stores";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

interface DayState {
	closed: boolean;
	closesAt: string;
	opensAt: string;
}

const emptyDay: DayState = { closed: true, closesAt: "", opensAt: "" };

function isAllowedTime({ value }: { value: string }) {
	if (value.length < 2) {
		return true;
	}
	if (Number(value.slice(0, 2)) > 23) {
		return false;
	}
	if (value.length < 4) {
		return true;
	}
	return Number(value.slice(2, 4)) <= 59;
}

function toTimeString(digits: string) {
	return digits.length === 4 ? `${digits.slice(0, 2)}:${digits.slice(2, 4)}` : null;
}

interface UnitHoursEditorProps {
	onClose: () => void;
	unitId: string | null;
}

export function UnitHoursEditor({ onClose, unitId }: UnitHoursEditorProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data, isPending } = useGetUnitsByUnitIdHours(unitId ?? undefined);
	const { isPending: isSaving, mutate } = usePutUnitsByUnitIdHours();
	const [days, setDays] = useState<DayState[]>(() => WEEKDAYS.map(() => ({ ...emptyDay })));

	const weekdayLabels = [
		t("admin.units.hours.weekdays.sun"),
		t("admin.units.hours.weekdays.mon"),
		t("admin.units.hours.weekdays.tue"),
		t("admin.units.hours.weekdays.wed"),
		t("admin.units.hours.weekdays.thu"),
		t("admin.units.hours.weekdays.fri"),
		t("admin.units.hours.weekdays.sat"),
	];

	useEffect(() => {
		if (!data) {
			return;
		}
		setDays(
			WEEKDAYS.map(weekday => {
				const row = data.find(hours => Number(hours.weekday) === weekday);
				return row
					? {
							closed: row.closed,
							closesAt: (row.closesAt ?? "").replace(":", ""),
							opensAt: (row.opensAt ?? "").replace(":", ""),
						}
					: { ...emptyDay };
			}),
		);
	}, [data]);

	function update(index: number, patch: Partial<DayState>) {
		setDays(prev => prev.map((day, i) => (i === index ? { ...day, ...patch } : day)));
	}

	function save() {
		if (!unitId) {
			return;
		}
		mutate(
			{
				data: {
					hours: days.map((day, weekday) => ({
						closed: day.closed,
						closesAt: day.closed ? null : toTimeString(day.closesAt),
						opensAt: day.closed ? null : toTimeString(day.opensAt),
						weekday,
					})),
				},
				unitId,
			},
			{
				onError: () => void showAlert(t("admin.units.hours.error")),
				onSuccess: async () => {
					await queryClient.invalidateQueries({ queryKey: getUnitsByUnitIdHoursQueryKey(unitId) });
					onClose();
				},
			},
		);
	}

	return (
		<Modal isOpen={unitId !== null} onClose={onClose} title={t("admin.units.hours.title")}>
			{isPending ? (
				<Skeleton className="h-64 w-full" />
			) : (
				<div className="space-y-3">
					{days.map((day, index) => (
						<div className="flex items-center gap-3" key={WEEKDAYS[index]}>
							<span className="w-24 text-sm">{weekdayLabels[index]}</span>
							<label className="flex items-center gap-1 text-muted-foreground text-xs">
								<input
									checked={day.closed}
									onChange={event => update(index, { closed: event.currentTarget.checked })}
									type="checkbox"
								/>
								{t("admin.units.hours.closed")}
							</label>
							<PatternFormat
								className="w-28"
								customInput={Input}
								disabled={day.closed}
								format="##:##"
								isAllowed={isAllowedTime}
								mask="_"
								onValueChange={({ value }) => update(index, { opensAt: value })}
								value={day.opensAt}
							/>
							<span className="text-muted-foreground">—</span>
							<PatternFormat
								className="w-28"
								customInput={Input}
								disabled={day.closed}
								format="##:##"
								isAllowed={isAllowedTime}
								mask="_"
								onValueChange={({ value }) => update(index, { closesAt: value })}
								value={day.closesAt}
							/>
						</div>
					))}

					<div className="flex justify-end gap-2 pt-2">
						<Button onClick={onClose} type="button" variant="outline">
							{t("admin.units.hours.cancel")}
						</Button>
						<Button disabled={isSaving} onClick={save} type="button">
							{isSaving ? t("admin.units.hours.saving") : t("admin.units.hours.save")}
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
