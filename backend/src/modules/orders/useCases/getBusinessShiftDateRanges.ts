import { zonedDate } from "./zonedTime";

interface UnitHoursRow {
	closed: boolean;
	closesAt: string | null;
	opensAt: string | null;
	weekday: number;
}

function shiftRange(hours: UnitHoursRow[], year: number, month: number, day: number, timeZone?: string) {
	const weekdayOf = (offset: number) => new Date(Date.UTC(year, month, day + offset)).getUTCDay();
	const at = (offset: number, time?: string) => {
		const [hour, minute] = time ? time.split(":").map(Number) : [0, 0];
		return zonedDate(year, month, day + offset, hour, minute, timeZone);
	};
	let start = at(0);
	let end = at(1);
	const schedule = hours.find(hour => hour.weekday === weekdayOf(0));
	if (!schedule || schedule.closed || !schedule.opensAt || !schedule.closesAt) {
		const previous = hours.find(hour => hour.weekday === weekdayOf(-1));
		if (
			previous &&
			!previous.closed &&
			previous.opensAt &&
			previous.closesAt &&
			previous.closesAt <= previous.opensAt
		) {
			start = at(0, previous.closesAt);
		}
	} else {
		start = at(0, schedule.opensAt);
		end = at(0, schedule.closesAt);
		if (end <= start) end = at(1, schedule.closesAt);
	}
	return { gte: start, lt: end };
}

function parseDay(value: string) {
	const [year, month, day] = value.split("-").map(Number);
	return { day, month: month - 1, year };
}

/** Selected dates identify the day each shift opens, including its overnight tail. */
export function getBusinessShiftDateRanges(hours: UnitHoursRow[], from?: string, to?: string, timeZone?: string) {
	const range = (value: string, offset = 0) => {
		const { day, month, year } = parseDay(value);
		return shiftRange(hours, year, month, day + offset, timeZone);
	};
	if (!from) return to ? [{ lt: range(to).lt }] : [];
	if (!to) return [{ gte: range(from).gte }];
	const first = parseDay(from);
	const last = parseDay(to);
	const count = Math.round((Date.UTC(last.year, last.month, last.day) - Date.UTC(first.year, first.month, first.day)) / 86400000);
	const ranges = [];
	for (let offset = 0; offset <= count; offset += 1) ranges.push(range(from, offset));
	return ranges;
}
