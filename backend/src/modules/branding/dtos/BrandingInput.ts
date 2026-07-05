import { t } from "elysia";

export const GetBrandingQuery = t.Object({
	unitId: t.Optional(t.String()),
});
export type GetBrandingQuery = typeof GetBrandingQuery.static;

export const UpdateBrandingBody = t.Object({
	footerText: t.Optional(t.String({ maxLength: 500 })),
	logoUrl: t.Optional(t.String({ format: "uri", maxLength: 1000 })),
	primaryColor: t.Optional(t.String({ maxLength: 20, pattern: "^#[0-9a-fA-F]{3,6}$" })),
});
export type UpdateBrandingBody = typeof UpdateBrandingBody.static;

export const UpdateBrandingDTO = t.Object({
	...UpdateBrandingBody.properties,
	companyId: t.String(),
});
export type UpdateBrandingDTO = typeof UpdateBrandingDTO.static;
