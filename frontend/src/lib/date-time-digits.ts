export function dateTimeToDigits(value: Date | number | null): string {
	if (!value) return "";

	const date = new Date(value);
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
		String(date.getHours()).padStart(2, "0"),
		String(date.getMinutes()).padStart(2, "0"),
	].join("");
}

export function dateTimeToDate(value: string): Date | null {
	if (!value) return null;
	if (value.length !== 12) throw new Error("Invalid date-time");

	const year = Number(value.slice(0, 4));
	const month = Number(value.slice(4, 6));
	const day = Number(value.slice(6, 8));
	const hours = Number(value.slice(8, 10));
	const minutes = Number(value.slice(10, 12));
	const date = new Date(year, month - 1, day, hours, minutes);
	if (
		Number.isNaN(date.getTime()) ||
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day ||
		date.getHours() !== hours ||
		date.getMinutes() !== minutes
	)
		throw new Error("Invalid date-time");

	return date;
}
