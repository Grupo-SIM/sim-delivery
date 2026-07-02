import { t } from "elysia";

export const CompanyScopeReturn = t.Object({
	companyId: t.Nullable(t.String()),
	level: t.Nullable(
		t.Union([t.Literal("manager"), t.Literal("attendant"), t.Literal("kitchen")]),
	),
	role: t.Union([
		t.Literal("superAdmin"),
		t.Literal("owner"),
		t.Literal("employee"),
		t.Literal("courier"),
		t.Literal("customer"),
	]),
	userId: t.String(),
});
export type CompanyScopeReturn = typeof CompanyScopeReturn.static;
