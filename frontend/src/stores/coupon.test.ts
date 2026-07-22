import { beforeEach, describe, expect, it } from "bun:test";

import { installLocalStorageStub } from "./tests/local-storage-stub";

const storage = installLocalStorageStub();
const { useCouponStore } = await import("./coupon");

const coupon = { code: "DESC10", couponId: "coupon_1", discountCents: 1_000, type: "percent", value: 10 };

describe("coupon store", () => {
	beforeEach(() => {
		storage.clear();
		useCouponStore.setState({ coupons: {} });
	});

	it("remembers an applied coupon per unit", () => {
		useCouponStore.getState().setCoupon("unit_1", coupon);

		expect(useCouponStore.getState().getCoupon("unit_1")).toEqual(coupon);
		expect(useCouponStore.getState().getCoupon("unit_2")).toBeNull();
	});

	it("removes coupon when cleared", () => {
		useCouponStore.getState().setCoupon("unit_1", coupon);
		useCouponStore.getState().setCoupon("unit_1", null);

		expect(useCouponStore.getState().getCoupon("unit_1")).toBeNull();
	});

	it("persists coupon so it survives a reload", () => {
		useCouponStore.getState().setCoupon("unit_1", coupon);

		expect(JSON.parse(storage.get("coupon")!).state.coupons).toEqual({ unit_1: coupon });
	});
});
