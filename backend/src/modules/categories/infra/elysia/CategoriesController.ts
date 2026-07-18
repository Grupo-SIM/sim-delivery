import Elysia, { t } from "elysia";
import { CategoryUnitsReturn, SetCategoryUnitsBody } from "@/modules/unitCategories/dtos";
import { ListCategoryUnits, SetCategoryUnits } from "@/modules/unitCategories/useCases";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CategoryListReturn, CategoryReturn, CreateCategoryBody, UpdateCategoryBody } from "../../dtos";
import { CreateCategory, DeleteCategory, ListCategories, UpdateCategory } from "../../useCases";

export const CategoriesController = new Elysia({
	detail: {
		tags: ["Categories"],
	},
})
	.use([GlobalPlugin])
	.group("/categories", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createCategory: new CreateCategory(prisma),
				deleteCategory: new DeleteCategory(prisma),
				listCategories: new ListCategories(prisma),
				listCategoryUnits: new ListCategoryUnits(prisma),
				prisma,
				setCategoryUnits: new SetCategoryUnits(prisma),
				updateCategory: new UpdateCategory(prisma),
			}))
			.get(
				"/",
				async ({ listCategories, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listCategories.execute(scope.companyId);
				},
				{ response: CategoryListReturn },
			)
			.post(
				"/",
				async ({ body, createCategory, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");

					return createCategory.execute(scope.companyId, body);
				},
				{ body: CreateCategoryBody, response: CategoryReturn },
			)
			.patch(
				"/:categoryId",
				async ({ body, params, request, updateCategory }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return updateCategory.execute(scope.companyId, params.categoryId, body);
				},
				{ body: UpdateCategoryBody, response: CategoryReturn },
			)
			.delete(
				"/:categoryId",
				async ({ deleteCategory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");

					await deleteCategory.execute(scope.companyId, params.categoryId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			)
			.get(
				"/:categoryId/units",
				async ({ listCategoryUnits, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listCategoryUnits.execute(scope.companyId, params.categoryId);
				},
				{ response: CategoryUnitsReturn },
			)
			.put(
				"/:categoryId/units",
				async ({ body, params, request, setCategoryUnits }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return setCategoryUnits.execute(scope.companyId, params.categoryId, body.unitIds);
				},
				{ body: SetCategoryUnitsBody, response: CategoryUnitsReturn },
			),
	);
