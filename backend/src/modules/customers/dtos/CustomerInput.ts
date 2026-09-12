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

export const UpdateNotificationPreferencesBody = t.Object({
	email: t.Boolean(),
	whatsApp: t.Boolean(),
});
export type UpdateNotificationPreferencesBody = typeof UpdateNotificationPreferencesBody.static;

export const CreateCustomerAddressBody = t.Object({
	...AddressInput.properties,
	isDefault: t.Optional(t.Boolean()),
	label: t.Optional(t.String()),
	slug: t.String({ minLength: 1 }),
});
export type CreateCustomerAddressBody = typeof CreateCustomerAddressBody.static;

export const UpdateCustomerAddressBody = t.Partial(
	t.Object({ ...AddressInput.properties, isDefault: t.Boolean(), label: t.String() }),
);
export type UpdateCustomerAddressBody = typeof UpdateCustomerAddressBody.static;

export const UpdateCustomerBody = t.Object({
	cpf: t.String({ maxLength: 11, minLength: 11 }),
	phone: t.String({ maxLength: 13, minLength: 13 }),
	slug: t.String({ minLength: 1 }),
});
export type UpdateCustomerBody = typeof UpdateCustomerBody.static;

export const ListCustomersQuery = t.Object({
	page: t.Optional(t.Integer({ minimum: 1 })),
	pageSize: t.Optional(t.Integer({ maximum: 100, minimum: 1 })),
	search: t.Optional(t.String({ minLength: 1 })),
});
export type ListCustomersQuery = typeof ListCustomersQuery.static;
