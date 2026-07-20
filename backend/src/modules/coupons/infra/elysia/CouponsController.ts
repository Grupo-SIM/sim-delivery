import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CouponListReturn,
	CouponReturn,
	CreateCouponBody,
	UpdateCouponBody,
	ValidateCouponBody,
	ValidateCouponReturn,
} from "../../dtos";
import { CreateCoupon, DeleteCoupon, ListCoupons, UpdateCoupon, ValidateCoupon } from "../../useCases";

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
	)
	.group("/coupons", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createCoupon: new CreateCoupon(prisma),
				deleteCoupon: new DeleteCoupon(prisma),
				listCoupons: new ListCoupons(prisma),
				prisma,
				updateCoupon: new UpdateCoupon(prisma),
			}))
			.get(
				"/",
				async ({ listCoupons, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "coupons", "read");

					return listCoupons.execute(scope.companyId);
				},
				{ response: CouponListReturn },
			)
			.post(
				"/",
				async ({ body, createCoupon, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "coupons", "create");

					return createCoupon.execute(scope.companyId, body);
				},
				{ body: CreateCouponBody, response: CouponReturn },
			)
			.patch(
				"/:couponId",
				async ({ body, params, request, updateCoupon }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "coupons", "update");

					return updateCoupon.execute(scope.companyId, params.couponId, body);
				},
				{ body: UpdateCouponBody, response: CouponReturn },
			)
			.delete(
				"/:couponId",
				async ({ deleteCoupon, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "coupons", "delete");

					await deleteCoupon.execute(scope.companyId, params.couponId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
