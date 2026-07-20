export type CouponDiscountType = "fixed" | "percent";

export interface CouponFormState {
	code: string;
	expiresAt: string;
	maxUses: number | null;
	minOrderCents: number;
	type: CouponDiscountType;
	unitId: string | null;
	value: number;
}

export const emptyCouponForm: CouponFormState = {
	code: "",
	expiresAt: "",
	maxUses: null,
	minOrderCents: 0,
	type: "percent",
	unitId: null,
	value: 0,
};

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

	const date = new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:00`);
	if (Number.isNaN(date.getTime())) throw new Error("Invalid date-time");

	return date;
}
