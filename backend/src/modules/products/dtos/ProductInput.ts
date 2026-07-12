import { t } from "elysia";

const fields = {
	basePriceCents: t.Optional(t.Integer({ minimum: 0 })),
	cashbackPercentOverride: t.Optional(t.Nullable(t.Number({ minimum: 0 }))),
	description: t.Optional(t.String()),
	imageUrl: t.Optional(t.String({ minLength: 1 })),
};

/** `companyId` is only honored when the caller has no scoped company (superAdmin); ignored otherwise. */
export const CreateProductBody = t.Object({
	...fields,
	basePriceCents: t.Integer({ minimum: 0 }),
	companyId: t.Optional(t.String()),
	imageUrl: t.String({ minLength: 1 }),
	title: t.String({ minLength: 1 }),
});
export type CreateProductBody = typeof CreateProductBody.static;

export const UpdateProductBody = t.Object({ ...fields, title: t.Optional(t.String({ minLength: 1 })) });
export type UpdateProductBody = typeof UpdateProductBody.static;
