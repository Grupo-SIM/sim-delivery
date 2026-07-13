import { t } from "elysia";

/** One "up to X km" delivery fee band. Zones are matched ascending by `radiusKm`. */
export const DeliveryZoneItem = t.Object({
	etaMaxMinutes: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	etaMinMinutes: t.Optional(t.Nullable(t.Integer({ minimum: 0 }))),
	fee: t.Integer({ minimum: 0 }),
	radiusKm: t.Number({ exclusiveMinimum: 0 }),
});
export type DeliveryZoneItem = typeof DeliveryZoneItem.static;

/** Body for replacing a unit's whole set of delivery zones in one request. */
export const SetDeliveryZonesBody = t.Object({ zones: t.Array(DeliveryZoneItem) });
export type SetDeliveryZonesBody = typeof SetDeliveryZonesBody.static;
