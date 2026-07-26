import Elysia, { t } from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import {
	CreateCustomerBody,
	CustomerAdminReturn,
	CustomerListReturn,
	CustomerReturn,
	GetMyCustomerQuery,
	ListCustomersQuery,
	MaybeCustomerReturn,
	UpdateCustomerPhoneBody,
	UpdateNotificationPreferencesBody,
} from "../../dtos";
import {
	DeleteCustomerAddress,
	GetCustomer,
	GetMyCustomer,
	ListCustomers,
	UpdateCustomerPhone,
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
				deleteCustomerAddress: new DeleteCustomerAddress(prisma),
				getCustomer: new GetCustomer(prisma),
				getMyCustomer: new GetMyCustomer(prisma),
				listCustomers: new ListCustomers(prisma),
				prisma,
				updateCustomerPhone: new UpdateCustomerPhone(prisma),
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
				"/me/notification-preferences",
				async ({ body, request, updateNotificationPreferences }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return updateNotificationPreferences.execute(userId, body);
				},
				{ body: UpdateNotificationPreferencesBody, response: CustomerReturn },
			)
			.patch(
				"/me/phone",
				async ({ body, request, updateCustomerPhone }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					await updateCustomerPhone.execute(userId, body.phone);
					return { ok: true };
				},
				{ body: UpdateCustomerPhoneBody, response: t.Object({ ok: t.Boolean() }) },
			)
			.delete(
				"/me/addresses/:addressId",
				async ({ deleteCustomerAddress, params, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					await deleteCustomerAddress.execute(userId, params.addressId);
					return { ok: true };
				},
				{ response: t.Object({ ok: t.Boolean() }) },
			),
	);
