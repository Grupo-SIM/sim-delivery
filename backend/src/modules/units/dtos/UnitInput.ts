import { t } from "elysia";

/** Editable unit fields shared by create (required name) and update (all optional). */
const fields = {
	addressLine: t.Optional(t.Nullable(t.String())),
	bannerProductIds: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 10 })),
	bannerUrls: t.Optional(t.Array(t.String({ format: "uri", maxLength: 1000 }), { maxItems: 10 })),
	cashbackPercent: t.Optional(t.Number({ minimum: 0 })),
	city: t.Optional(t.Nullable(t.String())),
	complement: t.Optional(t.Nullable(t.String())),
	deliveryFee: t.Optional(t.Integer({ minimum: 0 })),
	deliveryFeeFallbackEnabled: t.Optional(t.Boolean()),
	deliveryMethods: t.Optional(t.Array(t.Union([t.Literal("delivery"), t.Literal("pickup")]))),
	facebookUrl: t.Optional(t.Nullable(t.String({ format: "uri", maxLength: 1000 }))),
	imageUrl: t.Optional(t.Nullable(t.String({ format: "uri", maxLength: 1000 }))),
	instagramUrl: t.Optional(t.Nullable(t.String({ format: "uri", maxLength: 1000 }))),
	isOpenManual: t.Optional(t.Nullable(t.Boolean())),
	latitude: t.Optional(t.Nullable(t.Number())),
	longitude: t.Optional(t.Nullable(t.Number())),
	neighborhood: t.Optional(t.Nullable(t.String())),
	number: t.Optional(t.Nullable(t.String())),
	phone: t.Optional(t.Nullable(t.String())),
	reference: t.Optional(t.Nullable(t.String())),
	state: t.Optional(t.Nullable(t.String())),
	whatsApp: t.Optional(t.Nullable(t.String({ maxLength: 30 }))),
	xUrl: t.Optional(t.Nullable(t.String({ format: "uri", maxLength: 1000 }))),
	zipCode: t.Optional(t.Nullable(t.String())),
};

export const CreateUnitBody = t.Object({ ...fields, name: t.String({ minLength: 1 }) });
export type CreateUnitBody = typeof CreateUnitBody.static;

export const UpdateUnitBody = t.Object({
	...fields,
	active: t.Optional(t.Boolean()),
	name: t.Optional(t.String({ minLength: 1 })),
});
export type UpdateUnitBody = typeof UpdateUnitBody.static;
