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
	UpdateUnitProductsAvailabilityBody,
	UpdateUnitProductsAvailabilityReturn,
} from "../../dtos";
import {
	AssociateProduct,
	ListUnitProducts,
	RemoveUnitProduct,
	UpdateUnitProduct,
	UpdateUnitProductsAvailability,
} from "../../useCases";

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
				updateUnitProductsAvailability: new UpdateUnitProductsAvailability(prisma),
			}))
			.get(
				"/:unitProductId/local-options/:localOptionId/recipe",
				async ({ inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);
					return inventory.getLocalOptionRecipe(scope.companyId!, params.unitProductId, params.localOptionId);
				},
				{ response: LocalOptionRecipeReturn },
			)
			.put(
				"/:unitProductId/local-options/:localOptionId/recipe",
				async ({ body, inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "update");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);
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
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return listUnitProducts.execute(scope.companyId, params.unitId);
				},
				{ response: UnitProductListReturn },
			)
			.post(
				"/",
				async ({ associateProduct, body, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return associateProduct.execute(scope.companyId, params.unitId, body);
				},
				{ body: AssociateProductBody, response: UnitProductReturn },
			)
			.patch(
				"/availability",
				async ({ body, params, request, updateUnitProductsAvailability }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return updateUnitProductsAvailability.execute(scope.companyId, params.unitId, body);
				},
				{
					body: UpdateUnitProductsAvailabilityBody,
					response: UpdateUnitProductsAvailabilityReturn,
				},
			)
			.patch(
				"/:unitProductId",
				async ({ body, params, request, updateUnitProduct }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					return updateUnitProduct.execute(scope.companyId, params.unitId, params.unitProductId, body);
				},
				{ body: UpdateUnitProductBody, response: UnitProductReturn },
			)
			.delete(
				"/:unitProductId",
				async ({ params, removeUnitProduct, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");
					CompanyScopeGuard.authorizeUnit(scope, params.unitId);

					await removeUnitProduct.execute(scope.companyId, params.unitId, params.unitProductId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
