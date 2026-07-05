import { t } from "elysia";

export const GetReportsQuery = t.Object({
	period: t.Optional(t.Union([t.Literal("today"), t.Literal("week"), t.Literal("month")])),
	unitId: t.Optional(t.String()),
});
export type GetReportsQuery = typeof GetReportsQuery.static;
