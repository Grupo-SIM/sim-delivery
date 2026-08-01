import Elysia, { t } from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateCustomerAddressBody,
	CreateCustomerBody,
	CustomerAdminReturn,
	CustomerListReturn,
	CustomerReturn,
	GetMyCustomerQuery,
	ListCustomersQuery,
	MaybeCustomerReturn,
	UpdateCustomerAddressBody,
	UpdateCustomerBody,
	UpdateNotificationPreferencesBody,
} from "../../dtos";
import {
	CreateCustomerAddress,
	DeleteCustomerAddress,
	GetCustomer,
	GetMyCustomer,
	ListCustomers,
	UpdateCustomerAddress,
	UpdateMyCustomer,
	UpdateNotificationPreferences,
	UpsertCustomer,
} from "../../useCases";

export const CustomersController = new Elysia({
	detail: { tags: ["Customers"] },
})
	.use([GlobalPlugin])
	.group("/customers", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createCustomerAddress: new CreateCustomerAddress(prisma),
				deleteCustomerAddress: new DeleteCustomerAddress(prisma),
				getCustomer: new GetCustomer(prisma),
				getMyCustomer: new GetMyCustomer(prisma),
				listCustomers: new ListCustomers(prisma),
				prisma,
				updateCustomerAddress: new UpdateCustomerAddress(prisma),
				updateMyCustomer: new UpdateMyCustomer(prisma),
				updateNotificationPreferences: new UpdateNotificationPreferences(prisma),
				upsertCustomer: new UpsertCustomer(prisma),
			}))
			.get(
				"/",
				async ({ listCustomers, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "customers", "read");
					return listCustomers.execute(scope.companyId, query);
				},
				{ query: ListCustomersQuery, response: CustomerListReturn },
			)
			.get(
				"/:customerId",
				async ({ getCustomer, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "customers", "read");
					return getCustomer.execute(scope.companyId, params.customerId);
				},
				{ params: t.Object({ customerId: t.String({ minLength: 1 }) }), response: CustomerAdminReturn },
			)
			.get(
				"/me",
				async ({ getMyCustomer, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return getMyCustomer.execute(userId, query.slug);
				},
				{ query: GetMyCustomerQuery, response: MaybeCustomerReturn },
			)
			.post(
				"/me",
				async ({ body, request, upsertCustomer }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return upsertCustomer.execute(userId, body);
				},
				{ body: CreateCustomerBody, response: CustomerReturn },
			)
			.patch(
				"/me",
				async ({ body, request, updateMyCustomer }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return updateMyCustomer.execute(userId, body);
				},
				{ body: UpdateCustomerBody, response: CustomerReturn },
			)
			.post(
				"/me/addresses",
				async ({ body, createCustomerAddress, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createCustomerAddress.execute(userId, body);
				},
				{ body: CreateCustomerAddressBody, response: CustomerReturn },
			)
			.patch(
				"/me/addresses/:addressId",
				async ({ body, params, request, updateCustomerAddress }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return updateCustomerAddress.execute(userId, params.addressId, body);
				},
				{
					body: UpdateCustomerAddressBody,
					params: t.Object({ addressId: t.String({ minLength: 1 }) }),
					response: CustomerReturn,
				},
			)
			.patch(
				"/me/notification-preferences",
				async ({ body, request, updateNotificationPreferences }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return updateNotificationPreferences.execute(userId, body);
				},
				{ body: UpdateNotificationPreferencesBody, response: CustomerReturn },
			)
			.delete(
				"/me/addresses/:addressId",
				async ({ deleteCustomerAddress, params, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					await deleteCustomerAddress.execute(userId, params.addressId);
					return { ok: true };
				},
				{
					params: t.Object({ addressId: t.String({ minLength: 1 }) }),
					response: t.Object({ ok: t.Boolean() }),
				},
			),
	);
