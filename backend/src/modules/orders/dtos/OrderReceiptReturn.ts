import { t } from "elysia";
import { __nullable__ } from "sql/typebox";

export const OrderReceiptReturn = t.Object({
	address: __nullable__(
		t.Object({
			addressLine: t.String(),
			city: __nullable__(t.String()),
			complement: __nullable__(t.String()),
			neighborhood: __nullable__(t.String()),
			number: t.String(),
			reference: __nullable__(t.String()),
			state: __nullable__(t.String()),
			zipCode: t.String(),
		}),
	),
	cashbackCentsRedeemed: t.Integer(),
	createdAt: t.Date(),
	customer: t.Object({ name: t.String(), phone: __nullable__(t.String()) }),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	discountCents: t.Integer(),
	displayNumber: t.Integer(),
	id: t.String(),
	items: t.Array(
		t.Object({
			id: t.String(),
			note: __nullable__(t.String()),
			options: t.Array(
				t.Object({
					groupName: t.String(),
					optionName: t.String(),
					priceDeltaCents: t.Integer(),
					quantity: t.Integer(),
				}),
			),
			productName: t.String(),
			quantity: t.Integer(),
			total: t.Integer(),
			unitPrice: t.Integer(),
		}),
	),
	loyaltyPointsRedeemed: t.Integer(),
	payment: __nullable__(t.Object({ method: t.String(), status: t.String() })),
	preparedBy: __nullable__(t.Object({ id: t.String(), name: t.String() })),
	status: t.String(),
	subtotal: t.Integer(),
	total: t.Integer(),
	unit: t.Object({ id: t.String(), name: t.String() }),
});
export type OrderReceiptReturn = typeof OrderReceiptReturn.static;
