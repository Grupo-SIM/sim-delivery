import { t } from "elysia";

/** Body for replacing the whole set of units a product is assigned to. */
export const SetProductUnitsBody = t.Object({ unitIds: t.Array(t.String()) });
export type SetProductUnitsBody = typeof SetProductUnitsBody.static;
