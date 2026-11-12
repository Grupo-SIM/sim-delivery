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

export { dateTimeToDate, dateTimeToDigits } from "@/lib/date-time-digits";
