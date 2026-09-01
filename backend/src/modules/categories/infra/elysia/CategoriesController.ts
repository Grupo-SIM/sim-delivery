import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CategoryListReturn,
	CategoryReturn,
	CreateCategoryBody,
	ReorderCategoriesBody,
	UpdateCategoryBody,
} from "../../dtos";
import {
	CreateCategory,
	DeleteCategory,
	ListCategories,
	ReorderCategories,
	UpdateCategory,
} from "../../useCases";

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
				prisma,
				reorderCategories: new ReorderCategories(prisma),
				updateCategory: new UpdateCategory(prisma),
			}))
			.get(
				"/",
				async ({ listCategories, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listCategories.execute(scope.companyId, scope.role, scope.userId);
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
			.put(
				"/order",
				async ({ body, reorderCategories, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return reorderCategories.execute(scope.companyId, body.categoryIds);
				},
				{ body: ReorderCategoriesBody, response: CategoryListReturn },
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
			),
	);
