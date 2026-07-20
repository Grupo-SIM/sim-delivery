import { t } from "elysia";

const groupFields = {
	maxSelect: t.Integer({ minimum: 1 }),
	minSelect: t.Integer({ minimum: 0 }),
	name: t.String({ minLength: 1 }),
	priceRule: t.Union([t.Literal("sum"), t.Literal("highest"), t.Literal("average")]),
	selectionType: t.Union([t.Literal("single"), t.Literal("multi")]),
	sortOrder: t.Optional(t.Integer({ minimum: 0 })),
};
export const CreateOptionGroupBody = t.Object(groupFields);
export type CreateOptionGroupBody = typeof CreateOptionGroupBody.static;
export const UpdateOptionGroupBody = t.Partial(CreateOptionGroupBody);
export type UpdateOptionGroupBody = typeof UpdateOptionGroupBody.static;

const optionFields = {
	available: t.Optional(t.Boolean()),
	description: t.Optional(t.String()),
	imageUrl: t.Optional(t.Nullable(t.String())),
	maxPerItem: t.Optional(t.Nullable(t.Integer({ minimum: 1 }))),
	name: t.String({ minLength: 1 }),
	priceDeltaCents: t.Integer(),
	sortOrder: t.Optional(t.Integer({ minimum: 0 })),
};
export const CreateOptionBody = t.Object(optionFields);
export type CreateOptionBody = typeof CreateOptionBody.static;
export const UpdateOptionBody = t.Partial(CreateOptionBody);
export type UpdateOptionBody = typeof UpdateOptionBody.static;

const OptionReturn = t.Object({
	available: t.Boolean(),
	description: t.String(),
	groupId: t.String(),
	id: t.String(),
	imageUrl: t.Nullable(t.String()),
	maxPerItem: t.Nullable(t.Integer()),
	name: t.String(),
	popularity: t.Integer(),
	priceDeltaCents: t.Integer(),
	sortOrder: t.Integer(),
});
const OptionGroupReturn = t.Object({
	id: t.String(),
	maxSelect: t.Integer(),
	minSelect: t.Integer(),
	name: t.String(),
	options: t.Array(OptionReturn),
	priceRule: t.String(),
	productId: t.String(),
	selectionType: t.String(),
	sortOrder: t.Integer(),
});
export const ProductOptionGroupsReturn = t.Array(OptionGroupReturn);
export type ProductOptionGroupsReturn = typeof ProductOptionGroupsReturn.static;
