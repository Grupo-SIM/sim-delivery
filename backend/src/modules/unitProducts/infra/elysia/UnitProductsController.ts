import Elysia, { t } from "elysia";
import { LocalOptionRecipeReturn, PutLocalOptionRecipeBody } from "@/modules/inventory/dtos";
import { InventoryService } from "@/modules/inventory/service";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	AssociateProductBody,
	UnitProductListReturn,
	UnitProductReturn,
	UpdateUnitProductBody,
} from "../../dtos";
import { AssociateProduct, ListUnitProducts, RemoveUnitProduct, UpdateUnitProduct } from "../../useCases";

export const UnitProductsController = new Elysia({
	detail: {
		tags: ["Unit products"],
	},
})
	.use([GlobalPlugin])
	.group("/units/:unitId/products", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				associateProduct: new AssociateProduct(prisma),
				inventory: new InventoryService(prisma),
				listUnitProducts: new ListUnitProducts(prisma),
				prisma,
				removeUnitProduct: new RemoveUnitProduct(prisma),
				updateUnitProduct: new UpdateUnitProduct(prisma),
			}))
			.get(
				"/:unitProductId/local-options/:localOptionId/recipe",
				async ({ inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.getLocalOptionRecipe(scope.companyId!, params.unitProductId, params.localOptionId);
				},
				{ response: LocalOptionRecipeReturn },
			)
			.put(
				"/:unitProductId/local-options/:localOptionId/recipe",
				async ({ body, inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "update");
					return inventory.putLocalOptionRecipe(
						scope.companyId!,
						params.unitProductId,
						params.localOptionId,
						body,
					);
				},
				{ body: PutLocalOptionRecipeBody, response: LocalOptionRecipeReturn },
			)
			.get(
				"/",
				async ({ listUnitProducts, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listUnitProducts.execute(scope.companyId, params.unitId);
				},
				{ response: UnitProductListReturn },
			)
			.post(
				"/",
				async ({ associateProduct, body, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");

					return associateProduct.execute(scope.companyId, params.unitId, body);
				},
				{ body: AssociateProductBody, response: UnitProductReturn },
			)
			.patch(
				"/:unitProductId",
				async ({ body, params, request, updateUnitProduct }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return updateUnitProduct.execute(scope.companyId, params.unitId, params.unitProductId, body);
				},
				{ body: UpdateUnitProductBody, response: UnitProductReturn },
			)
			.delete(
				"/:unitProductId",
				async ({ params, removeUnitProduct, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");

					await removeUnitProduct.execute(scope.companyId, params.unitId, params.unitProductId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
