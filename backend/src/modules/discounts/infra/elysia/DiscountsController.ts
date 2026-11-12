import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreateDiscountBody, DiscountListReturn, DiscountReturn, UpdateDiscountBody } from "../../dtos";
import { CreateDiscount, DeleteDiscount, ListDiscounts, UpdateDiscount } from "../../useCases";

export const DiscountsController = new Elysia({ detail: { tags: ["Discounts"] } })
	.use([GlobalPlugin])
	.group("/discounts", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createDiscount: new CreateDiscount(prisma),
				deleteDiscount: new DeleteDiscount(prisma),
				listDiscounts: new ListDiscounts(prisma),
				prisma,
				updateDiscount: new UpdateDiscount(prisma),
			}))
			.get(
				"/",
				async ({ listDiscounts, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listDiscounts.execute(scope.companyId);
				},
				{ response: DiscountListReturn },
			)
			.post(
				"/",
				async ({ body, createDiscount, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");

					return createDiscount.execute(scope.companyId, body);
				},
				{ body: CreateDiscountBody, response: DiscountReturn },
			)
			.patch(
				"/:discountId",
				async ({ body, params, request, updateDiscount }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return updateDiscount.execute(scope.companyId, params.discountId, body);
				},
				{ body: UpdateDiscountBody, response: DiscountReturn },
			)
			.delete(
				"/:discountId",
				async ({ deleteDiscount, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");

					await deleteDiscount.execute(scope.companyId, params.discountId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
