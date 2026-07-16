import Elysia, { t } from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { createWhatsAppProvider } from "@/shared/infra/whatsapp";
import {
	AdminOrderListReturn,
	CreateOrderBody,
	CustomerOrderListReturn,
	CustomerOrderTrackingReturn,
	GetCustomerOrderQuery,
	ListOrdersQuery,
	OrderReturn,
	UpdateOrderStatusBody,
} from "../../dtos";
import { CreateOrder, GetCustomerOrder, ListCustomerOrders, ListOrders, UpdateOrderStatus } from "../../useCases";

const whatsApp = createWhatsAppProvider();

export const OrdersController = new Elysia({
	detail: { tags: ["Orders"] },
})
	.use([GlobalPlugin])
	.group("/orders", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createOrder: new CreateOrder(prisma),
				getCustomerOrder: new GetCustomerOrder(prisma),
				listCustomerOrders: new ListCustomerOrders(prisma),
				listOrders: new ListOrders(prisma),
				prisma,
				updateOrderStatus: new UpdateOrderStatus(prisma, whatsApp),
			}))
			.get(
				"/",
				async ({ listOrders, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "read");
					return listOrders.execute(scope.companyId, query);
				},
				{ query: ListOrdersQuery, response: AdminOrderListReturn },
			)
			.post(
				"/",
				async ({ body, createOrder, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createOrder.execute(userId, body);
				},
				{ body: CreateOrderBody, response: OrderReturn },
			)
			.get(
				"/mine",
				async ({ listCustomerOrders, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return listCustomerOrders.execute(userId, query.slug);
				},
				{ query: GetCustomerOrderQuery, response: CustomerOrderListReturn },
			)
			.get(
				"/:orderId/track",
				async ({ getCustomerOrder, params, query, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return getCustomerOrder.execute(userId, params.orderId, query.slug);
				},
				{
					params: t.Object({ orderId: t.String({ minLength: 1 }) }),
					query: GetCustomerOrderQuery,
					response: CustomerOrderTrackingReturn,
				},
			)
			.patch(
				"/:orderId/status",
				async ({ body, params, request, updateOrderStatus }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "updateStatus");
					return updateOrderStatus.execute(scope.companyId, params.orderId, body);
				},
				{ body: UpdateOrderStatusBody, response: OrderReturn },
			),
	);
