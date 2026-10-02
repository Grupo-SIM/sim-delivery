import { t } from "elysia";

export const InventoryUnit = t.Union([t.Literal("unit"), t.Literal("gram"), t.Literal("milliliter")]);
export const MovementType = t.Union([t.Literal("entry"), t.Literal("adjustment"), t.Literal("loss")]);

export const ListInventoryItemsQuery = t.Object({
	active: t.Optional(t.BooleanString()),
	search: t.Optional(t.String()),
});
export type ListInventoryItemsQuery = typeof ListInventoryItemsQuery.static;

export const CreateInventoryItemBody = t.Object({ name: t.String({ minLength: 1 }), unit: InventoryUnit });
export type CreateInventoryItemBody = typeof CreateInventoryItemBody.static;
export const UpdateInventoryItemBody = t.Partial(
	t.Object({ active: t.Boolean(), name: t.String({ minLength: 1 }) }),
);
export type UpdateInventoryItemBody = typeof UpdateInventoryItemBody.static;

export const InventoryItemReturn = t.Object({
	active: t.Boolean(),
	createdAt: t.Date(),
	id: t.String(),
	name: t.String(),
	unit: t.String(),
	updatedAt: t.Date(),
});
export const InventoryItemsReturn = t.Array(InventoryItemReturn);

export const InventorySettingsReturn = t.Object({
	consumptionWindowDays: t.Integer(),
	coverageTargetDays: t.Integer(),
});
export const UpdateInventorySettingsBody = t.Object({
	consumptionWindowDays: t.Integer({ maximum: 365, minimum: 1 }),
	coverageTargetDays: t.Integer({ maximum: 365, minimum: 1 }),
});
export type UpdateInventorySettingsBody = typeof UpdateInventorySettingsBody.static;

export const CreateInventoryMovementBody = t.Object({
	inventoryItemId: t.String(),
	quantity: t.Number(),
	reason: t.Optional(t.String()),
	type: MovementType,
	unitCostCents: t.Optional(t.Number({ minimum: 0 })),
	unitId: t.String(),
});
export type CreateInventoryMovementBody = typeof CreateInventoryMovementBody.static;

export const ListInventoryMovementsQuery = t.Object({
	endDate: t.Optional(t.String()),
	inventoryItemId: t.Optional(t.String()),
	search: t.Optional(t.String()),
	startDate: t.Optional(t.String()),
	type: t.Optional(MovementType),
	unitId: t.Optional(t.String()),
});
export type ListInventoryMovementsQuery = typeof ListInventoryMovementsQuery.static;

export const InventoryMovementReturn = t.Object({
	balanceAfter: t.Number(),
	createdAt: t.Date(),
	id: t.String(),
	inventoryItemId: t.String(),
	inventoryItemName: t.String(),
	quantity: t.Number(),
	reason: t.String(),
	type: t.String(),
	unitCostCents: t.Nullable(t.Number()),
	unitId: t.String(),
	unitName: t.String(),
});
export const InventoryMovementsReturn = t.Array(InventoryMovementReturn);

export const InventoryOverviewQuery = t.Object({
	search: t.Optional(t.String()),
	status: t.Optional(
		t.Union([t.Literal("all"), t.Literal("low"), t.Literal("negative"), t.Literal("no_history")]),
	),
	unitId: t.Optional(t.String()),
});
export type InventoryOverviewQuery = typeof InventoryOverviewQuery.static;

export const InventoryOverviewItem = t.Object({
	alert: t.Boolean(),
	averageCostCents: t.Number(),
	consumptionPerDay: t.Number(),
	coverageDays: t.Nullable(t.Number()),
	inventoryItemId: t.String(),
	inventoryItemName: t.String(),
	quantity: t.Number(),
	reservedQuantity: t.Number(),
	unit: InventoryUnit,
	unitId: t.String(),
	unitName: t.String(),
	valueCents: t.Number(),
});
export const InventoryOverviewReturn = t.Object({
	items: t.Array(InventoryOverviewItem),
	settings: InventorySettingsReturn,
});

export const RecipeIngredientInput = t.Object({
	inventoryItemId: t.String(),
	quantity: t.Number({ minimum: 0 }),
});
export const RecipeDeltaInput = t.Object({ inventoryItemId: t.String(), quantityDelta: t.Number() });
export const PutProductRecipeBody = t.Object({
	ingredients: t.Array(RecipeIngredientInput),
	optionDeltas: t.Array(t.Object({ ingredients: t.Array(RecipeDeltaInput), optionId: t.String() })),
});
export type PutProductRecipeBody = typeof PutProductRecipeBody.static;
export const ProductRecipeReturn = PutProductRecipeBody;

export const PutLocalOptionRecipeBody = t.Object({ ingredients: t.Array(RecipeDeltaInput) });
export type PutLocalOptionRecipeBody = typeof PutLocalOptionRecipeBody.static;
export const LocalOptionRecipeReturn = PutLocalOptionRecipeBody;
