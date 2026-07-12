import { t } from "elysia";

/** Editable unit fields shared by create (required name) and update (all optional). */
const fields = {
	addressLine: t.Optional(t.Nullable(t.String())),
	cashbackPercent: t.Optional(t.Number({ minimum: 0 })),
	city: t.Optional(t.Nullable(t.String())),
	complement: t.Optional(t.Nullable(t.String())),
	deliveryFee: t.Optional(t.Integer({ minimum: 0 })),
	deliveryMethods: t.Optional(t.Array(t.Union([t.Literal("delivery"), t.Literal("pickup")]))),
	isOpenManual: t.Optional(t.Nullable(t.Boolean())),
	neighborhood: t.Optional(t.Nullable(t.String())),
	number: t.Optional(t.Nullable(t.String())),
	phone: t.Optional(t.Nullable(t.String())),
	reference: t.Optional(t.Nullable(t.String())),
	state: t.Optional(t.Nullable(t.String())),
	zipCode: t.Optional(t.Nullable(t.String())),
};

/** `companyId` is only honored when the caller has no scoped company (superAdmin); ignored otherwise. */
export const CreateUnitBody = t.Object({ ...fields, companyId: t.Optional(t.String()), name: t.String({ minLength: 1 }) });
export type CreateUnitBody = typeof CreateUnitBody.static;

export const UpdateUnitBody = t.Object({ ...fields, name: t.Optional(t.String({ minLength: 1 })) });
export type UpdateUnitBody = typeof UpdateUnitBody.static;
