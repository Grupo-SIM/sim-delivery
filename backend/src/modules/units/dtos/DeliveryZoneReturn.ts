import { t } from "elysia";
import { DeliveryZonePlain } from "sql/typebox";

/** Public shape of a delivery zone row, reused across the delivery-zones endpoints. */
export const DeliveryZoneReturn = DeliveryZonePlain;
export type DeliveryZoneReturn = typeof DeliveryZoneReturn.static;

export const DeliveryZoneListReturn = t.Array(DeliveryZoneReturn);
export type DeliveryZoneListReturn = typeof DeliveryZoneListReturn.static;
