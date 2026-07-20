import { t } from "elysia";
import { CouponPlain } from "sql/typebox";

/** Public shape of a coupon, reused across admin coupon endpoints. */
export const CouponReturn = CouponPlain;
export type CouponReturn = typeof CouponReturn.static;

export const CouponListReturn = t.Array(CouponReturn);
export type CouponListReturn = typeof CouponListReturn.static;
