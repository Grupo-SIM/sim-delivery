import { t } from "elysia";

/** Body for persisting a unit's category order after a drag-and-drop reorder. */
export const ReorderUnitCategoriesBody = t.Object({ categoryIds: t.Array(t.String()) });
export type ReorderUnitCategoriesBody = typeof ReorderUnitCategoriesBody.static;
