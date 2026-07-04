import { t } from "elysia";

export const AssignDeliveryBody = t.Object({
	courierId: t.String({ minLength: 1 }),
	orderId: t.String({ minLength: 1 }),
});
export type AssignDeliveryBody = typeof AssignDeliveryBody.static;

export const UpdateDeliveryStatusBody = t.Object({
	status: t.Union([
		t.Literal("aceita"),
		t.Literal("a_caminho"),
		t.Literal("entregue"),
		t.Literal("recusada"),
		t.Literal("falhou"),
	]),
});
export type UpdateDeliveryStatusBody = typeof UpdateDeliveryStatusBody.static;

export const ListDeliveriesQuery = t.Object({
	courierId: t.Optional(t.String()),
	status: t.Optional(t.String()),
});
export type ListDeliveriesQuery = typeof ListDeliveriesQuery.static;
