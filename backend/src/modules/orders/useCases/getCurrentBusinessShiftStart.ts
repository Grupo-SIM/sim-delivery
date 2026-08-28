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
export function getCurrentBusinessShiftStart(hours: UnitHoursRow[], now: Date = new Date()): Date {
	for (let daysAgo = 0; daysAgo < 7; daysAgo += 1) {
		const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
		const schedule = hours.find(hour => hour.weekday === day.getDay());
		if (!schedule || schedule.closed || !schedule.opensAt || !schedule.closesAt) continue;

		const open = toMinutes(schedule.opensAt);
		const shiftStart = new Date(day);
		shiftStart.setHours(Math.floor(open / 60), open % 60, 0, 0);
		if (shiftStart <= now) return shiftStart;
	}

	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
