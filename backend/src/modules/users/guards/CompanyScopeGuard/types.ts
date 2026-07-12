import { t } from "elysia";

export const CompanyScopeReturn = t.Object({
	companyId: t.Nullable(t.String()),
	role: t.Union([
		t.Literal("superAdmin"),
		t.Literal("owner"),
		t.Literal("manager"),
		t.Literal("attendant"),
		t.Literal("kitchen"),
		t.Literal("courier"),
		t.Literal("customer"),
	]),
	userId: t.String(),
});
export type CompanyScopeReturn = typeof CompanyScopeReturn.static;
