import { t } from "elysia";

export const AddressInput = t.Object({
	addressLine: t.String({ minLength: 1 }),
	city: t.Optional(t.String()),
	complement: t.Optional(t.String()),
	latitude: t.Optional(t.Nullable(t.Number())),
	longitude: t.Optional(t.Nullable(t.Number())),
	neighborhood: t.Optional(t.String()),
	number: t.String({ minLength: 1 }),
	reference: t.Optional(t.String()),
	state: t.Optional(t.String()),
	zipCode: t.String({ maxLength: 8, minLength: 8 }),
});
export type AddressInput = typeof AddressInput.static;

export const CreateCustomerBody = t.Object({
	address: AddressInput,
	cpf: t.Optional(t.String()),
	name: t.String({ minLength: 1 }),
	slug: t.String({ minLength: 1 }),
});
export type CreateCustomerBody = typeof CreateCustomerBody.static;

export const GetMyCustomerQuery = t.Object({
	slug: t.String({ minLength: 1 }),
});
export type GetMyCustomerQuery = typeof GetMyCustomerQuery.static;
