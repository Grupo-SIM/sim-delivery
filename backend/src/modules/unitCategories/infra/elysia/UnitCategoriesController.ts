import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { ReorderUnitCategoriesBody, UnitCategoriesReturn } from "../../dtos";
import { ListUnitCategories, ReorderUnitCategories } from "../../useCases";

export const UnitCategoriesController = new Elysia({
	detail: {
		tags: ["Unit categories"],
	},
})
	.use([GlobalPlugin])
	.group("/units/:unitId/categories", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				listUnitCategories: new ListUnitCategories(prisma),
				prisma,
				reorderUnitCategories: new ReorderUnitCategories(prisma),
			}))
			.get(
				"/",
				async ({ listUnitCategories, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listUnitCategories.execute(scope.companyId, params.unitId);
				},
				{ response: UnitCategoriesReturn },
			)
			.put(
				"/order",
				async ({ body, params, request, reorderUnitCategories }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return reorderUnitCategories.execute(scope.companyId, params.unitId, body.categoryIds);
				},
				{ body: ReorderUnitCategoriesBody, response: UnitCategoriesReturn },
			),
	);
