import { t } from "elysia";
import { AddressPlain, CustomerPlain, __nullable__ } from "sql/typebox";

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
