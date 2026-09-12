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

const weekdayByName: Record<string, number> = {
	Fri: 5,
	Mon: 1,
	Sat: 6,
	Sun: 0,
	Thu: 4,
	Tue: 2,
	Wed: 3,
};

function getLocalTime(now: Date, timeZone?: string): { current: number; weekday: number } {
	if (!timeZone) {
		return { current: now.getHours() * 60 + now.getMinutes(), weekday: now.getDay() };
	}

	try {
		const parts = new Intl.DateTimeFormat("en-US", {
			hour: "2-digit",
			hourCycle: "h23",
			minute: "2-digit",
			timeZone,
			weekday: "short",
		}).formatToParts(now);
		const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
		const weekday = weekdayByName[values.weekday];

		if (weekday === undefined || !values.hour || !values.minute) {
			throw new Error("Unable to read local time");
		}

		return { current: Number(values.hour) * 60 + Number(values.minute), weekday };
	} catch {
		return { current: now.getHours() * 60 + now.getMinutes(), weekday: now.getDay() };
	}
}

/**
 * Whether a unit is open at `now`. The manual override (isOpenManual) always wins; otherwise
 * the weekly schedule for the current weekday decides (docs/04). Times are local "HH:mm";
 * a closing time <= opening time is treated as crossing midnight.
 */
export function isUnitOpen(
	hours: HoursRow[],
	isOpenManual: boolean | null,
	now: Date = new Date(),
	timeZone?: string,
): boolean {
	if (isOpenManual !== null) {
		return isOpenManual;
	}

	const { current, weekday } = getLocalTime(now, timeZone);
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
