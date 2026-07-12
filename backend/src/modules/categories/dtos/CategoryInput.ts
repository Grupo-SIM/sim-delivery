import { t } from "elysia";

/** Editable category fields shared by create (required name) and update (all optional). */
const fields = {
	position: t.Optional(t.Integer({ minimum: 0 })),
};

export const CreateCategoryBody = t.Object({ ...fields, name: t.String({ minLength: 1 }) });
export type CreateCategoryBody = typeof CreateCategoryBody.static;

export const UpdateCategoryBody = t.Object({ ...fields, name: t.Optional(t.String({ minLength: 1 })) });
export type UpdateCategoryBody = typeof UpdateCategoryBody.static;
