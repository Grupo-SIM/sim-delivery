import { t } from "elysia";

export const FreightSimulateBody = t.Object({
	unitId: t.String({ minLength: 1 }),
	variantKey: t.String({ minLength: 1 }),
});
export type FreightSimulateBody = typeof FreightSimulateBody.static;

export const FreightSimulateReturn = t.Object({
	deliveryFee: t.Integer(),
});
export type FreightSimulateReturn = typeof FreightSimulateReturn.static;
