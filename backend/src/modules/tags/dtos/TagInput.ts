import { t } from "elysia";

/** Hex color like "#22c55e" (6-digit, leading #). */
const Color = t.String({ pattern: "^#[0-9a-fA-F]{6}$" });

/** Editable tag fields shared by create (required name) and update (all optional). */
const fields = {
	color: t.Optional(Color),
};

/** `companyId` is only honored when the caller has no scoped company (superAdmin); ignored otherwise. */
export const CreateTagBody = t.Object({ ...fields, companyId: t.Optional(t.String()), name: t.String({ minLength: 1 }) });
export type CreateTagBody = typeof CreateTagBody.static;

export const UpdateTagBody = t.Object({ ...fields, name: t.Optional(t.String({ minLength: 1 })) });
export type UpdateTagBody = typeof UpdateTagBody.static;
