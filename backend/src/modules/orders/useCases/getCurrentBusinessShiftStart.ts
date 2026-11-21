import { zonedDate, zonedParts } from "./zonedTime";

interface UnitHoursRow {
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
 * Returns the beginning of the latest configured shift. It deliberately uses the
 * opening time rather than midnight, so a shift that crosses midnight remains one
 * operational period until the next shift begins.
 */
export function getCurrentBusinessShiftStart(hours: UnitHoursRow[], now: Date = new Date(), timeZone?: string): Date {
	const { day: today, month, year } = zonedParts(now, timeZone);
	for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
		const weekday = new Date(Date.UTC(year, month, today - daysAgo)).getUTCDay();
		const schedule = hours.find(hour => hour.weekday === weekday);
		if (!schedule || schedule.closed || !schedule.opensAt || !schedule.closesAt) continue;

		const open = toMinutes(schedule.opensAt);
		const shiftStart = zonedDate(year, month, today - daysAgo, Math.floor(open / 60), open % 60, timeZone);
		if (shiftStart <= now) return shiftStart;
	}

	return zonedDate(year, month, today, 0, 0, timeZone);
}
