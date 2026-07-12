import Elysia from "elysia";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { ValidateCouponBody, ValidateCouponReturn } from "../../dtos";
import { ValidateCoupon } from "../../useCases";

export const CouponsController = new Elysia({ detail: { tags: ["Coupons"] } })
	.use([GlobalPlugin])
	.group("/public/coupons", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				prisma,
				validateCoupon: new ValidateCoupon(prisma),
			}))
			.post("/validate", async ({ body, validateCoupon }) => validateCoupon.execute(body), {
				body: ValidateCouponBody,
				response: ValidateCouponReturn,
			}),
	);
