import { t } from "elysia";

export const FreightSimulateBody = t.Object({
	latitude: t.Number(),
	longitude: t.Number(),
	slug: t.String({ minLength: 1 }),
	unitId: t.String({ minLength: 1 }),
});
export type FreightSimulateBody = typeof FreightSimulateBody.static;

export const FreightSimulateReturn = t.Object({
	deliveryFee: t.Integer(),
	distanceKm: t.Optional(t.Number()),
	etaMaxMinutes: t.Optional(t.Integer()),
	etaMinMinutes: t.Optional(t.Integer()),
});
export type FreightSimulateReturn = typeof FreightSimulateReturn.static;
