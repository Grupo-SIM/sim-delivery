interface HoursRow {
	closed: boolean;
	closesAt: string | null;
	opensAt: string | null;
	weekday: number;
}

function toMinutes(time: string): number {
	const [hours, minutes] = time.split(":").map(Number);
	return hours * 60 + minutes;
}

/**
 * Whether a unit is open at `now`. The manual override (isOpenManual) always wins; otherwise
 * the weekly schedule for the current weekday decides (docs/04). Times are local "HH:mm";
 * a closing time <= opening time is treated as crossing midnight.
 */
export function isUnitOpen(hours: HoursRow[], isOpenManual: boolean | null, now: Date = new Date()): boolean {
	if (isOpenManual !== null) {
		return isOpenManual;
	}

	const today = hours.find(row => row.weekday === now.getDay());
	if (!today || today.closed || !today.opensAt || !today.closesAt) {
		return false;
	}

	const current = now.getHours() * 60 + now.getMinutes();
	const open = toMinutes(today.opensAt);
	const close = toMinutes(today.closesAt);

	return close <= open ? current >= open || current < close : current >= open && current < close;
}
