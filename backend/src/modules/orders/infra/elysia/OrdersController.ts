import Elysia from "elysia";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { createWhatsAppProvider } from "@/shared/infra/whatsapp";
import {
	AdminOrderListReturn,
	CreateOrderBody,
	ListOrdersQuery,
	OrderReturn,
	UpdateOrderStatusBody,
} from "../../dtos";
import { CreateOrder, ListOrders, UpdateOrderStatus } from "../../useCases";

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
