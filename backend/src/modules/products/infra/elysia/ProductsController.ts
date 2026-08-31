import Elysia, { t } from "elysia";
import { ProductRecipeReturn, PutProductRecipeBody } from "@/modules/inventory/dtos";
import { InventoryService } from "@/modules/inventory/service";
import { ProductUnitsReturn, SetProductUnitsBody } from "@/modules/unitProducts/dtos";
import { ListProductUnits, SetProductUnits } from "@/modules/unitProducts/useCases";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateOptionBody,
	CreateOptionGroupBody,
	CreateProductBody,
	ProductListReturn,
	ProductOptionGroupsReturn,
	ProductReturn,
	SaveProductOptionGroupsBody,
	UpdateProductAvailabilityBody,
	UpdateProductAvailabilityReturn,
	UpdateOptionBody,
	UpdateOptionGroupBody,
	UpdateProductBody,
} from "../../dtos";
import {
	CreateProduct,
	DeleteProduct,
	ListProducts,
	ProductOptions,
	UpdateProduct,
	UpdateProductAvailability,
} from "../../useCases";

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
				inventory: new InventoryService(prisma),
				listProducts: new ListProducts(prisma),
				listProductUnits: new ListProductUnits(prisma),
				prisma,
				productOptions: new ProductOptions(prisma),
				setProductUnits: new SetProductUnits(prisma),
				updateProduct: new UpdateProduct(prisma),
				updateProductAvailability: new UpdateProductAvailability(prisma),
			}))
			.get(
				"/:productId/recipe",
				async ({ inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.getProductRecipe(scope.companyId!, params.productId);
				},
				{ response: ProductRecipeReturn },
			)
			.put(
				"/:productId/recipe",
				async ({ body, inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "update");
					return inventory.putProductRecipe(scope.companyId!, params.productId, body);
				},
				{ body: PutProductRecipeBody, response: ProductRecipeReturn },
			)
			.get(
				"/:productId/option-groups",
				async ({ params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");
					return productOptions.list(scope.companyId, params.productId);
				},
				{ response: ProductOptionGroupsReturn },
			)
			.post(
				"/:productId/option-groups",
				async ({ body, params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return productOptions.createGroup(scope.companyId, params.productId, body);
				},
				{ body: CreateOptionGroupBody, response: t.Any() },
			)
			.put(
				"/:productId/option-groups",
				async ({ body, params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return productOptions.save(scope.companyId, params.productId, body);
				},
				{ body: SaveProductOptionGroupsBody, response: ProductOptionGroupsReturn },
			)
			.patch(
				"/:productId/option-groups/:groupId",
				async ({ body, params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return productOptions.updateGroup(scope.companyId, params.productId, params.groupId, body);
				},
				{ body: UpdateOptionGroupBody, response: t.Any() },
			)
			.delete(
				"/:productId/option-groups/:groupId",
				async ({ params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");
					await productOptions.deleteGroup(scope.companyId, params.productId, params.groupId);
					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			)
			.post(
				"/:productId/option-groups/:groupId/options",
				async ({ body, params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return productOptions.createOption(scope.companyId, params.productId, params.groupId, body);
				},
				{ body: CreateOptionBody, response: t.Any() },
			)
			.patch(
				"/:productId/option-groups/:groupId/options/:optionId",
				async ({ body, params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					return productOptions.updateOption(
						scope.companyId,
						params.productId,
						params.groupId,
						params.optionId,
						body,
					);
				},
				{ body: UpdateOptionBody, response: t.Any() },
			)
			.delete(
				"/:productId/option-groups/:groupId/options/:optionId",
				async ({ params, productOptions, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "delete");
					await productOptions.deleteOption(
						scope.companyId,
						params.productId,
						params.groupId,
						params.optionId,
					);
					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			)
			.get(
				"/",
				async ({ listProducts, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listProducts.execute(scope.companyId, scope.role, scope.userId);
				},
				{ response: ProductListReturn },
			)
			.post(
				"/",
				async ({ body, createProduct, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "create");
					const unitIds = ["owner", "superAdmin"].includes(scope.role)
						? body.unitIds
						: (body.unitIds ?? scope.unitIds);
					CompanyScopeGuard.authorizeUnits(scope, unitIds ?? []);

					return createProduct.execute(scope.companyId, { ...body, unitIds });
				},
				{ body: CreateProductBody, response: ProductReturn },
			)
			.patch(
				"/:productId/availability",
				async ({ body, params, request, updateProductAvailability }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "updateAvailability");

					return updateProductAvailability.execute(
						scope.companyId,
						params.productId,
						body,
						CompanyScopeGuard.permittedUnitIds(scope),
					);
				},
				{ body: UpdateProductAvailabilityBody, response: UpdateProductAvailabilityReturn },
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
			)
			.get(
				"/:productId/units",
				async ({ listProductUnits, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "read");

					return listProductUnits.execute(
						scope.companyId,
						params.productId,
						["owner", "superAdmin"].includes(scope.role) ? undefined : scope.unitIds,
					);
				},
				{ response: ProductUnitsReturn },
			)
			.put(
				"/:productId/units",
				async ({ body, params, request, setProductUnits }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "menu", "update");
					CompanyScopeGuard.authorizeUnits(scope, body.unitIds);

					return setProductUnits.execute(
						scope.companyId,
						params.productId,
						body.unitIds,
						["owner", "superAdmin"].includes(scope.role) ? undefined : scope.unitIds,
					);
				},
				{ body: SetProductUnitsBody, response: ProductUnitsReturn },
			),
	);
