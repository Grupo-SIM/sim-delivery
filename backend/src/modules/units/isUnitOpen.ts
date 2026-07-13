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

	const current = now.getHours() * 60 + now.getMinutes();
	const isOpenDuringDay = (day: HoursRow | undefined) => {
		if (!day || day.closed || !day.opensAt || !day.closesAt) {
			return false;
		}

		const open = toMinutes(day.opensAt);
		const close = toMinutes(day.closesAt);
		if (close === open) {
			return true;
		}

		return close > open ? current >= open && current < close : current >= open;
	};

	const weekday = now.getDay();
	const today = hours.find(row => row.weekday === weekday);
	if (isOpenDuringDay(today)) {
		return true;
	}

	const yesterday = hours.find(row => row.weekday === (weekday + 6) % 7);
	if (!yesterday || yesterday.closed || !yesterday.opensAt || !yesterday.closesAt) {
		return false;
	}

	const yesterdayOpen = toMinutes(yesterday.opensAt);
	const yesterdayClose = toMinutes(yesterday.closesAt);

	return yesterdayClose < yesterdayOpen && current < yesterdayClose;
}
