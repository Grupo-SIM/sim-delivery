import Elysia, { t } from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreateProductBody, ProductListReturn, ProductReturn, UpdateProductBody } from "../../dtos";
import { CreateProduct, DeleteProduct, ListProducts, UpdateProduct } from "../../useCases";

export const ProductsController = new Elysia({
	detail: {
		tags: ["Products"],
	},
})
	.use([GlobalPlugin])
	.group("/products", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createProduct: new CreateProduct(prisma),
				deleteProduct: new DeleteProduct(prisma),
				listProducts: new ListProducts(prisma),
				prisma,
				updateProduct: new UpdateProduct(prisma),
			}))
			.get(
				"/",
				async ({ listProducts, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listProducts.execute(scope.companyId);
				},
				{ response: ProductListReturn },
			)
			.post(
				"/",
				async ({ body, createProduct, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");

					return createProduct.execute(scope.companyId ?? body.companyId ?? null, body);
				},
				{ body: CreateProductBody, response: ProductReturn },
			)
			.patch(
				"/:productId",
				async ({ body, params, request, updateProduct }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");

					return updateProduct.execute(scope.companyId, params.productId, body);
				},
				{ body: UpdateProductBody, response: ProductReturn },
			)
			.delete(
				"/:productId",
				async ({ deleteProduct, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");

					await deleteProduct.execute(scope.companyId, params.productId);

					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
