function offsetMs(instant: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		hour: "numeric",
		hourCycle: "h23",
		minute: "numeric",
		month: "numeric",
		second: "numeric",
		timeZone,
		year: "numeric",
	}).formatToParts(new Date(instant));
	const v = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
	return Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second) - Math.floor(instant / 1000) * 1000;
}

/** Instant at which the wall clock in `timeZone` reads the given date/time. Falls back to server-local time. */
export function zonedDate(
	year: number,
	month: number,
	day: number,
	hour = 0,
	minute = 0,
	timeZone?: string,
): Date {
	if (timeZone) {
		try {
			const wall = Date.UTC(year, month, day, hour, minute);
			let instant = wall - offsetMs(wall, timeZone);
			instant = wall - offsetMs(instant, timeZone);
			return new Date(instant);
		} catch {
			// Invalid time zone: use server-local time.
		}
	}
	return new Date(year, month, day, hour, minute);
}

/** Calendar date (in `timeZone`) of an instant. */
export function zonedParts(now: Date, timeZone?: string): { day: number; month: number; year: number } {
	if (timeZone) {
		try {
			const parts = new Intl.DateTimeFormat("en-US", {
				day: "numeric",
				month: "numeric",
				timeZone,
				year: "numeric",
			}).formatToParts(now);
			const v = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
			return { day: v.day, month: v.month - 1, year: v.year };
		} catch {
			// Invalid time zone: use server-local time.
		}
	}
	return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
}
