import { t } from "elysia";

const fields = {
	imageUrl: t.String({ minLength: 1 }),
	linkUrl: t.Optional(t.Nullable(t.String())),
	title: t.String({ minLength: 1 }),
};

export const CreatePromotionalImageBody = t.Object(fields);
export type CreatePromotionalImageBody = typeof CreatePromotionalImageBody.static;

export const UpdatePromotionalImageBody = t.Partial(CreatePromotionalImageBody);
export type UpdatePromotionalImageBody = typeof UpdatePromotionalImageBody.static;

export const SetPromotionalImageUnitsBody = t.Object({ unitIds: t.Array(t.String()) });
export type SetPromotionalImageUnitsBody = typeof SetPromotionalImageUnitsBody.static;

export const SetUnitPromotionalImagesBody = t.Object({ promotionalImageIds: t.Array(t.String()) });
export type SetUnitPromotionalImagesBody = typeof SetUnitPromotionalImagesBody.static;
