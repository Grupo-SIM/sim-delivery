import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const DeliveryReturn = t.Object({
	acceptedAt: __nullable__(t.Date()),
	assignedAt: t.Date(),
	companyId: t.String(),
	courierId: t.String(),
	createdAt: t.Date(),
	deliveredAt: __nullable__(t.Date()),
	departedAt: __nullable__(t.Date()),
	id: t.String(),
	orderId: t.String(),
	status: t.String(),
	unitId: t.String(),
	updatedAt: t.Date(),
});
export type DeliveryReturn = typeof DeliveryReturn.static;

export const DeliveryListReturn = t.Array(
	t.Object({
		...DeliveryReturn.properties,
		courierName: t.String(),
		unitName: t.String(),
		order: t.Object({
			id: t.String(),
			customerName: t.String(),
			deliveryMethod: t.String(),
			items: t.Array(t.Object({
				id: t.String(),
				productName: t.String(),
				quantity: t.Integer(),
				note: __nullable__(t.String()),
			})),
			total: t.Integer(),
		}),
	}),
);
export type DeliveryListReturn = typeof DeliveryListReturn.static;
