import { t } from "elysia";

/** Body for replacing the whole set of units a category is assigned to. */
export const SetCategoryUnitsBody = t.Object({ unitIds: t.Array(t.String()) });
export type SetCategoryUnitsBody = typeof SetCategoryUnitsBody.static;
