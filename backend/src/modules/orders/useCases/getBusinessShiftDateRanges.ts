interface UnitHoursRow {
	closed: boolean;
	closesAt: string | null;
	opensAt: string | null;
	weekday: number;
}

function shiftRange(hours: UnitHoursRow[], date: Date) {
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const end = new Date(start);
	const schedule = hours.find(hour => hour.weekday === start.getDay());
	if (!schedule || schedule.closed || !schedule.opensAt || !schedule.closesAt) {
		end.setDate(end.getDate() + 1);
		const previousDay = new Date(start);
		previousDay.setDate(previousDay.getDate() - 1);
		const previous = hours.find(hour => hour.weekday === previousDay.getDay());
		if (
			previous &&
			!previous.closed &&
			previous.opensAt &&
			previous.closesAt &&
			previous.closesAt <= previous.opensAt
		) {
			const [hour, minute] = previous.closesAt.split(":").map(Number);
			start.setHours(hour, minute);
		}
	} else {
		const [openHour, openMinute] = schedule.opensAt.split(":").map(Number);
		const [closeHour, closeMinute] = schedule.closesAt.split(":").map(Number);
		start.setHours(openHour, openMinute);
		end.setHours(closeHour, closeMinute);
		if (end <= start) end.setDate(end.getDate() + 1);
	}
	return { gte: start, lt: end };
}

/** Selected dates identify the day each shift opens, including its overnight tail. */
export function getBusinessShiftDateRanges(hours: UnitHoursRow[], from?: string, to?: string) {
	if (!from) return to ? [{ lt: shiftRange(hours, new Date(`${to}T00:00:00`)).lt }] : [];
	if (!to) return [{ gte: shiftRange(hours, new Date(`${from}T00:00:00`)).gte }];
	const day = new Date(`${from}T00:00:00`);
	day.setHours(0, 0, 0, 0);
	const lastDay = new Date(`${to}T00:00:00`);
	lastDay.setHours(0, 0, 0, 0);
	const ranges = [];
	while (day <= lastDay) {
		ranges.push(shiftRange(hours, day));
		day.setDate(day.getDate() + 1);
	}
	return ranges;
}
