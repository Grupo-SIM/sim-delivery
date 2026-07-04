import Elysia from "elysia";
import { AuthGuard } from "@/modules/users/guards";
import { GlobalPlugin } from "@/shared/infra/elysia/global";
import { CreateOrderBody, OrderReturn } from "../../dtos";
import { CreateOrder } from "../../useCases";

export const OrdersController = new Elysia({
	detail: { tags: ["Orders"] },
})
	.use([GlobalPlugin])
	.group("/orders", app =>
		app
			.decorate(({ prisma, ...injected }) => ({
				...injected,
				createOrder: new CreateOrder(prisma),
				prisma,
			}))
			.post(
				"/",
				async ({ body, createOrder, request }) => {
					const { userId } = await AuthGuard.execute(request.headers);
					return createOrder.execute(userId, body);
				},
				{ body: CreateOrderBody, response: OrderReturn },
			),
	);
