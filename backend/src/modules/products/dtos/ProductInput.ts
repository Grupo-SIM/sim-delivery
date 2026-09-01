import { t } from "elysia";

const fields = {
	basePriceCents: t.Optional(t.Integer({ minimum: 0 })),
	cashbackPercentOverride: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	categoryIds: t.Optional(t.Array(t.String(), { uniqueItems: true })),
	description: t.Optional(t.String()),
	imageUrl: t.Optional(t.String()),
	tagIds: t.Optional(t.Array(t.String(), { uniqueItems: true })),
	unitIds: t.Optional(t.Array(t.String(), { uniqueItems: true })),
};

export const CreateProductBody = t.Object({
	...fields,
	title: t.String({ minLength: 1 }),
});
export type CreateProductBody = typeof CreateProductBody.static;

export const UpdateProductBody = t.Object({
	...fields,
	title: t.Optional(t.String({ minLength: 1 })),
});
export type UpdateProductBody = typeof UpdateProductBody.static;

export const UpdateProductAvailabilityBody = t.Object({
	available: t.Boolean(),
	unitId: t.Optional(t.String()),
});
export type UpdateProductAvailabilityBody = typeof UpdateProductAvailabilityBody.static;

export const UpdateProductsAvailabilityBody = t.Object({
	available: t.Boolean(),
	categoryId: t.Optional(t.String({ minLength: 1 })),
	tagId: t.Optional(t.String({ minLength: 1 })),
	unitId: t.Optional(t.String()),
});
export type UpdateProductsAvailabilityBody = typeof UpdateProductsAvailabilityBody.static;
