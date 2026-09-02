import Elysia, { t } from "elysia";
import { RefundPayment } from "@/modules/payments/useCases";
import { AuthGuard, CompanyScopeGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { orderEvents } from "@/shared/infra/OrderEvents";
import { simpay } from "@/shared/infra/simpay";
import { createWhatsAppProvider } from "@/shared/infra/whatsapp";
import {
	AdminOrderListReturn,
	CloseOrdersDayReturn,
	CreateOrderBody,
	CustomerOrderListReturn,
	CustomerOrderTrackingReturn,
	GetCustomerOrderQuery,
	ListOrdersQuery,
	OrderReceiptReturn,
	OrderReturn,
	UpdateOrderStatusBody,
} from "../../dtos";
import {
	CloseOrdersDay,
	CreateOrder,
	GetCustomerOrder,
	GetOrderReceipt,
	ListCustomerOrders,
	ListOrders,
	UpdateOrderStatus,
} from "../../useCases";

const whatsApp = createWhatsAppProvider();
const encoder = new TextEncoder();
const sseHeaders = {
	"Cache-Control": "no-cache, no-transform",
	Connection: "keep-alive",
	"Content-Type": "text/event-stream",
	"X-Accel-Buffering": "no",
};

function orderChangedEvent(unitId: string): Uint8Array {
	return encoder.encode(`event: orders-changed\ndata: ${JSON.stringify({ unitId })}\n\n`);
}

export const OrdersController = new Elysia({ detail: { tags: ["Orders"] } })
	.use([GlobalPlugin])
	.group("/orders", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				closeOrdersDay: new CloseOrdersDay(prisma),
				createOrder: new CreateOrder(prisma),
				getCustomerOrder: new GetCustomerOrder(prisma),
				getOrderReceipt: new GetOrderReceipt(prisma),
				listCustomerOrders: new ListCustomerOrders(prisma),
				listOrders: new ListOrders(prisma),
				prisma,
				updateOrderStatus: new UpdateOrderStatus(prisma, whatsApp, new RefundPayment(prisma, simpay)),
			}))
			.get(
				"/events",
				async ({ query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "read");
					if (query.unitId) CompanyScopeGuard.authorizeUnit(scope, query.unitId);

					let close = () => undefined;
					const stream = new ReadableStream<Uint8Array>({
						cancel: () => close(),
						start(controller) {
							let closed = false;
							const send = (unitId: string) => {
								if (!closed) controller.enqueue(orderChangedEvent(unitId));
							};
							const unsubscribe = orderEvents.subscribe(scope.companyId!, query.unitId, send);
							const heartbeat = setInterval(() => {
								if (!closed) controller.enqueue(encoder.encode(": keepalive\n\n"));
							}, 25_000);
							const onAbort = () => close();

							close = () => {
								if (closed) return;
								closed = true;
								clearInterval(heartbeat);
								unsubscribe();
								request.signal.removeEventListener("abort", onAbort);
								controller.close();
							};

							request.signal.addEventListener("abort", onAbort, { once: true });
						},
					});

					return new Response(stream, { headers: sseHeaders });
				},
				{ query: t.Object({ unitId: t.Optional(t.String({ minLength: 1 })) }) },
			)
			.get(
				"/",
				async ({ listOrders, query, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "read");
					if (query.unitId) CompanyScopeGuard.authorizeUnit(scope, query.unitId);
					return listOrders.execute(scope.companyId, query, scope.role, scope.userId);
				},
				{ query: ListOrdersQuery, response: AdminOrderListReturn },
			)
			.post(
				"/close-day",
				async ({ closeOrdersDay, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "updateStatus");
					const result = await closeOrdersDay.execute(scope.companyId);
					orderEvents.publishCompany(scope.companyId!);
					return result;
				},
				{ response: CloseOrdersDayReturn },
			)
			.post(
				"/",
				async ({ body, createOrder, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					const order = await createOrder.execute(userId, body);
					orderEvents.publish(order.companyId, order.unitId);
					return order;
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
				"/:orderId/receipt",
				async ({ getOrderReceipt, params, request }) => {
					const scope = await CompanyScopeGuard.execute(request.headers);
					CompanyScopeGuard.authorize(scope, "orders", "print");
					return getOrderReceipt.execute(scope.companyId, params.orderId, scope.role, scope.userId);
				},
				{
					params: t.Object({ orderId: t.String({ minLength: 1 }) }),
					response: OrderReceiptReturn,
				},
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
					const order = await updateOrderStatus.execute(scope.companyId, params.orderId, body, scope.role, scope.userId);
					orderEvents.publish(order.companyId, order.unitId);
					return order;
				},
				{ body: UpdateOrderStatusBody, response: OrderReturn },
			),
	);
