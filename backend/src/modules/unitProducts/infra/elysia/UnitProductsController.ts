import Elysia, { t } from "elysia";
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
				listUnitProducts: new ListUnitProducts(prisma),
				prisma,
				removeUnitProduct: new RemoveUnitProduct(prisma),
				updateUnitProduct: new UpdateUnitProduct(prisma),
			}))
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
