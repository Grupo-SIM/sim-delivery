import Elysia from "elysia";
import { CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateInventoryItemBody,
	CreateInventoryMovementBody,
	InventoryItemReturn,
	InventoryItemsReturn,
	InventoryMovementReturn,
	InventoryMovementsReturn,
	InventoryOverviewQuery,
	InventoryOverviewReturn,
	InventorySettingsReturn,
	ListInventoryItemsQuery,
	ListInventoryMovementsQuery,
	UpdateInventoryItemBody,
	UpdateInventorySettingsBody,
} from "./dtos";
import { InventoryService } from "./service";

export const InventoryController = new Elysia({ detail: { tags: ["Inventory"] } })
	.use([GlobalPlugin])
	.group("/inventory", app =>
		app
			.decorate(({ prisma }) => ({ inventory: new InventoryService(prisma) }))
			.get(
				"/items",
				async ({ inventory, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.listItems(scope.companyId!, query);
				},
				{ query: ListInventoryItemsQuery, response: InventoryItemsReturn },
			)
			.post(
				"/items",
				async ({ body, inventory, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "create");
					return inventory.createItem(scope.companyId!, body);
				},
				{ body: CreateInventoryItemBody, response: InventoryItemReturn },
			)
			.patch(
				"/items/:itemId",
				async ({ body, inventory, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "update");
					return inventory.updateItem(scope.companyId!, params.itemId, body);
				},
				{ body: UpdateInventoryItemBody, response: InventoryItemReturn },
			)
			.get(
				"/settings",
				async ({ inventory, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.getSettings(scope.companyId!);
				},
				{ response: InventorySettingsReturn },
			)
			.patch(
				"/settings",
				async ({ body, inventory, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "update");
					return inventory.updateSettings(scope.companyId!, body);
				},
				{ body: UpdateInventorySettingsBody, response: InventorySettingsReturn },
			)
			.get(
				"/overview",
				async ({ inventory, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.overview(scope.companyId!, query);
				},
				{ query: InventoryOverviewQuery, response: InventoryOverviewReturn },
			)
			.get(
				"/movements",
				async ({ inventory, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "read");
					return inventory.listMovements(scope.companyId!, query);
				},
				{ query: ListInventoryMovementsQuery, response: InventoryMovementsReturn },
			)
			.post(
				"/movements",
				async ({ body, inventory, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "inventory", "create");
					return inventory.createMovement(scope.companyId!, scope.userId, body);
				},
				{ body: CreateInventoryMovementBody, response: InventoryMovementReturn },
			),
	);
