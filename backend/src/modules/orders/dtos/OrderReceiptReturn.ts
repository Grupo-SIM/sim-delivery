import { t } from "elysia";
import { __nullable__ } from "sql/typebox";
import { ReceiptTemplate } from "@/modules/receiptTemplates/dtos";

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
	customer: t.Object({ cpf: __nullable__(t.String()), name: t.String(), phone: __nullable__(t.String()) }),
	deliveryFee: t.Integer(),
	deliveryMethod: t.String(),
	discountCents: t.Integer(),
	displayNumber: t.Integer(),
	id: t.String(),
	isFirstOrder: t.Boolean(),
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
	payment: __nullable__(
		t.Object({ amount: t.Integer(), method: t.String(), refundedAmount: t.Integer(), status: t.String() }),
	),
	preparedBy: __nullable__(t.Object({ id: t.String(), name: t.String() })),
	estimatedDeliveryAt: __nullable__(t.Date()),
	status: t.String(),
	subtotal: t.Integer(),
	template: ReceiptTemplate,
	total: t.Integer(),
	unit: t.Object({ id: t.String(), name: t.String() }),
});
export type OrderReceiptReturn = typeof OrderReceiptReturn.static;
