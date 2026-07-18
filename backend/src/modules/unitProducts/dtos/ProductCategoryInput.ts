import { t } from "elysia";

/** Body for setting (or clearing) a product's category across every unit it's assigned to. */
export const SetProductCategoryBody = t.Object({ categoryId: t.Nullable(t.String()) });
export type SetProductCategoryBody = typeof SetProductCategoryBody.static;
