import { t } from "elysia";
import { __nullable__, AddressPlain, CustomerPlain } from "sql/typebox";

export const AddressReturn = AddressPlain;
export type AddressReturn = typeof AddressReturn.static;

export const CustomerReturn = t.Object({
	...CustomerPlain.properties,
	addresses: t.Array(AddressReturn),
});
export type CustomerReturn = typeof CustomerReturn.static;

/** Nullable wrapper for GET /customers/me — null when no Customer record exists yet. */
export const MaybeCustomerReturn = __nullable__(CustomerReturn);
export type MaybeCustomerReturn = typeof MaybeCustomerReturn.static;

const CustomerAdminFields = {
	averageTicket: t.Integer({ minimum: 0 }),
	cashbackBalance: t.Integer(),
	email: t.String(),
	lastOrderAt: __nullable__(t.Date()),
	name: t.String(),
	orderCount: t.Integer({ minimum: 0 }),
	totalSpent: t.Integer({ minimum: 0 }),
};

export const CustomerAdminReturn = t.Object({
	...CustomerPlain.properties,
	...CustomerAdminFields,
	addresses: t.Array(AddressReturn),
});
export type CustomerAdminReturn = typeof CustomerAdminReturn.static;

export const CustomerListItemReturn = t.Object({
	...CustomerPlain.properties,
	...CustomerAdminFields,
});
export type CustomerListItemReturn = typeof CustomerListItemReturn.static;

export const CustomerListReturn = t.Object({
	items: t.Array(CustomerListItemReturn),
	page: t.Integer({ minimum: 1 }),
	pageSize: t.Integer({ minimum: 1 }),
	total: t.Integer({ minimum: 0 }),
});
export type CustomerListReturn = typeof CustomerListReturn.static;
