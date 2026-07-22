import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppliedCoupon {
	code: string;
	couponId: string;
	discountCents: string | number;
	type: string;
	value: string | number;
}

interface CouponState {
	coupons: Record<string, AppliedCoupon>;
	getCoupon: (unitId: string) => AppliedCoupon | null;
	setCoupon: (unitId: string, coupon: AppliedCoupon | null) => void;
}

export const useCouponStore = create<CouponState>()(
	persist(
		(set, get) => ({
			coupons: {},
			getCoupon: unitId => get().coupons[unitId] ?? null,
			setCoupon: (unitId, coupon) =>
				set(state => {
					if (coupon) return { coupons: { ...state.coupons, [unitId]: coupon } };
					const { [unitId]: _, ...coupons } = state.coupons;
					return { coupons };
				}),
		}),
		{ name: "coupon" },
	),
);
