import { t } from "elysia";

const OptionOverrideInput = t.Object({
	available: t.Optional(t.Nullable(t.Boolean())),
	description: t.Optional(t.Nullable(t.String())),
	imageUrl: t.Optional(t.Nullable(t.String())),
	maxPerItem: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
	name: t.Optional(t.Nullable(t.String({ minLength: 1 }))),
	optionId: t.String({ minLength: 1 }),
	priceDeltaCents: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	sortOrder: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
});
export type OptionOverrideInput = typeof OptionOverrideInput.static;

const AdditionalOptionInput = t.Object({
	available: t.Optional(t.Boolean()),
	description: t.Optional(t.String()),
	groupId: t.String({ minLength: 1 }),
	imageUrl: t.Optional(t.Nullable(t.String())),
	maxPerItem: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
	name: t.String({ minLength: 1 }),
	priceDeltaCents: t.Integer({ minimum: 0 }),
	sortOrder: t.Optional(t.Integer({ minimum: 0 })),
});
export type AdditionalOptionInput = typeof AdditionalOptionInput.static;

/** Per-unit association overrides shared by associate (create) and update. */
const fields = {
	additionalOptions: t.Optional(t.Array(AdditionalOptionInput)),
	available: t.Optional(t.Boolean()),
	cashbackPercentOverride: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	categoryIds: t.Optional(t.Nullable(t.Array(t.String(), { uniqueItems: true }))),
	excludedOptionIds: t.Optional(t.Array(t.String(), { uniqueItems: true })),
	optionOverrides: t.Optional(t.Array(OptionOverrideInput, { uniqueItems: true })),
	priceCentsOverride: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	promotionalPriceCents: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	stock: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	tagIds: t.Optional(t.Nullable(t.Array(t.String(), { uniqueItems: true }))),
};

export const AssociateProductBody = t.Object({ ...fields, productId: t.String({ minLength: 1 }) });
export type AssociateProductBody = typeof AssociateProductBody.static;

export const UpdateUnitProductBody = t.Object({ ...fields });
export type UpdateUnitProductBody = typeof UpdateUnitProductBody.static;

export const UpdateUnitProductsAvailabilityBody = t.Object({
	available: t.Boolean(),
	categoryId: t.Optional(t.String({ minLength: 1 })),
});
export type UpdateUnitProductsAvailabilityBody = typeof UpdateUnitProductsAvailabilityBody.static;
